import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  AvailabilityStatus,
  ConnectionInvite,
  DirectMessage,
  PortfolioItem,
  PublicProfile,
} from '../types/social';

export interface SavePortfolioPayload {
  name?: string;
  role?: string;
  country?: string;
  headline: string;
  bio: string;
  skills: string[];
  portfolioItems: PortfolioItem[];
  githubUrl?: string;
  websiteUrl?: string;
  availability: AvailabilityStatus;
}

export async function fetchPublicProfiles(
  search?: string,
  availability?: string
): Promise<PublicProfile[]> {
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.set('q', search.trim());
    if (availability && availability !== 'Tous') params.set('availability', availability);
    const qs = params.toString();
    const res = await fetch(`/api/profiles${qs ? `?${qs}` : ''}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.profiles)) {
      return data.profiles as PublicProfile[];
    }
    return [];
  } catch (err) {
    console.warn('Error fetching public profiles:', err);
    return [];
  }
}

export async function fetchPublicProfileDetail(userId: string): Promise<{
  profile: PublicProfile | null;
  stats: { buildsCount: number; pledgesCount: number };
}> {
  try {
    const res = await fetch(`/api/profiles/${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (data.success && data.profile) {
      return {
        profile: data.profile as PublicProfile,
        stats: data.stats || { buildsCount: 0, pledgesCount: 0 },
      };
    }
    return { profile: null, stats: { buildsCount: 0, pledgesCount: 0 } };
  } catch {
    return { profile: null, stats: { buildsCount: 0, pledgesCount: 0 } };
  }
}

async function mirrorProfileToFirestore(profile: PublicProfile): Promise<void> {
  try {
    if (!auth.currentUser || auth.currentUser.uid !== profile.id) return;
    await setDoc(doc(db, 'public_profiles', profile.id), profile, { merge: true });
  } catch (err) {
    console.warn('Firestore public_profiles mirror skipped:', err);
  }
}

export async function saveMyPortfolio(
  token: string,
  payload: SavePortfolioPayload
): Promise<{ success: boolean; profile?: PublicProfile; error?: string }> {
  try {
    const res = await fetch('/api/profiles/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success && data.profile) {
      mirrorProfileToFirestore(data.profile as PublicProfile);
      return { success: true, profile: data.profile as PublicProfile };
    }
    return { success: false, error: data.error || 'Impossible de sauvegarder le portfolio.' };
  } catch {
    return { success: false, error: 'Erreur réseau lors de la sauvegarde du portfolio.' };
  }
}

export async function fetchInvitations(token: string): Promise<ConnectionInvite[]> {
  try {
    const res = await fetch('/api/invitations', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.invitations)) {
      return data.invitations as ConnectionInvite[];
    }
    return [];
  } catch {
    return [];
  }
}

export async function sendInvitation(
  token: string,
  toUserId: string,
  note?: string
): Promise<{ success: boolean; invitation?: ConnectionInvite; error?: string }> {
  try {
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ toUserId, note }),
    });
    const data = await res.json();
    if (data.success && data.invitation) {
      return { success: true, invitation: data.invitation as ConnectionInvite };
    }
    return {
      success: false,
      invitation: data.invitation,
      error: data.error || "Impossible d'envoyer l'invitation.",
    };
  } catch {
    return { success: false, error: "Erreur réseau lors de l'envoi de l'invitation." };
  }
}

export async function respondToInvitation(
  token: string,
  inviteId: string,
  action: 'accepted' | 'declined' | 'cancel'
): Promise<{
  success: boolean;
  invitation?: ConnectionInvite;
  removedId?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/invitations/${encodeURIComponent(inviteId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.success) {
      return {
        success: true,
        invitation: data.invitation as ConnectionInvite | undefined,
        removedId: data.removedId as string | undefined,
      };
    }
    return { success: false, error: data.error || "Action impossible sur l'invitation." };
  } catch {
    return { success: false, error: 'Erreur réseau lors du traitement de l’invitation.' };
  }
}

export async function fetchMessages(token: string, peerId?: string): Promise<DirectMessage[]> {
  try {
    const qs = peerId ? `?peerId=${encodeURIComponent(peerId)}` : '';
    const res = await fetch(`/api/messages${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.messages)) {
      return data.messages as DirectMessage[];
    }
    return [];
  } catch {
    return [];
  }
}

export async function sendShortMessage(
  token: string,
  recipientId: string,
  text: string
): Promise<{ success: boolean; message?: DirectMessage; error?: string }> {
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipientId, text }),
    });
    const data = await res.json();
    if (data.success && data.message) {
      return { success: true, message: data.message as DirectMessage };
    }
    return { success: false, error: data.error || "Impossible d'envoyer le message." };
  } catch {
    return { success: false, error: "Erreur réseau lors de l'envoi du message." };
  }
}

import { AppIdea } from '../types/app';

export interface DailyDropPublishedPayload {
  apps: AppIdea[];
  publishedAt: string;
  source?: 'ai' | 'admin' | 'community';
}

export interface SocialSocketHandlers {
  onProfileUpdated?: (profile: PublicProfile) => void;
  onInviteCreated?: (invite: ConnectionInvite) => void;
  onInviteUpdated?: (invite: ConnectionInvite) => void;
  onInviteRemoved?: (removedId: string) => void;
  onMessageCreated?: (message: DirectMessage) => void;
  onDailyDropPublished?: (payload: DailyDropPublishedPayload) => void;
}

export function connectSocialSocket(
  token: string | null | undefined,
  handlers: SocialSocketHandlers
): () => void {
  if (typeof window === 'undefined') return () => {};

  let ws: WebSocket | null = null;
  let closedByClient = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let retryDelay = 1200;

  const connect = () => {
    if (closedByClient) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/social`;

    try {
      ws = new WebSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      retryDelay = 1200;
      if (token) {
        ws?.send(JSON.stringify({ type: 'auth', token }));
      }
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (!msg || typeof msg.event !== 'string') return;
        switch (msg.event) {
          case 'profile:updated':
            if (msg.payload) handlers.onProfileUpdated?.(msg.payload as PublicProfile);
            break;
          case 'invite:created':
            if (msg.payload) handlers.onInviteCreated?.(msg.payload as ConnectionInvite);
            break;
          case 'invite:updated':
            if (msg.payload) handlers.onInviteUpdated?.(msg.payload as ConnectionInvite);
            break;
          case 'invite:removed':
            if (msg.payload?.id) handlers.onInviteRemoved?.(String(msg.payload.id));
            break;
          case 'message:created':
            if (msg.payload) handlers.onMessageCreated?.(msg.payload as DirectMessage);
            break;
          case 'daily_drop:published':
            if (msg.payload && Array.isArray(msg.payload.apps)) {
              handlers.onDailyDropPublished?.(msg.payload as DailyDropPublishedPayload);
            }
            break;
          default:
            break;
        }
      } catch {
        // Ignore malformed WS packets
      }
    };

    ws.onclose = () => {
      if (!closedByClient) {
        scheduleReconnect();
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  };

  const scheduleReconnect = () => {
    if (closedByClient || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      retryDelay = Math.min(10000, Math.round(retryDelay * 1.6));
      connect();
    }, retryDelay);
  };

  connect();

  return () => {
    closedByClient = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
  };
}
