import React from 'react';
import { Compass, Flame, Users, PlusCircle, User as UserIcon } from 'lucide-react';
import { User } from '../types/auth';

export type BottomTabId = 'explore' | 'daily' | 'network' | 'submit' | 'profile';

interface BottomTabBarProps {
  activeTab: BottomTabId;
  dailyCount: number;
  pendingInvitesCount?: number;
  currentUser: User | null;
  onSelectExplore: () => void;
  onSelectDaily: () => void;
  onOpenCommunity: () => void;
  onOpenSubmit: () => void;
  onOpenProfileOrAuth: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  dailyCount,
  pendingInvitesCount = 0,
  currentUser,
  onSelectExplore,
  onSelectDaily,
  onOpenCommunity,
  onOpenSubmit,
  onOpenProfileOrAuth,
}) => {
  const tabs: {
    id: BottomTabId;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    badge?: number;
  }[] = [
    {
      id: 'explore',
      label: 'Explorer',
      icon: <Compass className="h-5 w-5" />,
      onClick: onSelectExplore,
    },
    {
      id: 'daily',
      label: 'Drop IA',
      icon: <Flame className="h-5 w-5" />,
      onClick: onSelectDaily,
      badge: dailyCount,
    },
    {
      id: 'network',
      label: 'Réseau',
      icon: <Users className="h-5 w-5" />,
      onClick: onOpenCommunity,
      badge: pendingInvitesCount,
    },
    {
      id: 'submit',
      label: 'Proposer',
      icon: <PlusCircle className="h-5 w-5" />,
      onClick: onOpenSubmit,
    },
    {
      id: 'profile',
      label: currentUser ? 'Profil' : 'Compte',
      icon: <UserIcon className="h-5 w-5" />,
      onClick: onOpenProfileOrAuth,
    },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-40 md:bottom-3 md:left-1/2 md:-translate-x-1/2 md:w-[min(94vw,540px)]"
    >
      <div className="border-t md:border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl md:rounded-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.06)] md:shadow-[0_12px_36px_rgba(0,0,0,0.14)] dark:md:shadow-[0_12px_36px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)] md:pb-0">
        <div className="grid grid-cols-5 items-center h-[54px] px-1 sm:px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.onClick}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center min-h-[44px] rounded-xl px-0.5 sm:px-1 py-1 transition-all active:scale-95 min-w-0 ${
                  isActive
                    ? 'text-black dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0.5 h-0.5 w-5 rounded-full bg-black dark:bg-white"
                  />
                )}
                <span className="relative flex items-center justify-center">
                  <span className="[&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-[18px] sm:[&>svg]:w-[18px]">
                    {tab.icon}
                  </span>
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span className="ml-0.5 text-[9px] font-mono font-bold tabular-nums text-slate-600 dark:text-slate-300">
                      {tab.badge}
                    </span>
                  )}
                </span>
                <span
                  className={`mt-1 text-[9.5px] sm:text-[10px] leading-none tracking-tight whitespace-nowrap truncate max-w-full px-0.5 ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
