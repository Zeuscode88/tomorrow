import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  ArrowLeft,
  StickyNote,
  Plus,
  Pin,
  Trash2,
  CheckSquare,
  Square,
  Search,
  Upload,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Building2,
  AlertTriangle,
  Pencil,
} from 'lucide-react';
import { AppIdea } from '../types/app';
import { User } from '../types/auth';
import { KeepChecklistItem, KeepNote } from '../types/notes';
import {
  createGoogleKeepEnterpriseNote,
  deleteKeepNote,
  fetchKeepNotes,
  getKeepEnterpriseToken,
  listGoogleKeepEnterpriseNotes,
  parseGoogleKeepTakeoutJson,
  saveKeepNote,
  setKeepEnterpriseToken,
} from '../services/keepNotesService';
import { signInWithGoogle } from '../services/firebaseAuthService';

interface GoogleKeepModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  authToken: string | null;
  initialAppIdea?: AppIdea | null;
  onClearInitialAppIdea?: () => void;
  onOpenAuth: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  onShowToast: (msg: string) => void;
}

type PendingConfirmAction =
  | { type: 'delete_note'; note: KeepNote }
  | { type: 'push_enterprise'; note: KeepNote }
  | { type: 'import_takeout'; drafts: Array<Omit<KeepNote, 'id' | 'updatedAt'>> };

