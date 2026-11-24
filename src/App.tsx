/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from './components/Navbar';
import { DailyDropBanner } from './components/DailyDropBanner';
import { FiltersBar } from './components/FiltersBar';
import { AppCard } from './components/AppCard';
import { AppDetailModal } from './components/AppDetailModal';
import { DevPledgeModal } from './components/DevPledgeModal';
import { SubmitIdeaModal } from './components/SubmitIdeaModal';
import { AIGeneratorModal } from './components/AIGeneratorModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { WorldStats } from './components/WorldStats';
import { LandingPage } from './components/LandingPage';
import { Toast } from './components/Toast';
import { ProjectBuilderStudio } from './components/ProjectBuilderStudio';
import { PublicRenderView } from './components/PublicRenderView';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { SiteFooter } from './components/SiteFooter';
import { BottomTabBar, BottomTabId } from './components/BottomTabBar';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PinLockScreen } from './components/PinLockScreen';
import { PinSetupModal } from './components/PinSetupModal';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
import {
  getLastBackgroundTimestamp,
  getScreenLockState,
  getUserPinSettings,
  hasUserPin,
  setLastBackgroundTimestamp,
  setScreenLockState,
} from './services/pinSecurityService';
import { DEFAULT_LANGUAGE_CODE, getAfricanLanguageByCode } from './data/africanLanguages';
import { applyGoogleTranslation } from './services/googleTranslator';
import { AppIdea } from './types/app';
import { ProjectBuild } from './types/builder';
import { User as UserType } from './types/auth';
import { SEED_APPS } from './data/seedApps';
import { Plus, WifiOff } from 'lucide-react';
import { AfricaContinentIcon, AdinkraMotifIcon } from './utils/africanIcons';
import {
  loadAppsFromFirestore,
  subscribeToFirestoreApps,
  recordVoteInFirestore,
  addPledgeToFirestore,
  addCommentToFirestore,
  saveAppToFirestore,
  saveMultipleAppsToFirestore,
} from './services/firestoreSync';
import { fetchBuildsFromApi, subscribeToBuilds, sortBuilds } from './services/builderSync';
import { logoutFromFirebase, subscribeToFirebaseAuthState } from './services/firebaseAuthService';
import { CommunityHubModal, CommunityHubTab } from './components/CommunityHubModal';
import { ConnectionInvite, DirectMessage, PublicProfile } from './types/social';
import {
  connectSocialSocket,
  fetchInvitations,
  fetchMessages,
  fetchPublicProfiles,
  respondToInvitation,
  saveMyPortfolio,
  SavePortfolioPayload,
  sendInvitation,
  sendShortMessage,
} from './services/socialSync';
import { SplashLoader } from './components/SplashLoader';
import { GoogleKeepModal } from './components/GoogleKeepModal';
import { PlatformSettings } from './types/notes';
import { setKeepEnterpriseToken } from './services/keepNotesService';
import {
  extractNewUnseenDailyDrops,
  getDailyNotificationPermission,
  isDailyNotificationsEnabled,
  NotificationPermissionState,
  requestAndEnableDailyNotifications,
  seedSeenDailyDropIds,
  setDailyNotificationsEnabled,
  showDailyDropLocalNotification,
  subscribeCrossTabNotificationClaims,
} from './services/dailyDropNotifications';

