import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Clock,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Users,
  StickyNote,
} from 'lucide-react';
import { User } from '../types/auth';
import { AfricaContinentIcon, AdinkraMotifIcon } from '../utils/africanIcons';
import { isAdminEmail } from '../utils/adminAuth';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSubmit: () => void;
  onOpenAIGenerator: () => void;
  onSelectDailyDrop: () => void;
  dailyCount: number;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onOpenLanding?: () => void;
  hasPin?: boolean;
  onLockScreen?: () => void;
  onOpenPinSetup?: () => void;
  onOpenCommunity?: () => void;
  onOpenKeepNotes?: () => void;
  pendingInvitesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenSubmit,
  onOpenAIGenerator,
  onSelectDailyDrop,
  dailyCount,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenAdmin,
  onLogout,
  onOpenLanding,
  hasPin = false,
  onLockScreen,
  onOpenPinSetup,
  onOpenCommunity,
  onOpenKeepNotes,
  pendingInvitesCount = 0,
}) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 39, seconds: 12 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isAdmin = isAdminEmail(currentUser?.email);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-4 lg:px-6 py-2">
        {/* Left: Back to Concept + Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
          {onOpenLanding && (
            <button
              type="button"
              onClick={onOpenLanding}
              title="Retour à l'accueil tomorrow"
              aria-label="Retour à l'accueil"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-2 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Accueil</span>
            </button>
          )}

          <div
            onClick={onOpenLanding}
            className={`min-w-0 ${onOpenLanding ? 'cursor-pointer' : ''}`}
            title={onOpenLanding ? 'Présentation & Concept tomorrow' : undefined}
          >
            <div className="flex items-center">
              <span
                data-no-translate="true"
                className="text-base sm:text-lg font-black tracking-tight text-black dark:text-white lowercase whitespace-nowrap"
              >
                tomorrow
              </span>
            </div>
            <p className="hidden xl:block text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[240px]">
              L'App Store des applications qui manquent à l'Afrique
            </p>
          </div>
        </div>

        {/* Search Input - Desktop & Tablet */}
        <div className="relative flex-1 max-w-[170px] md:max-w-[220px] lg:max-w-[270px] xl:max-w-sm hidden sm:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher pays, secteur..."
            className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-900 py-1.5 pl-8 pr-7 text-[11px] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors focus:border-slate-900 dark:focus:border-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold"
            >
              ×
            </button>
          )}
        </div>

        {/* Action buttons & User Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Daily Drop Pill */}
          <button
            type="button"
            onClick={onSelectDailyDrop}
            title="Consulter les 4 nouveautés du jour sélectionnées par l'IA"
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-2.5 py-1.5 text-[11px] text-slate-800 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 whitespace-nowrap"
          >
            <AfricaContinentIcon className="h-3 w-3 text-black dark:text-white shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-white">Drop {dailyCount}</span>
            <span className="hidden xl:inline text-slate-300 dark:text-zinc-700">|</span>
            <span className="hidden xl:flex font-mono text-[10px] text-slate-600 dark:text-slate-400 items-center gap-1 font-medium tabular-nums">
              <Clock className="h-3 w-3 inline text-slate-500 dark:text-slate-400" />
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </button>

          {/* AI Generator Button */}
          <button
            type="button"
            onClick={onOpenAIGenerator}
            className="hidden md:flex items-center gap-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 sm:px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-100 shadow-xs hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            <AdinkraMotifIcon className="h-3.5 w-3.5 text-black dark:text-white shrink-0" />
            <span className="hidden lg:inline">Générer par IA</span>
            <span className="lg:hidden">IA</span>
          </button>

          {/* Community Portfolios & Messages Button */}
          {onOpenCommunity && (
            <button
              type="button"
              onClick={onOpenCommunity}
              title="Portfolios, invitations & messages courts"
              className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 sm:px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-100 shadow-xs hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
            >
              <Users className="h-3.5 w-3.5 text-black dark:text-white shrink-0" />
              <span>Réseau</span>
              {pendingInvitesCount > 0 && (
                <span className="rounded-md bg-black dark:bg-white px-1 py-0.5 text-[9.5px] font-mono font-black text-white dark:text-black">
                  {pendingInvitesCount}
                </span>
              )}
            </button>
          )}

          {/* Google Keep Notes Button - visible on ALL viewports */}
          {onOpenKeepNotes && (
            <button
              type="button"
              onClick={onOpenKeepNotes}
              title="Notes & Checklists Google Keep"
              className="flex items-center gap-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-[10.5px] sm:text-[11px] font-semibold text-slate-800 dark:text-slate-100 shadow-xs hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
            >
              <StickyNote className="h-3.5 w-3.5 text-black dark:text-white shrink-0" />
              <span>Keep</span>
            </button>
          )}

          {/* Proposer button */}
          <button
            type="button"
            onClick={onOpenSubmit}
            className="hidden sm:flex items-center gap-1 rounded-xl bg-black dark:bg-white px-2.5 py-1.5 text-[11px] font-semibold text-white dark:text-black shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
            <span>Proposer</span>
          </button>

          {/* Admin Direct Button (for jonatha2ngs@gmail.com & lumanegrah88@gmail.com) */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1 rounded-xl bg-black dark:bg-white px-2 sm:px-2.5 py-1.5 text-[10.5px] sm:text-[11px] font-bold text-white dark:text-black shadow-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors whitespace-nowrap"
              title="Dashboard Administratif"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-white dark:text-black shrink-0" />
              <span>Admin</span>
            </button>
          )}

          {/* Quick Lock Screen Button (when user has PIN configured) */}
          {currentUser && hasPin && onLockScreen && (
            <button
              type="button"
              onClick={onLockScreen}
              title="Verrouiller temporairement l'écran (Code PIN)"
              aria-label="Verrouiller temporairement l'écran"
              className="hidden sm:flex items-center justify-center rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1.5 text-slate-700 dark:text-slate-200 hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Mon Profil & Auth Controls */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-[10.5px] sm:text-[11px] text-slate-800 dark:text-slate-100 hover:border-slate-900 dark:hover:border-white shadow-xs transition-colors whitespace-nowrap"
                title="Accéder à Mon Profil"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold shrink-0">
                  {currentUser.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden md:inline font-bold text-slate-900 dark:text-white truncate max-w-[90px]">
                  Profil
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xl z-50 text-xs">
                  <div className="border-b border-slate-100 dark:border-zinc-800 pb-2.5 mb-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {currentUser.role} {currentUser.country ? `· ${currentUser.country}` : ''}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAdmin();
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <ShieldCheck className="h-4 w-4 text-black dark:text-white" />
                        <span>Dashboard Administrateur</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-left"
                    >
                      <UserIcon className="h-4 w-4 text-black dark:text-white" />
                      <span>Mon Profil & Engagements</span>
                    </button>

                    {onOpenKeepNotes && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenKeepNotes();
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <StickyNote className="h-4 w-4 text-black dark:text-white" />
                        <span>Notes Google Keep</span>
                      </button>
                    )}

                    {onOpenCommunity && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenCommunity();
                        }}
                        className="w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <span className="flex items-center gap-2.5">
                          <Users className="h-4 w-4 text-black dark:text-white" />
                          <span>Réseau &amp; Messages</span>
                        </span>
                        {pendingInvitesCount > 0 && (
                          <span className="rounded-md bg-black dark:bg-white px-1.5 py-0.5 text-[10px] font-mono font-black text-white dark:text-black">
                            {pendingInvitesCount}
                          </span>
                        )}
                      </button>
                    )}

                    {(onLockScreen || onOpenPinSetup) && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (hasPin && onLockScreen) {
                            onLockScreen();
                          } else if (onOpenPinSetup) {
                            onOpenPinSetup();
                          }
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <Lock className="h-3.5 w-3.5 text-black dark:text-white" />
                        <span>{hasPin ? "Verrouiller l'écran (PIN)" : 'Activer verrouillage PIN'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenProfile}
                className="hidden lg:flex items-center gap-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
                title="Consulter Mon Profil"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Profil</span>
              </button>

              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 sm:px-2.5 py-1.5 text-[10.5px] sm:text-[11px] font-bold text-slate-800 dark:text-white hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs whitespace-nowrap"
              >
                <span>Connexion</span>
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shrink-0"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Submenu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-3 space-y-2.5 sm:hidden max-h-[75vh] overflow-y-auto">
          {/* Mobile search */}
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher pays, problème, tech..."
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 py-1.5 pl-9 pr-3 text-[11px] text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => {
                onSelectDailyDrop();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-2 text-[10.5px] font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap"
            >
              <AfricaContinentIcon className="h-3.5 w-3.5 text-black dark:text-white shrink-0" />
              <span>Drop ({dailyCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenAIGenerator();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-2 text-[10.5px] font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap"
            >
              <AdinkraMotifIcon className="h-3.5 w-3.5 text-black dark:text-white shrink-0" />
              <span>Générer IA</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenProfile();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 text-[10.5px] font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap"
            >
              <UserIcon className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
              <span>Profil</span>
            </button>
          </div>

          {onOpenLanding && (
            <button
              type="button"
              onClick={() => {
                onOpenLanding();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Retour à l'accueil & Concept</span>
            </button>
          )}

          {onOpenKeepNotes && (
            <button
              type="button"
              onClick={() => {
                onOpenKeepNotes();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
            >
              <StickyNote className="h-3.5 w-3.5" />
              <span>Notes & Checklists Keep</span>
            </button>
          )}

          {onOpenCommunity && (
            <button
              type="button"
              onClick={() => {
                onOpenCommunity();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Réseau &amp; Portfolios</span>
              {pendingInvitesCount > 0 && (
                <span className="rounded-md bg-black dark:bg-white px-1.5 py-0.5 text-[10px] font-mono font-black text-white dark:text-black">
                  {pendingInvitesCount}
                </span>
              )}
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-black dark:border-zinc-600 bg-slate-900 dark:bg-zinc-800 py-2.5 text-xs font-bold text-white shadow-xs"
            >
              <ShieldCheck className="h-4 w-4 text-white" />
              <span>Dashboard Admin</span>
            </button>
          )}

          {currentUser && (onLockScreen || onOpenPinSetup) && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (hasPin && onLockScreen) {
                  onLockScreen();
                } else if (onOpenPinSetup) {
                  onOpenPinSetup();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{hasPin ? "Verrouiller l'écran (Code PIN)" : 'Configurer code PIN rapide'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onOpenSubmit();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-black dark:bg-white py-2.5 text-xs font-semibold text-white dark:text-black"
          >
            <Plus className="h-4 w-4" />
            <span>Proposer une application manquante</span>
          </button>
        </div>
      )}
    </header>
  );
};
