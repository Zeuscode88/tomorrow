import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { KeepChecklistItem, KeepNote } from '../types/notes';

// In-memory only Enterprise Google Keep OAuth token (never stored in localStorage/sessionStorage)
let keepEnterpriseAccessToken: string | null = null;

export function setKeepEnterpriseToken(token: string | null): void {
  keepEnterpriseAccessToken = token && token.trim() ? token.trim() : null;
}

export function getKeepEnterpriseToken(): string | null {
  return keepEnterpriseAccessToken;
}

export async function fetchKeepNotes(appAuthToken: string): Promise<KeepNote[]> {
  try {
    const res = await fetch('/api/notes', {
      headers: { Authorization: `Bearer ${appAuthToken}` },
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.notes)) {
      return data.notes as KeepNote[];
    }
  } catch (err) {
    console.warn('Server notes fetch failed, checking Firestore:', err);
  }

  try {
    if (auth.currentUser) {
      const q = query(
        collection(db, 'notes'),
        where('ownerId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const out: KeepNote[] = [];
      snap.forEach((d) => {
        const item = d.data() as KeepNote;
        if (item?.id) out.push(item);
      });
      return out.sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
  } catch (err) {
    console.warn('Firestore notes fallback skipped:', err);
  }

  return [];
}

async function mirrorNoteToFirestore(note: KeepNote): Promise<void> {
  try {
    if (!auth.currentUser || auth.currentUser.uid !== note.ownerId) return;
    await setDoc(doc(db, 'notes', note.id), note, { merge: true });
  } catch (err) {
    console.warn('Firestore note mirror skipped:', err);
  }
}

async function deleteNoteFromFirestore(noteId: string, ownerId: string): Promise<void> {
  try {
    if (!auth.currentUser || auth.currentUser.uid !== ownerId) return;
    await deleteDoc(doc(db, 'notes', noteId));
  } catch (err) {
    console.warn('Firestore note delete skipped:', err);
  }
}

export async function saveKeepNote(
  appAuthToken: string,
  payload: {
    id?: string;
    title: string;
    body: string;
    isChecklist: boolean;
    checklistItems: KeepChecklistItem[];
    pinned: boolean;
    linkedAppId?: string;
    linkedAppTitle?: string;
    source?: 'local' | 'takeout' | 'google_keep_api';
  }
): Promise<{ success: boolean; note?: KeepNote; error?: string }> {
  try {
    const isUpdate = Boolean(payload.id);
    const url = isUpdate
      ? `/api/notes/${encodeURIComponent(payload.id!)}`
      : '/api/notes';
    const res = await fetch(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appAuthToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success && data.note) {
      mirrorNoteToFirestore(data.note as KeepNote);
      return { success: true, note: data.note as KeepNote };
    }
    return { success: false, error: data.error || 'Impossible de sauvegarder la note.' };
  } catch {
    return { success: false, error: 'Erreur réseau lors de la sauvegarde.' };
  }
}

export async function deleteKeepNote(
  appAuthToken: string,
  note: KeepNote
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/notes/${encodeURIComponent(note.id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${appAuthToken}` },
    });
    const data = await res.json();
    if (data.success) {
      deleteNoteFromFirestore(note.id, note.ownerId);
      return { success: true };
    }
    return { success: false, error: data.error || 'Impossible de supprimer la note.' };
  } catch {
    return { success: false, error: 'Erreur réseau lors de la suppression.' };
  }
}

// Parse Google Keep Takeout JSON export into KeepNote drafts
export function parseGoogleKeepTakeoutJson(
  rawJson: string,
  ownerId: string
): Array<Omit<KeepNote, 'id' | 'updatedAt'>> {
  const parsed = JSON.parse(rawJson);
  const items = Array.isArray(parsed) ? parsed : [parsed];
  const out: Array<Omit<KeepNote, 'id' | 'updatedAt'>> = [];

  for (const item of items.slice(0, 30)) {
    if (!item || typeof item !== 'object' || item.isTrashed) continue;
    const title = String(item.title || 'Note importée Keep').slice(0, 160);
    const listContent = Array.isArray(item.listContent) ? item.listContent : null;
    const checklistItems: KeepChecklistItem[] = listContent
      ? listContent
          .filter((li: any) => li && typeof li.text === 'string' && li.text.trim())
          .slice(0, 50)
          .map((li: any, idx: number) => ({
            id: `chk-${Date.now()}-${idx}`,
            text: String(li.text).trim().slice(0, 200),
            checked: Boolean(li.isChecked),
          }))
      : [];

    const body = String(item.textContent || '').slice(0, 3000);
    if (!title && !body && checklistItems.length === 0) continue;

    out.push({
      ownerId,
      title,
      body,
      isChecklist: checklistItems.length > 0,
      checklistItems,
      pinned: Boolean(item.isPinned),
      source: 'takeout',
    });
  }
  return out;
}

// Enterprise Google Keep API v1 client (requires Workspace Enterprise Domain-Wide Delegation token)
export async function listGoogleKeepEnterpriseNotes(
  enterpriseToken: string
): Promise<{ notes: Array<Omit<KeepNote, 'id' | 'ownerId' | 'updatedAt'>>; error?: string }> {
  try {
    const res = await fetch('https://keep.googleapis.com/v1/notes?pageSize=25', {
      headers: { Authorization: `Bearer ${enterpriseToken}` },
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        notes: [],
        error:
          data?.error?.message ||
          "L'API Google Keep Enterprise a refusé le jeton (compte Workspace Entreprise requis).",
      };
    }

    const rawNotes = Array.isArray(data.notes) ? data.notes : [];
    const mapped: Array<Omit<KeepNote, 'id' | 'ownerId' | 'updatedAt'>> = rawNotes.map(
      (n: any) => {
        const textBody = n?.body?.text?.text || '';
        const listItemsRaw = n?.body?.list?.listItems;
        const checklistItems: KeepChecklistItem[] = Array.isArray(listItemsRaw)
          ? listItemsRaw.slice(0, 50).map((li: any, idx: number) => ({
              id: `gk-${idx}-${Date.now()}`,
              text: String(li?.text?.text || '').slice(0, 200),
              checked: Boolean(li?.checked),
            }))
          : [];
        return {
          title: String(n.title || 'Note Google Keep').slice(0, 160),
          body: String(textBody).slice(0, 3000),
          isChecklist: checklistItems.length > 0,
          checklistItems,
          pinned: false,
          source: 'google_keep_api',
        };
      }
    );

    return { notes: mapped };
  } catch {
    return {
      notes: [],
      error: "Impossible de joindre keep.googleapis.com. Vérifiez votre connexion ou jeton Enterprise.",
    };
  }
}

export async function createGoogleKeepEnterpriseNote(
  enterpriseToken: string,
  note: KeepNote
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = note.isChecklist
      ? {
          title: note.title,
          body: {
            list: {
              listItems: note.checklistItems.map((item) => ({
                text: { text: item.text },
                checked: item.checked,
              })),
            },
          },
        }
      : {
          title: note.title,
          body: {
            text: { text: note.body || '' },
          },
        };

    const res = await fetch('https://keep.googleapis.com/v1/notes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${enterpriseToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error:
          errData?.error?.message ||
          'Échec de création sur Google Keep Enterprise.',
      };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Erreur réseau vers Google Keep Enterprise.' };
  }
}
