import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  User as UserIcon,
  Heart,
  Code,
  Lightbulb,
  ChevronRight,
  LogOut,
  Plus,
  Lock,
} from 'lucide-react';
import { AppIdea } from '../types/app';
import { User } from '../types/auth';
import { getAppIcon } from '../utils/icons';
import { CountryFlagIcon } from '../utils/countryIcons';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  apps: AppIdea[];
  userVotes: Record<string, boolean>;
  onSelectApp: (app: AppIdea) => void;
  onVote: (appId: string, e?: React.MouseEvent) => void;
  onOpenSubmit: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  hasPin?: boolean;
  hasInstalledApp?: boolean;
  onOpenPinSetup?: () => void;
  onLockScreen?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  apps,
  userVotes,
  onSelectApp,
  onVote,
  onOpenSubmit,
  onOpenAuth,
  onLogout,
  hasPin = false,
  hasInstalledApp = false,
  onOpenPinSetup,
  onLockScreen,
}) => {
  const [activeTab, setActiveTab] = useState<'votes' | 'pledges' | 'ideas'>('votes');

  if (!isOpen) return null;

  const votedApps = apps.filter((app) => !!userVotes[app.id]);

  const pledgedApps = apps.filter((app) => {
    if (!currentUser) return false;
    return (
      app.devPledges &&
      app.devPledges.some(
        (p) =>
          (p.userEmail && p.userEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
          (p.githubOrContact && p.githubOrContact.toLowerCase() === currentUser.email.toLowerCase()) ||
          (p.name && currentUser.name && p.name.toLowerCase() === currentUser.name.toLowerCase())
      )
    );
  });

  const submittedApps = apps.filter((app) => {
    if (!currentUser) return false;
    return (
      (app.authorEmail && app.authorEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
      (app.authorName && currentUser.name && app.authorName.toLowerCase() === currentUser.name.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/55 dark:bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-7 md:p-8 shadow-2xl my-4 sm:my-6 max-h-[90vh] flex flex-col">
        {/* Top Back & Close Bar */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Retour</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!currentUser ? (
          <div className="py-8 text-center space-y-4 my-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xs">
              <UserIcon className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Mon Espace Profil</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Connectez-vous pour retrouver vos votes citoyens, vos propositions d'applications et vos engagements développeur.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="flex items-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-2.5 text-xs font-bold text-white dark:text-black shadow-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span>Se connecter / S'inscrire</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-200 dark:border-zinc-800 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black text-lg font-black shadow-xs">
                    {currentUser.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">{currentUser.name}</h2>
                      <span className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {currentUser.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{currentUser.email}</p>
                    {currentUser.country && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                        <span>Origine :</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser.country}</span>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Déconnexion</span>
                </button>
              </div>

              {/* PIN Quick Lock Strip */}
              {(onOpenPinSetup || onLockScreen) && (
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="h-3.5 w-3.5 text-black dark:text-white shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {hasPin ? 'Verrouillage par code PIN actif' : 'Verrouillage temporaire par code PIN'}
                      </span>
                      <span className="hidden sm:inline text-slate-400 dark:text-slate-500 ml-1.5">
                        · {hasInstalledApp ? 'App installée prête' : 'Clavier numérique intégré'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasPin && onLockScreen && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onLockScreen();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-3 py-1.5 text-[11px] font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                      >
                        <Lock className="h-3 w-3" />
                        <span>Verrouiller l'écran</span>
                      </button>
                    )}

                    {onOpenPinSetup && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPinSetup();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-900 dark:hover:border-white transition-colors"
                      >
                        <span>{hasPin ? 'Gérer le PIN' : 'Configurer un code PIN'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                <div
                  onClick={() => setActiveTab('votes')}
                  className={`cursor-pointer rounded-2xl border p-3 text-center transition-all ${
                    activeTab === 'votes'
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-xs'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="text-lg font-black">{votedApps.length}</div>
                  <div className="text-[11px] font-semibold flex items-center justify-center gap-1">
                    <Heart className="h-3 w-3 fill-current" />
                    <span>Votes</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('pledges')}
                  className={`cursor-pointer rounded-2xl border p-3 text-center transition-all ${
                    activeTab === 'pledges'
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-xs'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="text-lg font-black">{pledgedApps.length}</div>
                  <div className="text-[11px] font-semibold flex items-center justify-center gap-1">
                    <Code className="h-3 w-3" />
                    <span className="truncate">Engagements</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('ideas')}
                  className={`cursor-pointer rounded-2xl border p-3 text-center transition-all ${
                    activeTab === 'ideas'
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-xs'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="text-lg font-black">{submittedApps.length}</div>
                  <div className="text-[11px] font-semibold flex items-center justify-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    <span>Idées</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex border-b border-slate-200 dark:border-zinc-800 text-xs font-bold pt-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('votes')}
                className={`flex items-center gap-1.5 border-b-2 py-3 px-3 whitespace-nowrap transition-colors ${
                  activeTab === 'votes'
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Heart className="h-3.5 w-3.5" />
                <span>Mes Votes ({votedApps.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pledges')}
                className={`flex items-center gap-1.5 border-b-2 py-3 px-3 whitespace-nowrap transition-colors ${
                  activeTab === 'pledges'
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>Mes Engagements Dev ({pledgedApps.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ideas')}
                className={`flex items-center gap-1.5 border-b-2 py-3 px-3 whitespace-nowrap transition-colors ${
                  activeTab === 'ideas'
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Mes Idées Proposées ({submittedApps.length})</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 space-y-3 pr-1">
              {activeTab === 'votes' && (
                <>
                  {votedApps.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <Heart className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-600" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Vous n'avez pas encore voté pour une idée.
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Parcourez le catalogue et cliquez sur le cœur pour soutenir les concepts prioritaires.
                      </p>
                    </div>
                  ) : (
                    votedApps.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 hover:border-slate-400 dark:hover:border-zinc-600 transition-colors"
                      >
                        <div
                          onClick={() => {
                            onClose();
                            onSelectApp(app);
                          }}
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
                            {getAppIcon(app.icon, 'w-5 h-5')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <CountryFlagIcon code={app.countryCode} className="w-3.5 h-2.5" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{app.country}</span>
                              <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
                              <span className="truncate">{app.sector}</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{app.title}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{app.tagline}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => onVote(app.id, e)}
                            className="flex items-center gap-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300"
                            title="Retirer mon vote"
                          >
                            <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                            <span>{app.votes}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectApp(app);
                            }}
                            className="rounded-xl border border-slate-200 dark:border-zinc-700 p-2 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white"
                            title="Voir le projet"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {activeTab === 'pledges' && (
                <>
                  {pledgedApps.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <Code className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-600" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Aucun engagement de développement actif.
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Si vous êtes développeur, parcourez les applications et cliquez sur "Je veux coder" pour vous engager sur un MVP.
                      </p>
                    </div>
                  ) : (
                    pledgedApps.map((app) => {
                      const myPledge = app.devPledges.find(
                        (p) =>
                          (p.userEmail && p.userEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
                          (p.githubOrContact && p.githubOrContact.toLowerCase() === currentUser.email.toLowerCase()) ||
                          (p.name && currentUser.name && p.name.toLowerCase() === currentUser.name.toLowerCase())
                      );

                      return (
                        <div
                          key={app.id}
                          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div
                              onClick={() => {
                                onClose();
                                onSelectApp(app);
                              }}
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
                                {getAppIcon(app.icon, 'w-5 h-5')}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{app.title}</h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span>{app.country}</span>
                                  <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{myPledge?.role}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectApp(app);
                              }}
                              className="flex items-center gap-1 rounded-xl bg-black dark:bg-white px-3 py-1.5 text-[11px] font-bold text-white dark:text-black shrink-0"
                            >
                              <span>Dossier Dev</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>

                          {myPledge?.comment && (
                            <div className="rounded-xl bg-slate-50 dark:bg-zinc-900 p-2 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-zinc-800 italic">
                              "{myPledge.comment}"
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {activeTab === 'ideas' && (
                <>
                  {submittedApps.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                      <Lightbulb className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-600" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Vous n'avez pas encore proposé d'idée.
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Partagez un besoin concret constaté dans votre pays pour qu'une équipe locale s'en empare !
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSubmit();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-3.5 py-2 text-xs font-bold text-white dark:text-black"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Proposer une idée</span>
                      </button>
                    </div>
                  ) : (
                    submittedApps.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3"
                      >
                        <div
                          onClick={() => {
                            onClose();
                            onSelectApp(app);
                          }}
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
                            {getAppIcon(app.icon, 'w-5 h-5')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <CountryFlagIcon code={app.countryCode} className="w-3.5 h-2.5" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{app.country}</span>
                              <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
                              <span className="truncate">{app.status}</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{app.title}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{app.tagline}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                            <Heart className="h-3 w-3 text-slate-400" />
                            <span>{app.votes}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectApp(app);
                            }}
                            className="rounded-xl border border-slate-200 dark:border-zinc-700 p-2 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white"
                            title="Voir la fiche"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
