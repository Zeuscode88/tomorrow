import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALLED_STORAGE_KEY = 'tomorrow_pwa_installed';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasInstalledApp, setHasInstalledApp] = useState<boolean>(() => {
    try {
      return localStorage.getItem(INSTALLED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const checkStandalone = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (checkStandalone()) {
      setIsInstalled(true);
      setHasInstalledApp(true);
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
      } catch {}
    }

    const ua = window.navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setHasInstalledApp(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
      } catch {}
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setHasInstalledApp(true);
        try {
          localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
        } catch {}
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener?.('change', handleDisplayChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener?.('change', handleDisplayChange);
    };
  }, []);

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setHasInstalledApp(true);
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
      } catch {}
    }
    return outcome;
  };

  const canPromptNatively = Boolean(deferredPrompt) && !isInstalled;
  const shouldShowInstallCTA = !isInstalled;

  return {
    canPromptNatively,
    shouldShowInstallCTA,
    isInstalled,
    hasInstalledApp,
    isIOS,
    promptInstall,
  };
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}
