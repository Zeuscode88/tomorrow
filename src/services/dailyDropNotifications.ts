import { AppIdea } from '../types/app';

const PREF_STORAGE_KEY = 'tomorrow_daily_notifications_enabled';
const SEEN_IDS_STORAGE_KEY = 'tomorrow_seen_daily_drop_ids';
const CHANNEL_NAME = 'tomorrow_daily_drop_notif_channel';
const MAX_SEEN_IDS = 120;

export type NotificationPermissionState = NotificationPermission | 'unsupported';

// Synchronized in-memory deduplication lock across rapid events
const inFlightNotifiedTags = new Set<string>();

function getBroadcastChannel(): BroadcastChannel | null {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      return new BroadcastChannel(CHANNEL_NAME);
    }
  } catch {}
  return null;
}

export function isDailyNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  );
}

export function getDailyNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export function isDailyNotificationsEnabled(): boolean {
  if (!isDailyNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    return localStorage.getItem(PREF_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDailyNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PREF_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {}
}

function loadSeenDailyDropIds(): string[] | null {
  try {
    const raw = localStorage.getItem(SEEN_IDS_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return null;
  }
}

function saveSeenDailyDropIds(ids: string[]): void {
  try {
    const unique = Array.from(new Set(ids)).slice(-MAX_SEEN_IDS);
    localStorage.setItem(SEEN_IDS_STORAGE_KEY, JSON.stringify(unique));
  } catch {}
}

/**
 * Seeds known daily drops on first boot without firing notifications for historical items.
 */
export function seedSeenDailyDropIds(apps: AppIdea[]): void {
  const dailyIds = apps.filter((a) => a.isDailyDrop).map((a) => a.id);
  if (dailyIds.length === 0) return;

  const existing = loadSeenDailyDropIds();
  if (existing === null) {
    saveSeenDailyDropIds(dailyIds);
    return;
  }

  const merged = Array.from(new Set([...existing, ...dailyIds]));
  saveSeenDailyDropIds(merged);
}

/**
 * Filters a list of apps to only newly published IA du jour items not yet seen,
 * marks them as seen, and returns the new items.
 */
export function extractNewUnseenDailyDrops(incomingApps: AppIdea[]): AppIdea[] {
  const dailyApps = incomingApps.filter((a) => a.isDailyDrop);
  if (dailyApps.length === 0) return [];

  const existing = loadSeenDailyDropIds();
  if (existing === null) {
    // First-time baseline initialization: seed without firing alerts for pre-existing drops
    saveSeenDailyDropIds(dailyApps.map((a) => a.id));
    return [];
  }

  const existingSet = new Set(existing);
  const unseen = dailyApps.filter((a) => !existingSet.has(a.id));

  if (unseen.length > 0) {
    saveSeenDailyDropIds([...existing, ...unseen.map((a) => a.id)]);
  }

  return unseen;
}

async function resolveActiveRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) {
      return existing;
    }
  } catch {}

  try {
    const ready = await Promise.race<ServiceWorkerRegistration | null>([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
    ]);
    return ready;
  } catch {
    return null;
  }
}

export interface DailyDropNotificationOptions {
  isTest?: boolean;
  bypassPreference?: boolean;
}

