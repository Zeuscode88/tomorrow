import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

interface SWNotificationData {
  url?: string;
  appId?: string;
}

interface SWNotificationLike {
  data?: SWNotificationData;
  close: () => void;
}

interface SWWindowClientLike {
  url: string;
  focus: () => Promise<SWWindowClientLike>;
  postMessage: (message: unknown) => void;
}

interface SWExtendableEvent extends Event {
  waitUntil: (promise: Promise<unknown>) => void;
}

interface SWMessageEvent extends SWExtendableEvent {
  data: any;
}

interface SWNotificationEvent extends SWExtendableEvent {
  notification: SWNotificationLike;
}

interface SWPushEvent extends SWExtendableEvent {
  data?: {
    json: () => any;
    text: () => string;
  } | null;
}

interface SWManifestEntry {
  url: string;
  revision?: string | null;
}

declare global {
  interface Window {
    __WB_MANIFEST?: Array<SWManifestEntry | string>;
  }
}

interface SWGlobalScope {
  location: Location;
  registration: ServiceWorkerRegistration;
  clients: {
    matchAll: (options?: { type?: 'window' | 'worker' | 'sharedworker' | 'all'; includeUncontrolled?: boolean }) => Promise<SWWindowClientLike[]>;
    openWindow: (url: string) => Promise<SWWindowClientLike | null>;
  };
  skipWaiting: () => Promise<void>;
  addEventListener: (type: string, listener: (event: any) => void) => void;
}

const sw = globalThis as unknown as SWGlobalScope;

cleanupOutdatedCaches();

const manifestEntries: Array<SWManifestEntry | string> = self.__WB_MANIFEST || [];
precacheAndRoute(manifestEntries);

const hasIndexPrecached = manifestEntries.some((entry) => {
  const url = typeof entry === 'string' ? entry : entry.url;
  return url === 'index.html' || url === '/index.html';
});

if (hasIndexPrecached) {
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL('/index.html'), {
      denylist: [/^\/api\//, /^\/ws\//],
    })
  );
}

// Runtime caching preserved from PWA config
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /\/api\/(apps|builds)(\/.*)?$/i,
  new NetworkFirst({
    cacheName: 'tomorrow-api-offline-cache',
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

sw.addEventListener('install', () => {
  sw.skipWaiting();
});

sw.addEventListener('activate', () => {
  clientsClaim();
});

interface DailyDropNotificationPayload {
  title?: string;
  body?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  url?: string;
  appId?: string;
}

async function displayDailyDropNotification(payload: DailyDropNotificationPayload) {
  const title = payload.title || 'Nouvelle IA du jour sur tomorrow';
  const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body: payload.body || "Un nouveau concept d'application africaine vient d'être publié.",
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    tag: payload.tag || 'tomorrow-daily-drop',
    renotify: true,
    vibrate: [120, 60, 120],
    data: {
      url: payload.url || '/?view=store',
      appId: payload.appId || '',
    },
  };

  await sw.registration.showNotification(title, options);
}

sw.addEventListener('message', (event: SWMessageEvent) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SKIP_WAITING') {
    sw.skipWaiting();
    return;
  }

  if (data.type === 'SHOW_DAILY_DROP_NOTIFICATION' && data.payload) {
    event.waitUntil(displayDailyDropNotification(data.payload as DailyDropNotificationPayload));
  }
});

sw.addEventListener('push', (event: SWPushEvent) => {
  let payload: DailyDropNotificationPayload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }
  event.waitUntil(displayDailyDropNotification(payload));
});

sw.addEventListener('notificationclick', (event: SWNotificationEvent) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/?view=store';
  const appId = notifData.appId || '';

  event.waitUntil(
    sw.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.startsWith(sw.location.origin)) {
            client.postMessage({
              type: 'OPEN_DAILY_DROP_APP',
              appId,
              url: targetUrl,
            });
            return client.focus();
          }
        }
        return sw.clients.openWindow(targetUrl);
      })
  );
});
