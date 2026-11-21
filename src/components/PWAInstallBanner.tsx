import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  onShowToast?: (msg: string) => void;
}

const SESSION_DISMISS_KEY = 'tomorrow_pwa_notif_dismissed';

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onShowToast }) => {
  const { canPromptNatively, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    if (isInstalled) {
      setVisible(false);
      return;
    }
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === 'true') {
        return;
      }
    } catch {}

    const timer = setTimeout(() => {
      setVisible(true);
    }, 900);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, 'true');
    } catch {}
  };

  const handleInstallClick = async () => {
    if (canPromptNatively) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        onShowToast?.('tomorrow est en cours d\'installation sur votre appareil !');
        handleDismiss();
        return;
      }
    }
    setVisible(false);
    setShowGuideModal(true);
  };

  if (isInstalled) return null;

  return (
    <>
      {visible && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 sm:top-20 right-3 sm:right-5 z-50 w-[calc(100vw-1.5rem)] max-w-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-3.5 shadow-2xl backdrop-blur-xl transition-all"
        >
          <div className="flex items-start gap-3">
            <img
              src="/icon.svg"
              alt="Icône application tomorrow"
              className="h-12 w-12 rounded-xl border border-slate-200 dark:border-zinc-700 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                  Installer l'application <span className="lowercase" data-no-translate="true">tomorrow</span>
                </p>
                <button
                  type="button"
                  onClick={handleDismiss}
                  aria-label="Fermer la notification"
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white shrink-0 -mt-0.5 -mr-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                Profitez d'une expérience native rapide et consultez le catalogue africain hors-ligne.
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-3 py-1.5 text-[11px] font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>Installer l'app</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => {
                setShowGuideModal(false);
                handleDismiss();
              }}
              className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3.5 pr-6">
              <img
                src="/icon.svg"
                alt="Icône PWA tomorrow"
                className="h-14 w-14 rounded-2xl border border-slate-200 dark:border-zinc-700 shrink-0"
              />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Installer <span className="lowercase" data-no-translate="true">tomorrow</span> hors-ligne
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Accédez au catalogue africain même sans connexion internet.
                </p>
              </div>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-zinc-950 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-[11px]">
                    1
                  </span>
                  <span>
                    Appuyez sur le bouton <Share className="inline h-3.5 w-3.5 mx-0.5" />{' '}
                    <strong>Partager</strong> dans la barre de Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-[11px]">
                    2
                  </span>
                  <span>
                    Sélectionnez <PlusSquare className="inline h-3.5 w-3.5 mx-0.5" />{' '}
                    <strong>Sur l'écran d'accueil</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-[11px]">
                    3
                  </span>
                  <span>
                    Confirmez avec <strong>Ajouter</strong> pour lancer tomorrow comme une application native.
                  </span>
                </li>
              </ol>
            ) : (
              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-zinc-950 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800">
                <div className="flex items-start gap-2.5">
                  <Smartphone className="h-4 w-4 shrink-0 mt-0.5 text-black dark:text-white" />
                  <p>
                    Sur <strong>Chrome, Edge ou Android</strong> : ouvrez le menu du navigateur (⋮ ou icône{' '}
                    <strong>Installer</strong> dans la barre d'adresse) puis cliquez sur{' '}
                    <strong>« Installer l'application tomorrow »</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Service Worker actif · Cache hors-ligne prêt</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowGuideModal(false);
                handleDismiss();
              }}
              className="w-full rounded-xl bg-black dark:bg-white py-2.5 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};