export default function App() {
  const isOnline = useOnlineStatus();
  const { isInstalled, hasInstalledApp } = usePWAInstall();

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isSplashFading, setIsSplashFading] = useState<boolean>(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsSplashFading(true), 1100);
    const hideTimer = setTimeout(() => setShowSplash(false), 1450);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Dark / Light theme state persisted in localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('tomorrow_theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('tomorrow_theme', theme);
    } catch {}
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#09090b' : '#000000');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Google-powered African language translation state persisted in localStorage
  const [language, setLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem('tomorrow_lang') || DEFAULT_LANGUAGE_CODE;
    } catch {
      return DEFAULT_LANGUAGE_CODE;
    }
  });
  const [isTranslating, setIsTranslating] = useState(false);

  const handleChangeLanguage = (langCode: string) => {
    setLanguage(langCode);
    try {
      localStorage.setItem('tomorrow_lang', langCode);
    } catch {}
    const langMeta = getAfricanLanguageByCode(langCode);
    if (langCode === 'fr') {
      setToastMessage('Langue rétablie : Français');
    } else {
      setToastMessage(`Langue sélectionnée : ${langMeta.nativeName} (Propulsé par Google)`);
    }
  };

  const [apps, setApps] = useState<AppIdea[]>(() => {
    try {
      const cached = localStorage.getItem('tomorrow_cached_apps');
      if (cached) {
        const parsed = JSON.parse(cached) as AppIdea[];
        const african = Array.isArray(parsed)
          ? parsed.filter((a) => a.continent === 'Afrique')
          : [];
        if (african.length > 0) return african;
      }
    } catch {}
    return SEED_APPS;
  });

  useEffect(() => {
    try {
      if (apps.length > 0) {
        localStorage.setItem('tomorrow_cached_apps', JSON.stringify(apps));
      }
    } catch {}
  }, [apps]);

  const [selectedCountry, setSelectedCountry] = useState<string>('Tous');
  const [selectedSector, setSelectedSector] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<'popular' | 'daily' | 'devs' | 'recent'>('popular');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    try {
      const stored = localStorage.getItem('novastore_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('novastore_token');
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isKeepModalOpen, setIsKeepModalOpen] = useState<boolean>(false);
  const [keepInitialAppIdea, setKeepInitialAppIdea] = useState<AppIdea | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    announcementBanner: '',
    maintenanceMode: false,
    allowRegistrations: true,
    allowAIGeneration: true,
  });
  const [isPinSetupModalOpen, setIsPinSetupModalOpen] = useState<boolean>(false);
  const [pinRevision, setPinRevision] = useState<number>(0);

  // Local Service Worker notifications state for "IA du jour"
  const [dailyNotifsEnabled, setDailyNotifsEnabled] = useState<boolean>(() =>
    isDailyNotificationsEnabled()
  );
  const [dailyNotifPermission, setDailyNotifPermission] =
    useState<NotificationPermissionState>(() => getDailyNotificationPermission());

  // Social: Brief Portfolios, Invitations & Accepted Short Messages
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [invitations, setInvitations] = useState<ConnectionInvite[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isCommunityHubOpen, setIsCommunityHubOpen] = useState<boolean>(false);
  const [communityInitialTab, setCommunityInitialTab] = useState<CommunityHubTab>('profiles');
  const [selectedCommunityProfileId, setSelectedCommunityProfileId] = useState<string | null>(null);
  const [communitySearchPreset, setCommunitySearchPreset] = useState<string>('');

  const hasPinConfigured = useMemo(() => {
    void pinRevision;
    return currentUser ? hasUserPin(currentUser.email) : false;
  }, [currentUser, pinRevision]);

  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(() => {
    try {
      const storedUserRaw = localStorage.getItem('novastore_user');
      if (!storedUserRaw) return false;
      const storedUser = JSON.parse(storedUserRaw) as UserType;
      const lockState = getScreenLockState();
      if (
        lockState?.locked &&
        lockState.email.toLowerCase() === storedUser.email.toLowerCase() &&
        hasUserPin(storedUser.email)
      ) {
        return true;
      }
    } catch {}
    return false;
  });

  // Auto-lock when returning to an installed app after leaving temporarily
  useEffect(() => {
    if (!currentUser || !hasPinConfigured || !(isInstalled || hasInstalledApp)) return;
    const settings = getUserPinSettings(currentUser.email);
    if (!settings?.autoLockOnReturn) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setLastBackgroundTimestamp(Date.now());
        if (settings.lockDelaySeconds === 0) {
          setScreenLockState({
            locked: true,
            email: currentUser.email,
            lockedAt: Date.now(),
          });
        }
      } else if (document.visibilityState === 'visible') {
        const bgAt = getLastBackgroundTimestamp();
        if (bgAt && Date.now() - bgAt >= settings.lockDelaySeconds * 1000) {
          setLastBackgroundTimestamp(null);
          setScreenLockState({
            locked: true,
            email: currentUser.email,
            lockedAt: Date.now(),
          });
          setIsScreenLocked(true);
        }
      }
    };

    const handlePageHide = () => {
      setLastBackgroundTimestamp(Date.now());
      if (settings.lockDelaySeconds === 0) {
        setScreenLockState({
          locked: true,
          email: currentUser.email,
          lockedAt: Date.now(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [currentUser, hasPinConfigured, isInstalled, hasInstalledApp, pinRevision]);

  const handleLockScreen = () => {
    if (!currentUser) return;
    if (!hasUserPin(currentUser.email)) {
      setIsPinSetupModalOpen(true);
      return;
    }
    setScreenLockState({
      locked: true,
      email: currentUser.email,
      lockedAt: Date.now(),
    });
    setIsScreenLocked(true);
    setToastMessage('Écran verrouillé temporairement.');
  };

  const handleUnlockScreen = () => {
    setScreenLockState(null);
    setLastBackgroundTimestamp(null);
    setIsScreenLocked(false);
    setToastMessage('Session déverrouillée par code PIN.');
  };

  // View mode: 'landing' | 'store' | 'render'
  const [publicRenderBuildId, setPublicRenderBuildId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('render');
    }
    return null;
  });

  const [viewMode, setViewMode] = useState<'landing' | 'store' | 'render'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('render')) return 'render';
      if (params.get('app') || params.get('view') === 'store') return 'store';
      try {
        const hasEntered = sessionStorage.getItem('novastore_entered');
        if (hasEntered === 'true') return 'store';
      } catch {}
    }
    return 'landing';
  });

  useEffect(() => {
    const controller = new AbortController();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isRunning = false;

    const runTranslation = async () => {
      if (isRunning || controller.signal.aborted) return;
      isRunning = true;
      if (language !== 'fr') setIsTranslating(true);
      try {
        await applyGoogleTranslation(language, { signal: controller.signal });
      } finally {
        isRunning = false;
        setIsTranslating(false);
      }
    };

    runTranslation();

    if (language === 'fr') {
      return () => controller.abort();
    }

    const root = document.getElementById('root') || document.body;
    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        runTranslation();
      }, 180);
    });

    observer.observe(root, { childList: true, subtree: true });

    return () => {
      controller.abort();
      observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [language, viewMode]);

  const handleEnterStore = () => {
    setPublicRenderBuildId(null);
    setViewMode('store');
    try {
      sessionStorage.setItem('novastore_entered', 'true');
      const url = new URL(window.location.href);
      url.searchParams.delete('render');
      window.history.replaceState({}, '', url.toString());
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLanding = () => {
    setPublicRenderBuildId(null);
    setViewMode('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Builds, Squads, WebViews & AI Prototypes (with offline localStorage cache)
  const [builds, setBuilds] = useState<ProjectBuild[]>(() => {
    try {
      const cached = localStorage.getItem('tomorrow_cached_builds');
      if (cached) {
        const parsed = JSON.parse(cached) as ProjectBuild[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      if (builds.length > 0) {
        localStorage.setItem('tomorrow_cached_builds', JSON.stringify(builds));
      }
    } catch {}
  }, [builds]);

  const [studioApp, setStudioApp] = useState<AppIdea | null>(null);
  const [studioInitialTab, setStudioInitialTab] = useState<'renders' | 'import' | 'ai' | 'agents'>('renders');

  // Modals & Drawers
  const [activeAppModal, setActiveAppModal] = useState<AppIdea | null>(null);
  const [pledgeModalApp, setPledgeModalApp] = useState<AppIdea | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isAIGeneratorModalOpen, setIsAIGeneratorModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local vote tracking in localStorage
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('novastore_votes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Verify auth session on mount
  useEffect(() => {
    if (authToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
            try {
              localStorage.setItem('novastore_user', JSON.stringify(data.user));
            } catch {}
          }
        })
        .catch(() => {
          // Keep persistent session from localStorage
        });
    }
  }, [authToken]);

  // Fetch apps from backend
  const fetchApps = () => {
    fetch('/api/apps')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.apps?.length > 0) {
          const africanApps = (data.apps as AppIdea[]).filter((a) => a.continent === 'Afrique');
          if (africanApps.length > 0) {
            setApps(africanApps);
          }
        }
      })
      .catch((err) => {
        console.warn('Backend fetch failed, using seed data:', err);
      });
  };

  const refreshBuilds = () => {
    fetchBuildsFromApi().then((apiBuilds) => {
      if (apiBuilds.length > 0) {
        setBuilds((prev) => {
          const map = new Map<string, ProjectBuild>();
          prev.forEach((b) => map.set(b.id, b));
          apiBuilds.forEach((b) => map.set(b.id, b));
          return sortBuilds(Array.from(map.values()));
        });
      }
    });
  };

  useEffect(() => {
    fetch('/api/platform-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setPlatformSettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Seed initial daily drop IDs so historical items never fire stale alerts on startup
    seedSeenDailyDropIds(apps);

    // 1. Subscribe to Firebase Auth state
    const unsubscribeAuth = subscribeToFirebaseAuthState((fbUser, fbToken) => {
      if (fbUser && fbToken) {
        setCurrentUser(fbUser);
        setAuthToken(fbToken);
        try {
          localStorage.setItem('novastore_token', fbToken);
          localStorage.setItem('novastore_user', JSON.stringify(fbUser));
        } catch {}
      }
    });

    // 2. Real-time permanent live synchronization with Firestore database
    const unsubscribeApps = subscribeToFirestoreApps((fbApps) => {
      if (fbApps && fbApps.length > 0) {
        const africanApps = fbApps.filter((a) => a.continent === 'Afrique');
        if (africanApps.length > 0) {
          setApps(africanApps);
          const newlyPublished = extractNewUnseenDailyDrops(africanApps);
          if (newlyPublished.length > 0) {
            showDailyDropLocalNotification(newlyPublished);
            setToastMessage(
              newlyPublished.length === 1
                ? `Nouvelle IA du jour publiée : ${newlyPublished[0].title}`
                : `${newlyPublished.length} nouvelles IA du jour publiées !`
            );
          }
        }
      }
    });

    // 3. Real-time builds & public renders synchronization
    const unsubscribeBuilds = subscribeToBuilds((fbBuilds) => {
      if (fbBuilds && fbBuilds.length > 0) {
        setBuilds((prev) => {
          const map = new Map<string, ProjectBuild>();
          prev.forEach((b) => map.set(b.id, b));
          fbBuilds.forEach((b) => map.set(b.id, b));
          return sortBuilds(Array.from(map.values()));
        });
      }
    });

    // 4. Cross-tab notification deduplication + SW notification click handler
    const unsubscribeClaims = subscribeCrossTabNotificationClaims();
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OPEN_DAILY_DROP_APP') {
        const targetId = event.data.appId;
        setViewMode('store');
        setSortMode('daily');
        if (targetId) {
          setApps((current) => {
            const matched = current.find((a) => a.id === targetId);
            if (matched) setActiveAppModal(matched);
            return current;
          });
        }
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    // Initial fetch from backend API
    fetchApps();
    fetchBuildsFromApi().then((apiBuilds) => {
      if (apiBuilds.length > 0) {
        setBuilds((prev) => {
          const map = new Map<string, ProjectBuild>();
          prev.forEach((b) => map.set(b.id, b));
          apiBuilds.forEach((b) => map.set(b.id, b));
          return sortBuilds(Array.from(map.values()));
        });
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeClaims();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
      if (unsubscribeApps) unsubscribeApps();
      if (unsubscribeBuilds) unsubscribeBuilds();
    };
  }, []);

  // Load public profiles on mount + subscribe to social & daily drop WebSocket
  useEffect(() => {
    fetchPublicProfiles().then((list) => {
      if (list.length > 0) setProfiles(list);
    });
  }, []);

  useEffect(() => {
    if (currentUser && authToken) {
      fetchPublicProfiles().then((list) => {
        if (list.length > 0) setProfiles(list);
      });
      fetchInvitations(authToken).then(setInvitations);
      fetchMessages(authToken).then(setMessages);
    } else {
      setInvitations([]);
      setMessages([]);
    }

    const disconnect = connectSocialSocket(authToken, {
      onProfileUpdated: (prof) => {
        setProfiles((prev) => {
          const rest = prev.filter((p) => p.id !== prof.id);
          return [prof, ...rest];
        });
      },
      onInviteCreated: (inv) => {
        if (!currentUser) return;
        setInvitations((prev) => (prev.some((x) => x.id === inv.id) ? prev : [inv, ...prev]));
        if (inv.toUserId === currentUser.id) {
          setToastMessage(`Nouvelle invitation reçue de ${inv.fromUserName}`);
        }
      },
      onInviteUpdated: (inv) => {
        if (!currentUser) return;
        setInvitations((prev) => {
          const exists = prev.some((x) => x.id === inv.id);
          return exists ? prev.map((x) => (x.id === inv.id ? inv : x)) : [inv, ...prev];
        });
        if (inv.status === 'accepted' && inv.fromUserId === currentUser.id) {
          setToastMessage(`${inv.toUserName} a accepté votre invitation !`);
        }
      },
      onInviteRemoved: (removedId) => {
        if (!currentUser) return;
        setInvitations((prev) => prev.filter((x) => x.id !== removedId));
      },
      onMessageCreated: (msg) => {
        if (!currentUser) return;
        setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
      },
      onDailyDropPublished: (payload) => {
        const incoming = (payload.apps || []).filter((a) => a.continent === 'Afrique');
        if (incoming.length === 0) return;

        setApps((prev) => {
          const incomingIds = new Set(incoming.map((a) => a.id));
          const updatedPrev = prev
            .filter((a) => !incomingIds.has(a.id))
            .map((a) =>
              payload.source === 'ai' && a.isDailyDrop ? { ...a, isDailyDrop: false } : a
            );
          return [...incoming, ...updatedPrev];
        });

        const newlyPublished = extractNewUnseenDailyDrops(incoming);
        if (newlyPublished.length > 0) {
          showDailyDropLocalNotification(newlyPublished);
          setToastMessage(
            newlyPublished.length === 1
              ? `Nouvelle IA du jour publiée : ${newlyPublished[0].title}`
              : `${newlyPublished.length} nouvelles IA du jour viennent d'être publiées !`
          );
        }
      },
    });

    return () => {
      disconnect();
    };
  }, [currentUser?.id, authToken]);

  const myProfile = useMemo(
    () => (currentUser ? profiles.find((p) => p.id === currentUser.id) || null : null),
    [profiles, currentUser]
  );

  const pendingInvitesCount = useMemo(
    () =>
      currentUser
        ? invitations.filter((inv) => inv.toUserId === currentUser.id && inv.status === 'pending').length
        : 0,
    [invitations, currentUser]
  );

  const handleOpenCommunityHub = (
    tab: CommunityHubTab = 'profiles',
    profileId: string | null = null,
    searchPreset: string = ''
  ) => {
    setCommunityInitialTab(tab);
    setSelectedCommunityProfileId(profileId);
    setCommunitySearchPreset(searchPreset);
    setIsCommunityHubOpen(true);
    fetchPublicProfiles().then((list) => {
      if (list.length > 0) setProfiles(list);
    });
  };

  const handleOpenDeveloperProfile = (devName: string) => {
    const clean = devName.trim().toLowerCase();
    const matched = profiles.find((p) => p.name.trim().toLowerCase() === clean);
    if (matched) {
      handleOpenCommunityHub('profiles', matched.id, '');
    } else {
      handleOpenCommunityHub('profiles', null, devName);
    }
  };

  const handleSaveMyPortfolio = async (payload: SavePortfolioPayload) => {
    if (!currentUser || !authToken) {
      setIsAuthModalOpen(true);
      return;
    }
    const res = await saveMyPortfolio(authToken, payload);
    if (res.success && res.profile) {
      const saved = res.profile;
      setProfiles((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
      setToastMessage('Votre portfolio bref a été enregistré !');
    } else {
      setToastMessage(res.error || 'Impossible de sauvegarder le portfolio.');
    }
  };

  const handleSendInvitation = async (toUserId: string, note?: string): Promise<boolean> => {
    if (!currentUser || !authToken) {
      setIsAuthModalOpen(true);
      return false;
    }
    const res = await sendInvitation(authToken, toUserId, note);
    if (res.success && res.invitation) {
      const created = res.invitation;
      setInvitations((prev) => (prev.some((x) => x.id === created.id) ? prev : [created, ...prev]));
      setToastMessage('Invitation envoyée ! La discussion ouvrira après acceptation.');
      return true;
    }
    setToastMessage(res.error || "Impossible d'envoyer l'invitation.");
    return false;
  };

  const handleRespondInvitation = async (
    inviteId: string,
    action: 'accepted' | 'declined' | 'cancel'
  ): Promise<boolean> => {
    if (!currentUser || !authToken) {
      setIsAuthModalOpen(true);
      return false;
    }
    const res = await respondToInvitation(authToken, inviteId, action);
    if (res.success) {
      if (action === 'cancel' && res.removedId) {
        setInvitations((prev) => prev.filter((x) => x.id !== res.removedId));
        setToastMessage('Invitation annulée.');
      } else if (res.invitation) {
        const updated = res.invitation;
        setInvitations((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        setToastMessage(
          action === 'accepted'
            ? 'Invitation acceptée ! Vous pouvez maintenant échanger en texte court.'
            : 'Invitation refusée.'
        );
      }
      return true;
    }
    setToastMessage(res.error || "Action impossible sur l'invitation.");
    return false;
  };

  const handleSendShortMessage = async (recipientId: string, text: string): Promise<boolean> => {
    if (!currentUser || !authToken) {
      setIsAuthModalOpen(true);
      return false;
    }
    const res = await sendShortMessage(authToken, recipientId, text);
    if (res.success && res.message) {
      const sent = res.message;
      setMessages((prev) => (prev.some((x) => x.id === sent.id) ? prev : [...prev, sent]));
      return true;
    }
    setToastMessage(res.error || "Impossible d'envoyer le message.");
    return false;
  };

  const handleLoadThread = async (peerId: string) => {
    if (!authToken) return;
    const thread = await fetchMessages(authToken, peerId);
    if (thread.length > 0) {
      setMessages((prev) => {
        const map = new Map<string, DirectMessage>();
        prev.forEach((m) => map.set(m.id, m));
        thread.forEach((m) => map.set(m.id, m));
        return Array.from(map.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    }
  };

  const handleBuildsUpdated = (updatedBuild: ProjectBuild) => {
    setBuilds((prev) => {
      const rest = prev.filter((b) => b.id !== updatedBuild.id);
      return sortBuilds([updatedBuild, ...rest]);
    });
  };

  const handleOpenStudio = (appItem: AppIdea, tab: 'renders' | 'import' | 'ai' | 'agents' = 'renders') => {
    setStudioInitialTab(tab);
    setStudioApp(appItem);
  };

  const handleOpenPublicRender = (build: ProjectBuild) => {
    setStudioApp(null);
    setActiveAppModal(null);
    setPublicRenderBuildId(build.id);
    setViewMode('render');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('render', build.id);
      window.history.replaceState({}, '', url.toString());
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Deep-link auto-opener for shared links (?app=<id>)
  useEffect(() => {
    if (typeof window !== 'undefined' && apps.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const sharedAppId = params.get('app');
      if (sharedAppId) {
        setViewMode('store');
        const found = apps.find((a) => a.id === sharedAppId);
        if (found) {
          setActiveAppModal(found);
        }
      }
    }
  }, [apps]);

  const handleLoginSuccess = (user: UserType, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    try {
      localStorage.setItem('novastore_token', token);
      localStorage.setItem('novastore_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFromFirebase();
    } catch (e) {
      console.warn('Firebase logout note:', e);
    }

    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (err) {
        console.error(err);
      }
    }
    setCurrentUser(null);
    setAuthToken(null);
    setKeepEnterpriseToken(null);
    setIsScreenLocked(false);
    setScreenLockState(null);
    setLastBackgroundTimestamp(null);
    try {
      localStorage.removeItem('novastore_token');
      localStorage.removeItem('novastore_user');
    } catch (e) {
      console.error(e);
    }
    setToastMessage('Vous avez été déconnecté.');
  };

  const saveVotes = (votes: Record<string, boolean>) => {
    setUserVotes(votes);
    try {
      localStorage.setItem('novastore_votes', JSON.stringify(votes));
    } catch (e) {
      console.error(e);
    }
  };

  // Upvote handler (Requires authentication)
  const handleVote = async (appId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Must be authenticated to vote
    if (!currentUser || !authToken) {
      setToastMessage('Veuillez vous inscrire ou vous connecter pour voter et soutenir une application.');
      setIsAuthModalOpen(true);
      return;
    }

    const alreadyVoted = !!userVotes[appId];
    const delta = alreadyVoted ? -1 : 1;

    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, votes: Math.max(0, a.votes + delta) } : a))
    );

    const updatedVotes = { ...userVotes, [appId]: !alreadyVoted };
    saveVotes(updatedVotes);

    if (activeAppModal && activeAppModal.id === appId) {
      setActiveAppModal((prev) =>
        prev ? { ...prev, votes: Math.max(0, prev.votes + delta) } : null
      );
    }

    setToastMessage(
      alreadyVoted ? 'Vote retiré' : 'Merci pour votre vote ! Les développeurs locaux sont notifiés.'
    );

    // Sync to Firestore
    recordVoteInFirestore(appId, delta);

    try {
      const res = await fetch(`/api/apps/${appId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ delta }),
      });
      if (res.status === 401) {
        setIsAuthModalOpen(true);
      }
    } catch (err) {
      console.error('Vote sync error:', err);
    }
  };

  // Open Pledge Modal with Auth Guard
  const handleOpenPledge = (app: AppIdea) => {
    if (!currentUser || !authToken) {
      setToastMessage('Veuillez vous inscrire ou vous connecter pour vous engager comme développeur.');
      setIsAuthModalOpen(true);
      return;
    }
    setPledgeModalApp(app);
  };

  // Open Submit Modal with Auth Guard
  const handleOpenSubmit = () => {
    if (!currentUser || !authToken) {
      setToastMessage('Veuillez vous inscrire ou vous connecter pour proposer une idée.');
      setIsAuthModalOpen(true);
      return;
    }
    setIsSubmitModalOpen(true);
  };

  // Open AI Generator Modal with Auth Guard
  const handleOpenAIGenerator = () => {
    if (!currentUser || !authToken) {
      setToastMessage('Veuillez vous inscrire ou vous connecter pour générer des idées par IA.');
      setIsAuthModalOpen(true);
      return;
    }
    setIsAIGeneratorModalOpen(true);
  };

  // Developer pledge
  const handlePledgeSubmit = async (
    appId: string,
    pledgeData: { name: string; role: string; country: string; githubOrContact?: string; comment: string }
  ) => {
    if (!currentUser || !authToken) {
      setToastMessage('Veuillez vous inscrire ou vous connecter pour vous engager sur ce projet.');
      setIsAuthModalOpen(true);
      return;
    }

    // Sync to Firestore
    addPledgeToFirestore(appId, pledgeData);

    const res = await fetch(`/api/apps/${appId}/pledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(pledgeData),
    });
    const data = await res.json();
    if (data.success && data.app) {
      setApps((prev) => prev.map((a) => (a.id === appId ? data.app : a)));
      if (activeAppModal && activeAppModal.id === appId) {
        setActiveAppModal(data.app);
      }
      setToastMessage('Votre engagement a été enregistré avec succès !');
    } else if (res.status === 401) {
      setIsAuthModalOpen(true);
    }
  };

  // Add Comment
  const handleAddComment = async (appId: string, author: string, role: string, text: string) => {
    if (!currentUser || !authToken) {
      setToastMessage('Veuillez vous inscrire ou vous connecter pour publier un commentaire.');
      setIsAuthModalOpen(true);
      return;
    }

    // Sync to Firestore
    addCommentToFirestore(appId, {
      id: `comment-${Date.now()}`,
      author,
      role,
      text,
      createdAt: new Date().toISOString(),
    });

    const res = await fetch(`/api/apps/${appId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ author, role, text }),
    });
    const data = await res.json();
    if (data.success && data.app) {
      setApps((prev) => prev.map((a) => (a.id === appId ? data.app : a)));
      if (activeAppModal && activeAppModal.id === appId) {
        setActiveAppModal(data.app);
      }
      setToastMessage('Votre commentaire a été publié.');
    } else if (res.status === 401) {
      setIsAuthModalOpen(true);
    }
  };

  // Submit User Proposal
  const handleSubmitApp = async (appData: any) => {
    if (!currentUser || !authToken) {
      setToastMessage('Veuillez vous inscrire ou vous connecter pour soumettre un projet.');
      setIsAuthModalOpen(true);
      return;
    }

    const res = await fetch('/api/apps/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(appData),
    });
    const data = await res.json();
    if (data.success && data.app) {
      // Sync to Firestore
      saveAppToFirestore(data.app);

      setApps((prev) => [data.app, ...prev]);
      setActiveAppModal(data.app);
      setToastMessage('Votre proposition d\'application a été ajoutée au catalogue africain !');
    } else if (res.status === 401) {
      setIsAuthModalOpen(true);
    }
  };

  // Generate with AI
  const handleAIGenerate = async (payload: {
    continent: string;
    country: string;
    sector: string;
    focus: string;
  }) => {
    if (!currentUser || !authToken) {
      setToastMessage('Veuillez vous inscrire ou vous connecter pour utiliser le générateur IA.');
      setIsAuthModalOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/generate-proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.apps && data.apps.length > 0) {
        // Permanently persist new AI apps into Firestore
        saveMultipleAppsToFirestore(data.apps);

        setApps((prev) => {
          const newIds = new Set(data.apps.map((a: AppIdea) => a.id));
          const filtered = prev
            .filter((a) => !newIds.has(a.id))
            .map((a) => (a.isDailyDrop ? { ...a, isDailyDrop: false } : a));
          return [...data.apps, ...filtered];
        });

        // Fire local Service Worker notification if not already claimed via WebSocket
        const newlyPublished = extractNewUnseenDailyDrops(data.apps);
        if (newlyPublished.length > 0) {
          showDailyDropLocalNotification(newlyPublished);
        }

        // Reset filters so the 4 newly generated apps are immediately displayed
        setSelectedSector('Tous');
        setSelectedCountry('Tous');
        setSearchQuery('');
        setSortMode('daily');

        setToastMessage('4 nouvelles applications pour l\'Afrique ont été générées et ajoutées !');

        // Open the first newly generated app for immediate exploration
        if (data.apps[0]) {
          setActiveAppModal(data.apps[0]);
        }
      } else if (res.status === 401) {
        setIsAuthModalOpen(true);
        setToastMessage('Veuillez vous connecter pour utiliser le générateur IA.');
      } else {
        setToastMessage(data.error || 'Erreur lors de la génération.');
      }
    } catch (err: any) {
      console.error(err);
      setToastMessage('Erreur lors de la génération avec l\'IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Daily Drop apps
  const dailyApps = useMemo(() => {
    const list = apps.filter((a) => a.isDailyDrop);
    if (list.length >= 4) return list.slice(0, 4);
    return apps.slice(0, 4);
  }, [apps]);

  const handleToggleDailyNotifications = async () => {
    if (dailyNotifsEnabled) {
      setDailyNotificationsEnabled(false);
      setDailyNotifsEnabled(false);
      setToastMessage("Alertes locales 'IA du jour' désactivées.");
      return;
    }

    const result = await requestAndEnableDailyNotifications(apps);
    setDailyNotifPermission(result.permission);
    setDailyNotifsEnabled(result.ok);
    setToastMessage(result.message);
  };

  const handleTestDailyNotification = async () => {
    const sent = await showDailyDropLocalNotification(dailyApps.slice(0, 1), {
      isTest: true,
      bypassPreference: true,
    });
    if (sent) {
      setToastMessage('Notification locale envoyée via le Service Worker.');
    } else {
      setToastMessage(
        "Impossible d'afficher la notification. Vérifiez l'autorisation du navigateur."
      );
    }
  };

  // Available African countries in catalog
  const availableCountries = useMemo(() => {
    const countries = Array.from(new Set(apps.map((a) => a.country))).filter(Boolean);
    return countries.sort();
  }, [apps]);

  // Global metrics
  const totalVotes = useMemo(() => apps.reduce((sum, a) => sum + (a.votes || 0), 0), [apps]);
  const totalDevs = useMemo(
    () => apps.reduce((sum, a) => sum + (a.devPledges?.length || 0), 0),
    [apps]
  );

  // Filtered and sorted apps
  const filteredApps = useMemo(() => {
    let list = apps.filter((a) => a.continent === 'Afrique');

    // Country
    if (selectedCountry !== 'Tous') {
      list = list.filter((a) => a.country.toLowerCase() === selectedCountry.toLowerCase());
    }

    // Sector
    if (selectedSector !== 'Tous') {
      list = list.filter((a) => a.sector.toLowerCase() === selectedSector.toLowerCase());
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.tagline.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.country.toLowerCase().includes(q) ||
          a.problemSolved.toLowerCase().includes(q) ||
          a.techStackSuggested.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortMode === 'popular') {
      list.sort((a, b) => b.votes - a.votes);
    } else if (sortMode === 'daily') {
      list = list.filter((a) => a.isDailyDrop);
    } else if (sortMode === 'devs') {
      list.sort((a, b) => (b.devPledges?.length || 0) - (a.devPledges?.length || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [apps, selectedCountry, selectedSector, searchQuery, sortMode]);

  const activeBottomTab: BottomTabId = isCommunityHubOpen
    ? 'network'
    : isSubmitModalOpen
    ? 'submit'
    : isProfileModalOpen || isAuthModalOpen
    ? 'profile'
    : sortMode === 'daily'
    ? 'daily'
    : 'explore';

  return (
    <div className="min-h-full bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <SplashLoader visible={showSplash} isFadingOut={isSplashFading} />
      {viewMode === 'render' && publicRenderBuildId ? (
        <PublicRenderView
          buildId={publicRenderBuildId}
          initialBuild={builds.find((b) => b.id === publicRenderBuildId) || null}
          apps={apps}
          onBackToStore={handleEnterStore}
          onOpenProjectDetail={(appItem) => {
            handleEnterStore();
            setActiveAppModal(appItem);
          }}
          onShowToast={(msg) => setToastMessage(msg)}
          theme={theme}
          onToggleTheme={toggleTheme}
          language={language}
          onChangeLanguage={handleChangeLanguage}
          isTranslating={isTranslating}
        />
      ) : viewMode === 'landing' ? (
        <LandingPage
          onEnterStore={handleEnterStore}
          featuredApps={apps}
          totalAppsCount={apps.length}
          theme={theme}
          onToggleTheme={toggleTheme}
          language={language}
          onChangeLanguage={handleChangeLanguage}
          isTranslating={isTranslating}
        />
      ) : (
        <>
          {/* Fixed Navigation Header */}
          <Navbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenSubmit={handleOpenSubmit}
            onOpenAIGenerator={handleOpenAIGenerator}
            onSelectDailyDrop={() => {
              setSortMode('daily');
              setSelectedSector('Tous');
              setSelectedCountry('Tous');
            }}
            dailyCount={dailyApps.length}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenAdmin={() => setIsAdminModalOpen(true)}
            onLogout={handleLogout}
            onOpenLanding={handleOpenLanding}
            hasPin={hasPinConfigured}
            onLockScreen={handleLockScreen}
            onOpenPinSetup={() => setIsPinSetupModalOpen(true)}
            onOpenCommunity={() => handleOpenCommunityHub('profiles')}
            onOpenKeepNotes={() => {
              setKeepInitialAppIdea(null);
              setIsKeepModalOpen(true);
            }}
            pendingInvitesCount={pendingInvitesCount}
          />

          {/* Main Content Container (padded below fixed top bar) */}
          <main className="mx-auto w-full max-w-7xl flex-1 px-3 sm:px-6 lg:px-8 pt-[62px] sm:pt-[68px] pb-6 space-y-6 sm:space-y-8">
            {platformSettings.announcementBanner && (
              <div className="rounded-2xl border border-black dark:border-white bg-black dark:bg-white px-4 py-2.5 text-center text-xs font-bold text-white dark:text-black">
                {platformSettings.announcementBanner}
              </div>
            )}
            {platformSettings.maintenanceMode && (
              <div className="rounded-2xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-900 px-4 py-2 text-center text-xs font-semibold text-slate-900 dark:text-slate-100">
                Maintenance programmée en cours · Certaines opérations peuvent être temporairement limitées.
              </div>
            )}
            {!isOnline && (
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-900/60 px-4 py-2 text-center text-[11px] font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2">
                <WifiOff className="h-3.5 w-3.5 shrink-0" />
                <span>Mode hors-ligne actif · Vos données en cache restent consultables</span>
              </div>
            )}
            {/* Daily Drop Spotlight Banner */}
            <section aria-label="Drop IA du Jour">
              <DailyDropBanner
                dailyApps={dailyApps}
                onSelectApp={setActiveAppModal}
                onVote={handleVote}
                onOpenAIGenerator={handleOpenAIGenerator}
                userVotes={userVotes}
                isGenerating={isGenerating}
                onShowToast={(msg) => setToastMessage(msg)}
                notificationsEnabled={dailyNotifsEnabled}
                notificationPermission={dailyNotifPermission}
                onToggleNotifications={handleToggleDailyNotifications}
                onTestNotification={handleTestDailyNotification}
              />
            </section>

            {/* Africa Distribution & Quick Country Picker */}
            <section aria-label="Répartition Africaine">
              <WorldStats
                totalApps={apps.length}
                totalVotes={totalVotes}
                totalDevs={totalDevs}
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
                apps={apps}
                isDark={theme === 'dark'}
              />
            </section>

            {/* Store Catalog & Filters */}
            <section aria-label="Catalogue des applications" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    Explorer l'App Store africain
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {filteredApps.length} application{filteredApps.length > 1 ? 's' : ''} répertoriée
                    {filteredApps.length > 1 ? 's' : ''} en Afrique selon vos critères
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleOpenSubmit}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Proposer une idée</span>
                  </button>

                  <button
                    onClick={handleOpenAIGenerator}
                    className="flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-3.5 py-2 text-xs font-semibold text-white dark:text-black shadow-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                  >
                    <AdinkraMotifIcon className="h-4 w-4 text-white dark:text-black" />
                    <span>Générer par IA</span>
                  </button>
                </div>
              </div>

              {/* Interactive Filters Bar */}
              <FiltersBar
                selectedSector={selectedSector}
                onSelectSector={setSelectedSector}
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
                availableCountries={availableCountries}
                sortMode={sortMode}
                onSortModeChange={setSortMode}
                totalAppsCount={apps.length}
              />

              {/* Apps Cards Grid */}
              {filteredApps.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredApps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      hasVoted={!!userVotes[app.id]}
                      onVote={handleVote}
                      onSelectApp={setActiveAppModal}
                      onOpenPledge={handleOpenPledge}
                      onShowToast={(msg) => setToastMessage(msg)}
                      buildsCount={builds.filter((b) => b.appId === app.id).length}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/60 dark:bg-zinc-900/60 p-8 sm:p-12 text-center">
                  <AfricaContinentIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                    Aucune application trouvée pour ces filtres
                  </h3>
                  <p className="mt-1.5 max-w-md mx-auto text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Soyez le premier à proposer une idée pour ce pays ou ce secteur, ou demandez à l'IA d'analyser cette région dès maintenant !
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleOpenSubmit}
                      className="flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Proposer ce concept</span>
                    </button>
                    <button
                      onClick={handleOpenAIGenerator}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    >
                      <AdinkraMotifIcon className="h-4 w-4 text-black dark:text-white" />
                      <span>Générer avec l'IA</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSector('Tous');
                        setSelectedCountry('Tous');
                        setSearchQuery('');
                      }}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white underline px-2 py-2"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                </div>
              )}
            </section>
          </main>

          {/* Footer with Dark Mode Toggle, Google African Language Picker & Jdeek studio Telegram */}
          <SiteFooter
            theme={theme}
            onToggleTheme={toggleTheme}
            language={language}
            onChangeLanguage={handleChangeLanguage}
            isTranslating={isTranslating}
            onPrimaryAction={handleOpenLanding}
            primaryActionLabel="Présentation & Manifeste"
            withBottomDockPadding={true}
          />

          {/* Native App Style Bottom Tab Bar */}
          <BottomTabBar
            activeTab={activeBottomTab}
            dailyCount={dailyApps.length}
            pendingInvitesCount={pendingInvitesCount}
            currentUser={currentUser}
            onSelectExplore={() => {
              setSortMode('popular');
              setSelectedSector('Tous');
              setSelectedCountry('Tous');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectDaily={() => {
              setSortMode('daily');
              setSelectedSector('Tous');
              setSelectedCountry('Tous');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCommunity={() => handleOpenCommunityHub(pendingInvitesCount > 0 ? 'invites' : 'profiles')}
            onOpenSubmit={handleOpenSubmit}
            onOpenProfileOrAuth={() => {
              if (currentUser) {
                setIsProfileModalOpen(true);
              } else {
                setIsAuthModalOpen(true);
              }
            }}
          />
        </>
      )}

      {/* Modals & Dialogs */}
      <AppDetailModal
        app={activeAppModal}
        onClose={() => setActiveAppModal(null)}
        hasVoted={activeAppModal ? !!userVotes[activeAppModal.id] : false}
        onVote={handleVote}
        onOpenPledge={handleOpenPledge}
        onAddComment={handleAddComment}
        onShowToast={(msg) => setToastMessage(msg)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        builds={activeAppModal ? builds.filter((b) => b.appId === activeAppModal.id) : []}
        onOpenStudio={handleOpenStudio}
        onOpenPublicRender={handleOpenPublicRender}
        onOpenDeveloperProfile={handleOpenDeveloperProfile}
        onSaveToKeep={(appItem) => {
          setKeepInitialAppIdea(appItem);
          setActiveAppModal(null);
          setIsKeepModalOpen(true);
        }}
      />

      <ProjectBuilderStudio
        key={studioApp ? `${studioApp.id}-${studioInitialTab}` : 'studio-closed'}
        isOpen={Boolean(studioApp)}
        onClose={() => setStudioApp(null)}
        app={studioApp}
        builds={builds}
        onBuildsUpdated={handleBuildsUpdated}
        onOpenPublicRender={handleOpenPublicRender}
        currentUser={currentUser}
        authToken={authToken}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onShowToast={(msg) => setToastMessage(msg)}
        initialTab={studioInitialTab}
      />

      <DevPledgeModal
        app={pledgeModalApp}
        onClose={() => setPledgeModalApp(null)}
        onSubmitPledge={handlePledgeSubmit}
        onShowToast={(msg) => setToastMessage(msg)}
        currentUser={currentUser}
      />

      <SubmitIdeaModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleSubmitApp}
        onShowToast={(msg) => setToastMessage(msg)}
        currentUser={currentUser}
      />

      <AIGeneratorModal
        isOpen={isAIGeneratorModalOpen}
        onClose={() => setIsAIGeneratorModalOpen(false)}
        onGenerate={handleAIGenerate}
        isGenerating={isGenerating}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onShowToast={(msg) => setToastMessage(msg)}
        hasInstalledApp={isInstalled || hasInstalledApp}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        apps={apps}
        userVotes={userVotes}
        onSelectApp={setActiveAppModal}
        onVote={handleVote}
        onOpenSubmit={() => {
          setIsProfileModalOpen(false);
          setIsSubmitModalOpen(true);
        }}
        onOpenAuth={() => {
          setIsProfileModalOpen(false);
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        hasPin={hasPinConfigured}
        hasInstalledApp={isInstalled || hasInstalledApp}
        onOpenPinSetup={() => setIsPinSetupModalOpen(true)}
        onLockScreen={handleLockScreen}
        myProfile={myProfile}
        pendingInvitesCount={pendingInvitesCount}
        onSavePortfolio={handleSaveMyPortfolio}
        onOpenCommunityHub={(tab) => handleOpenCommunityHub(tab || 'profiles')}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenKeepNotes={() => {
          setKeepInitialAppIdea(null);
          setIsKeepModalOpen(true);
        }}
        notificationsEnabled={dailyNotifsEnabled}
        notificationPermission={dailyNotifPermission}
        onToggleNotifications={handleToggleDailyNotifications}
        onTestNotification={handleTestDailyNotification}
      />

      <CommunityHubModal
        isOpen={isCommunityHubOpen}
        onClose={() => setIsCommunityHubOpen(false)}
        initialTab={communityInitialTab}
        initialSelectedProfileId={selectedCommunityProfileId}
        initialSearchQuery={communitySearchPreset}
        currentUser={currentUser}
        profiles={profiles}
        invitations={invitations}
        messages={messages}
        apps={apps}
        builds={builds}
        onOpenAuth={() => {
          setIsCommunityHubOpen(false);
          setIsAuthModalOpen(true);
        }}
        onOpenMyPortfolio={() => {
          setIsCommunityHubOpen(false);
          setIsProfileModalOpen(true);
        }}
        onSendInvitation={handleSendInvitation}
        onRespondInvitation={handleRespondInvitation}
        onSendMessage={handleSendShortMessage}
        onLoadThread={handleLoadThread}
      />

      {currentUser && (
        <PinSetupModal
          isOpen={isPinSetupModalOpen}
          onClose={() => setIsPinSetupModalOpen(false)}
          userEmail={currentUser.email}
          hasInstalledApp={isInstalled || hasInstalledApp}
          onPinUpdated={() => setPinRevision((r) => r + 1)}
          onLockNow={handleLockScreen}
          onShowToast={(msg) => setToastMessage(msg)}
        />
      )}

      {isScreenLocked && currentUser && hasPinConfigured && (
        <PinLockScreen
          user={currentUser}
          onUnlock={handleUnlockScreen}
          onFallbackToPassword={async () => {
            await handleLogout();
            setIsAuthModalOpen(true);
          }}
        />
      )}

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
        authToken={authToken}
        onShowToast={(msg) => setToastMessage(msg)}
        onRefreshApps={fetchApps}
        onSelectApp={setActiveAppModal}
        onSettingsUpdated={(s) => setPlatformSettings(s)}
        onRefreshBuilds={refreshBuilds}
      />

      <GoogleKeepModal
        isOpen={isKeepModalOpen}
        onClose={() => {
          setIsKeepModalOpen(false);
          setKeepInitialAppIdea(null);
        }}
        currentUser={currentUser}
        authToken={authToken}
        initialAppIdea={keepInitialAppIdea}
        onClearInitialAppIdea={() => setKeepInitialAppIdea(null)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLoginSuccess={handleLoginSuccess}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      <PWAInstallBanner onShowToast={(msg) => setToastMessage(msg)} />
      <ScrollToTopButton />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
