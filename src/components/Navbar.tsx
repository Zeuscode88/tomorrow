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
} from 'lucide-react';
import { User } from '../types/auth';
import { AfricaContinentIcon, AdinkraMotifIcon } from '../utils/africanIcons';

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
}) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 39, seconds: 12 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isAdmin = currentUser?.email.toLowerCase() === 'jonatha2ngs@gmail.com';

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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        {/* Left: Back to Concept + Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onOpenLanding && (
            <button
              type="button"
              onClick={onOpenLanding}
              title="Retour à l'accueil tomorrow"
              aria-label="Retour à l'accueil"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Accueil</span>
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
                className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white lowercase"
              >
                tomorrow
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              L'App Store des applications qui manquent à l'Afrique
            </p>
          </div>
        </div>

        {/* Search Input - Desktop & Tablet */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par pays, secteur, besoin ou tech..."
            className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-900 py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors focus:border-slate-900 dark:focus:border-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Action buttons & User Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Daily Drop Pill */}
          <button
            type="button"
            onClick={onSelectDailyDrop}
            title="Consulter les 4 nouveautés du jour sélectionnées par l'IA"
            className="hidden xl:flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <AfricaContinentIcon className="h-3.5 w-3.5 text-black dark:text-white" />
            <span className="font-semibold text-slate-900 dark:text-white">Drop IA : {dailyCount}</span>
            <span className="text-slate-300 dark:text-zinc-700">|</span>
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium tabular-nums">
              <Clock className="h-3 w-3 inline text-slate-500 dark:text-slate-400" />
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </button>

          {/* AI Generator Button */}
          <button
            type="button"
            onClick={onOpenAIGenerator}
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <AdinkraMotifIcon className="h-3.5 w-3.5 text-black dark:text-white" />
            <span>Générer par IA</span>
          </button>

          {/* Proposer button */}
          <button
            type="button"
            onClick={onOpenSubmit}
            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-3.5 py-2 text-xs font-semibold text-white dark:text-black shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Proposer</span>
          </button>

          {/* Admin Direct Button (ONLY if jonatha2ngs@gmail.com) */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-2.5 sm:px-3 py-2 text-xs font-bold text-white dark:text-black shadow-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
              title="Dashboard Administratif"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-600" />
              <span className="hidden md:inline">Admin</span>
            </button>
          )}

          {/* Quick Lock Screen Button (when user has PIN configured) */}
          {currentUser && hasPin && onLockScreen && (
            <button
              type="button"
              onClick={onLockScreen}
              title="Verrouiller temporairement l'écran (Code PIN)"
              aria-label="Verrouiller temporairement l'écran"
              className="hidden sm:flex items-center justify-center rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 text-slate-700 dark:text-slate-200 hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Lock className="h-4 w-4" />
            </button>
          )}

          {/* Mon Profil & Auth Controls */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 sm:px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 hover:border-slate-900 dark:hover:border-white shadow-xs transition-colors"
                title="Accéder à Mon Profil"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold">
                  {currentUser.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden md:inline font-bold text-slate-900 dark:text-white truncate max-w-[110px]">
                  Mon Profil
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
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
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
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
                      className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenProfile}
                className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                title="Consulter Mon Profil"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Mon Profil</span>
              </button>

              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-slate-800 dark:text-white hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
              >
                <span>Connexion</span>
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Submenu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-3 sm:hidden">
          {/* Mobile search */}
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher pays, problème, tech..."
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onSelectDailyDrop();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              <AfricaContinentIcon className="h-3.5 w-3.5 text-black dark:text-white" />
              <span>Drop IA ({dailyCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenProfile();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              <UserIcon className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
              <span>Mon Profil</span>
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

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-black dark:border-zinc-600 bg-slate-900 dark:bg-zinc-800 py-2.5 text-xs font-bold text-white shadow-xs"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
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