export async function showDailyDropLocalNotification(
  newApps: AppIdea[],
  options: DailyDropNotificationOptions = {}
): Promise<boolean> {
  if (!isDailyNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  if (!options.bypassPreference && !isDailyNotificationsEnabled()) return false;

  const firstApp = newApps[0];
  if (!firstApp && !options.isTest) return false;

  const batchTag = options.isTest
    ? `tomorrow-daily-drop-test-${Date.now()}`
    : newApps.length === 1
    ? `tomorrow-daily-drop-${firstApp.id}`
    : `tomorrow-daily-drop-batch-${firstApp.dailyDropDate || firstApp.id}`;

  if (!options.isTest) {
    if (inFlightNotifiedTags.has(batchTag)) {
      return false;
    }
    inFlightNotifiedTags.add(batchTag);
    setTimeout(() => inFlightNotifiedTags.delete(batchTag), 8000);

    // Notify peer tabs so they add this batchTag to their deduplication set
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'CLAIMED_TAG', tag: batchTag, ids: newApps.map((a) => a.id) });
      bc.close();
    }
  }

  const title = options.isTest
    ? 'Test · Alertes IA du jour actives'
    : newApps.length === 1
    ? `IA du jour · ${firstApp.title}`
    : `${newApps.length} nouvelles IA du jour publiées`;

  const body = options.isTest
    ? firstApp
      ? `Exemple : ${firstApp.title} (${firstApp.country}) — Vous serez alerté dès qu'une nouvelle IA du jour est publiée.`
      : "Les notifications locales via Service Worker sont prêtes pour chaque nouvelle IA du jour."
    : newApps.length === 1
    ? `${firstApp.country} · ${firstApp.tagline}`
    : `${newApps
        .map((a) => a.title)
        .slice(0, 3)
        .join(', ')}${newApps.length > 3 ? ` +${newApps.length - 3}` : ''} — Découvrez les nouveaux concepts pour l'Afrique.`;

  const appId = firstApp?.id || '';
  const url = appId ? `/?view=store&app=${encodeURIComponent(appId)}` : '/?view=store';

  const registration = await resolveActiveRegistration();
  if (!registration) {
    return false;
  }

  const payload = {
    title,
    body,
    tag: batchTag,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url,
    appId,
  };

  try {
    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      renotify: true,
      data: { url: payload.url, appId: payload.appId },
    } as NotificationOptions);
    return true;
  } catch (err) {
    if (registration.active) {
      registration.active.postMessage({
        type: 'SHOW_DAILY_DROP_NOTIFICATION',
        payload,
      });
      return true;
    }
    console.warn('Service Worker showNotification failed:', err);
    return false;
  }
}

export async function requestAndEnableDailyNotifications(
  currentApps: AppIdea[] = []
): Promise<{
  ok: boolean;
  permission: NotificationPermissionState;
  message: string;
}> {
  if (!isDailyNotificationSupported()) {
    return {
      ok: false,
      permission: 'unsupported',
      message: 'Les notifications Service Worker ne sont pas supportées sur ce navigateur.',
    };
  }

  let permission: NotificationPermission = Notification.permission;
  if (permission !== 'granted') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      return {
        ok: false,
        permission: Notification.permission,
        message: "Impossible d'ouvrir la demande de permission de notification.",
      };
    }
  }

  if (permission === 'granted') {
    setDailyNotificationsEnabled(true);
    seedSeenDailyDropIds(currentApps);
    return {
      ok: true,
      permission: 'granted',
      message: "Alertes locales activées ! Vous serez notifié à chaque nouvelle 'IA du jour'.",
    };
  }

  setDailyNotificationsEnabled(false);
  return {
    ok: false,
    permission,
    message:
      permission === 'denied'
        ? 'Notifications bloquées par le navigateur. Autorisez-les dans les paramètres du site.'
        : 'Autorisation de notification non accordée.',
  };
}

export function subscribeCrossTabNotificationClaims(): () => void {
  const bc = getBroadcastChannel();
  if (!bc) return () => {};

  const handler = (event: MessageEvent) => {
    const data = event.data;
    if (!data || data.type !== 'CLAIMED_TAG') return;
    if (typeof data.tag === 'string') {
      inFlightNotifiedTags.add(data.tag);
      setTimeout(() => inFlightNotifiedTags.delete(data.tag), 8000);
    }
    if (Array.isArray(data.ids)) {
      const existing = loadSeenDailyDropIds() || [];
      saveSeenDailyDropIds([...existing, ...data.ids]);
    }
  };

  bc.addEventListener('message', handler);
  return () => {
    bc.removeEventListener('message', handler);
    bc.close();
  };
}