export const GoogleKeepModal: React.FC<GoogleKeepModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  authToken,
  initialAppIdea = null,
  onClearInitialAppIdea,
  onOpenAuth,
  onLoginSuccess,
  onShowToast,
}) => {
  const [notes, setNotes] = useState<KeepNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Editor state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isChecklist, setIsChecklist] = useState(false);
  const [checklistItems, setChecklistItems] = useState<KeepChecklistItem[]>([]);
  const [newChecklistLine, setNewChecklistLine] = useState('');
  const [pinned, setPinned] = useState(false);
  const [linkedAppId, setLinkedAppId] = useState<string | undefined>(undefined);
  const [linkedAppTitle, setLinkedAppTitle] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Enterprise Keep API v1 drawer (in-memory token only)
  const [showEnterprisePanel, setShowEnterprisePanel] = useState(false);
  const [enterpriseTokenInput, setEnterpriseTokenInput] = useState(
    () => getKeepEnterpriseToken() || ''
  );
  const [isSyncingEnterprise, setIsSyncingEnterprise] = useState(false);

  // Explicit confirmation modal before destructive or Keep API sync actions
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadNotes = async () => {
    if (!currentUser || !authToken) return;
    setIsLoading(true);
    try {
      const list = await fetchKeepNotes(authToken);
      setNotes(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser && authToken) {
      loadNotes();
    }
  }, [isOpen, currentUser?.id, authToken]);

  useEffect(() => {
    if (!isOpen || !initialAppIdea) return;
    setEditingNoteId(null);
    setTitle(`${initialAppIdea.title} — Brief & Tâches`);
    setBody(
      `Pays : ${initialAppIdea.country} (${initialAppIdea.sector})\nProblème : ${initialAppIdea.problemSolved}\nStack conseillée : ${initialAppIdea.techStackSuggested.join(', ')}\nConseil architecture : ${initialAppIdea.developerBrief?.architecturalTip || ''}`
    );
    const mvpItems: KeepChecklistItem[] = (initialAppIdea.developerBrief?.mvpScope || []).map(
      (step, idx) => ({
        id: `mvp-${Date.now()}-${idx}`,
        text: step,
        checked: false,
      })
    );
    setIsChecklist(mvpItems.length > 0);
    setChecklistItems(mvpItems);
    setPinned(true);
    setLinkedAppId(initialAppIdea.id);
    setLinkedAppTitle(initialAppIdea.title);
  }, [isOpen, initialAppIdea]);

  const resetEditor = () => {
    setEditingNoteId(null);
    setTitle('');
    setBody('');
    setIsChecklist(false);
    setChecklistItems([]);
    setNewChecklistLine('');
    setPinned(false);
    setLinkedAppId(undefined);
    setLinkedAppTitle(undefined);
    onClearInitialAppIdea?.();
  };

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        (n.linkedAppTitle || '').toLowerCase().includes(q) ||
        n.checklistItems.some((it) => it.text.toLowerCase().includes(q))
    );
  }, [notes, search]);

  if (!isOpen) return null;

  const handleGoogleConnect = async () => {
    try {
      const { user, token } = await signInWithGoogle();
      onLoginSuccess(user, token);
      onShowToast(`Connecté avec Google (${user.email}). Vos notes sont synchronisées.`);
    } catch (err: any) {
      onShowToast(err?.message || 'Connexion Google annulée.');
    }
  };

  const handleAddChecklistLine = () => {
    const clean = newChecklistLine.trim();
    if (!clean) return;
    setChecklistItems((prev) => [
      ...prev,
      { id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: clean, checked: false },
    ]);
    setNewChecklistLine('');
  };

  const handleSaveNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !authToken) {
      onOpenAuth();
      return;
    }
    if (!title.trim() && !body.trim() && checklistItems.length === 0) {
      onShowToast('Ajoutez un titre, un texte ou au moins une case à cocher.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveKeepNote(authToken, {
        id: editingNoteId || undefined,
        title: title.trim() || 'Note sans titre',
        body,
        isChecklist,
        checklistItems,
        pinned,
        linkedAppId,
        linkedAppTitle,
        source: 'local',
      });
      if (res.success && res.note) {
        const saved = res.note;
        setNotes((prev) => {
          const rest = prev.filter((n) => n.id !== saved.id);
          return [saved, ...rest].sort(
            (a, b) =>
              Number(b.pinned) - Number(a.pinned) ||
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
        onShowToast(editingNoteId ? 'Note mise à jour.' : 'Note enregistrée dans votre espace Keep.');
        resetEditor();
      } else {
        onShowToast(res.error || 'Impossible de sauvegarder la note.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleChecklistItemInCard = async (note: KeepNote, itemId: string) => {
    if (!authToken) return;
    const nextItems = note.checklistItems.map((it) =>
      it.id === itemId ? { ...it, checked: !it.checked } : it
    );
    const res = await saveKeepNote(authToken, {
      ...note,
      checklistItems: nextItems,
    });
    if (res.success && res.note) {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? res.note! : n)));
    }
  };

  const handleTogglePinCard = async (note: KeepNote) => {
    if (!authToken) return;
    const res = await saveKeepNote(authToken, {
      ...note,
      pinned: !note.pinned,
    });
    if (res.success && res.note) {
      setNotes((prev) =>
        prev
          .map((n) => (n.id === note.id ? res.note! : n))
          .sort(
            (a, b) =>
              Number(b.pinned) - Number(a.pinned) ||
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
      );
    }
  };

  const handleCopyForKeep = (note: KeepNote) => {
    const lines: string[] = [note.title];
    if (note.body) lines.push(note.body);
    if (note.isChecklist && note.checklistItems.length > 0) {
      note.checklistItems.forEach((it) => {
        lines.push(`${it.checked ? '[x]' : '[ ]'} ${it.text}`);
      });
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n\n'));
      onShowToast('Note copiée pour collage direct dans Google Keep.');
    }
  };

  const handleTakeoutFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !currentUser) return;
    try {
      const text = await file.text();
      const drafts = parseGoogleKeepTakeoutJson(text, currentUser.id);
      if (drafts.length === 0) {
        onShowToast('Aucune note valide détectée dans ce fichier JSON Google Keep.');
        return;
      }
      setPendingConfirm({ type: 'import_takeout', drafts });
    } catch {
      onShowToast('Fichier JSON Google Takeout invalide.');
    }
  };

  const handleImportFromEnterpriseApi = async () => {
    if (!authToken || !currentUser) return;
    const tok = enterpriseTokenInput.trim();
    if (!tok) {
      onShowToast('Saisissez un jeton Bearer Google Workspace Enterprise valide.');
      return;
    }
    setKeepEnterpriseToken(tok);
    setIsSyncingEnterprise(true);
    try {
      const { notes: remoteNotes, error } = await listGoogleKeepEnterpriseNotes(tok);
      if (error) {
        onShowToast(error);
        return;
      }
      if (remoteNotes.length === 0) {
        onShowToast('Aucune note trouvée via Google Keep Enterprise API.');
        return;
      }
      const drafts = remoteNotes.map((r) => ({ ...r, ownerId: currentUser.id }));
      setPendingConfirm({ type: 'import_takeout', drafts });
    } finally {
      setIsSyncingEnterprise(false);
    }
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirm || !authToken) {
      setPendingConfirm(null);
      return;
    }

    const action = pendingConfirm;
    setPendingConfirm(null);

    if (action.type === 'delete_note') {
      const res = await deleteKeepNote(authToken, action.note);
      if (res.success) {
        setNotes((prev) => prev.filter((n) => n.id !== action.note.id));
        if (editingNoteId === action.note.id) resetEditor();
        onShowToast('Note supprimée définitivement.');
      } else {
        onShowToast(res.error || 'Suppression impossible.');
      }
      return;
    }

    if (action.type === 'push_enterprise') {
      const tok = enterpriseTokenInput.trim() || getKeepEnterpriseToken();
      if (!tok) {
        setShowEnterprisePanel(true);
        onShowToast('Ajoutez d’abord votre jeton Enterprise Google Keep.');
        return;
      }
      setKeepEnterpriseToken(tok);
      const res = await createGoogleKeepEnterpriseNote(tok, action.note);
      if (res.success) {
        onShowToast(`Note "${action.note.title}" envoyée vers Google Keep Enterprise.`);
      } else {
        onShowToast(res.error || "Échec de l'envoi vers Google Keep Enterprise.");
      }
      return;
    }

    if (action.type === 'import_takeout') {
      let imported = 0;
      for (const draft of action.drafts) {
        const res = await saveKeepNote(authToken, {
          title: draft.title,
          body: draft.body,
          isChecklist: draft.isChecklist,
          checklistItems: draft.checklistItems,
          pinned: draft.pinned,
          source: draft.source,
        });
        if (res.success && res.note) {
          imported += 1;
        }
      }
      await loadNotes();
      onShowToast(`${imported} note(s) importée(s) avec succès.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 sm:p-5 md:p-6 shadow-2xl my-2 sm:my-4 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3.5">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Retour</span>
            </button>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
              <StickyNote className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                Notes & Checklists Google Keep
              </h2>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Carnet projet personnel synchronisé · Import Takeout & API Enterprise
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href="https://keep.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-[10.5px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 hover:border-black dark:hover:border-white transition-colors whitespace-nowrap"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span>keep.google.com</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!currentUser || !authToken ? (
          <div className="py-12 text-center space-y-4 my-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black">
              <StickyNote className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Connectez votre compte pour vos Notes Keep
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Sauvegardez vos idées, checklists MVP et notes importées de Google Keep dans votre espace privé synchronisé.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleGoogleConnect}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white hover:border-black dark:hover:border-white"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>Connexion avec Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-2.5 text-xs font-bold text-white dark:text-black"
              >
                <span>Connexion Email / PIN</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pt-4 space-y-5 pr-1">
            {/* Scope transparency banner + quick actions */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-3.5 text-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Espace Notes synchronisé pour {currentUser.email}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleTakeoutFileSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-100 hover:border-black dark:hover:border-white"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Importer JSON Google Takeout</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEnterprisePanel((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-100 hover:border-black dark:hover:border-white"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>API Keep Enterprise</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Google réserve l’API <code className="font-mono">keep.googleapis.com</code> aux comptes Google Workspace Entreprise (délégation de domaine). Pour tous les comptes Gmail standards, vos notes et checklists restent sauvegardées ici (Firestore + serveur) avec import JSON Google Takeout et copie directe vers Keep.
              </p>

              {showEnterprisePanel && (
                <div className="mt-2 pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    Jeton Bearer OAuth Google Workspace Enterprise (conservé uniquement en mémoire RAM)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      value={enterpriseTokenInput}
                      onChange={(e) => {
                        setEnterpriseTokenInput(e.target.value);
                        setKeepEnterpriseToken(e.target.value);
                      }}
                      placeholder="ya29.a0..."
                      className="flex-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleImportFromEnterpriseApi}
                      disabled={isSyncingEnterprise}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isSyncingEnterprise ? 'animate-spin' : ''}`} />
                      <span>Importer depuis Keep API</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Note / Checklist Composer */}
            <form
              onSubmit={handleSaveNoteSubmit}
              className="rounded-2xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingNoteId ? 'Modifier la note' : 'Nouvelle note'}
                  {linkedAppTitle ? ` · Projet : ${linkedAppTitle}` : ''}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChecklist((v) => !v)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                      isChecklist
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                        : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    <CheckSquare className="h-3 w-3" />
                    <span>Checklist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPinned((v) => !v)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                      pinned
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                        : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    <Pin className="h-3 w-3" />
                    <span>{pinned ? 'Épinglée' : 'Épingler'}</span>
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la note..."
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
              />

              <textarea
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Prendre une note rapide, notes d'architecture, contacts terrain..."
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none resize-y"
              />

              {isChecklist && (
                <div className="space-y-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 p-3">
                  <div className="space-y-1.5">
                    {checklistItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setChecklistItems((prev) =>
                              prev.map((x) => (x.id === item.id ? { ...x, checked: !x.checked } : x))
                            )
                          }
                          className="text-slate-700 dark:text-slate-200 shrink-0"
                        >
                          {item.checked ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                        <span
                          className={`flex-1 ${
                            item.checked
                              ? 'line-through text-slate-400'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {item.text}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setChecklistItems((prev) => prev.filter((x) => x.id !== item.id))
                          }
                          className="text-slate-400 hover:text-black dark:hover:text-white p-1"
                          aria-label="Supprimer l'élément"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newChecklistLine}
                      onChange={(e) => setNewChecklistLine(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChecklistLine();
                        }
                      }}
                      placeholder="Ajouter un élément à cocher..."
                      className="flex-1 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklistLine}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2">
                {(editingNoteId || title || body || checklistItems.length > 0) && (
                  <button
                    type="button"
                    onClick={resetEditor}
                    className="rounded-xl border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900"
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isSaving ? 'Sauvegarde...' : editingNoteId ? 'Mettre à jour' : 'Enregistrer la note'}</span>
                </button>
              </div>
            </form>

            {/* Search bar */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher dans vos notes et checklists..."
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
              />
            </div>

            {/* Notes Grid */}
            {isLoading ? (
              <div className="py-10 text-center text-xs text-slate-500">Chargement de vos notes...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                Aucune note enregistrée pour l’instant. Créez une note ci-dessus ou importez votre export JSON Google Keep.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col justify-between gap-3 hover:border-black dark:hover:border-white transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            {note.pinned && (
                              <span className="rounded bg-black dark:bg-white px-1.5 py-0.5 text-[9px] font-bold text-white dark:text-black uppercase">
                                Épinglée
                              </span>
                            )}
                            <span className="rounded bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:text-slate-300 uppercase">
                              {note.source === 'takeout'
                                ? 'Import Takeout'
                                : note.source === 'google_keep_api'
                                ? 'Keep API'
                                : 'Carnet tomorrow'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white break-words">
                            {note.title}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTogglePinCard(note)}
                          className={`rounded-lg p-1.5 border ${
                            note.pinned
                              ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                              : 'border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-black dark:hover:text-white'
                          }`}
                          title={note.pinned ? 'Désépingler' : 'Épingler'}
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {note.body && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed break-words">
                          {note.body}
                        </p>
                      )}

                      {note.isChecklist && note.checklistItems.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {note.checklistItems.map((it) => (
                            <button
                              key={it.id}
                              type="button"
                              onClick={() => handleToggleChecklistItemInCard(note, it.id)}
                              className="w-full flex items-start gap-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-lg p-1 transition-colors"
                            >
                              {it.checked ? (
                                <CheckSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-black dark:text-white" />
                              ) : (
                                <Square className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                              )}
                              <span className={it.checked ? 'line-through text-slate-400' : ''}>
                                {it.text}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-zinc-800 pt-2.5 text-[11px]">
                      <span className="text-slate-400">
                        {new Date(note.updatedAt).toLocaleDateString('fr-FR')}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setTitle(note.title);
                            setBody(note.body);
                            setIsChecklist(note.isChecklist);
                            setChecklistItems(note.checklistItems || []);
                            setPinned(note.pinned);
                            setLinkedAppId(note.linkedAppId);
                            setLinkedAppTitle(note.linkedAppTitle);
                          }}
                          className="rounded-lg border border-slate-200 dark:border-zinc-700 p-1.5 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white"
                          title="Modifier"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyForKeep(note)}
                          className="rounded-lg border border-slate-200 dark:border-zinc-700 p-1.5 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white"
                          title="Copier pour Google Keep"
                        >
                          <Copy className="h-3 w-3" />
                        </button>

                        {enterpriseTokenInput.trim() && (
                          <button
                            type="button"
                            onClick={() => setPendingConfirm({ type: 'push_enterprise', note })}
                            className="rounded-lg border border-slate-200 dark:border-zinc-700 px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:border-black dark:hover:border-white"
                            title="Envoyer vers Google Keep Enterprise API"
                          >
                            Sync Keep
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setPendingConfirm({ type: 'delete_note', note })}
                          className="rounded-lg border border-slate-200 dark:border-zinc-700 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explicit Confirmation Dialog (required before destructive or remote Keep actions) */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {pendingConfirm.type === 'delete_note'
                  ? 'Confirmer la suppression'
                  : pendingConfirm.type === 'push_enterprise'
                  ? 'Exporter vers Google Keep'
                  : 'Confirmer l’importation'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {pendingConfirm.type === 'delete_note' &&
                `Voulez-vous vraiment supprimer définitivement la note « ${pendingConfirm.note.title} » ?`}
              {pendingConfirm.type === 'push_enterprise' &&
                `Confirmez-vous la création de la note « ${pendingConfirm.note.title} » dans votre espace Google Keep Enterprise ?`}
              {pendingConfirm.type === 'import_takeout' &&
                `Voulez-vous importer ${pendingConfirm.drafts.length} note(s) dans votre carnet synchronisé tomorrow ?`}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="rounded-xl border border-slate-300 dark:border-zinc-700 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
