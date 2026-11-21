import React from 'react';
import { Heart, ChevronRight, RefreshCw, Share2 } from 'lucide-react';
import { AppIdea } from '../types/app';
import { getAppIcon } from '../utils/icons';
import { CountryFlagIcon } from '../utils/countryIcons';
import { getSectorIcon } from '../utils/sectorIcons';
import { shareAppIdea } from '../utils/share';

interface DailyDropBannerProps {
  dailyApps: AppIdea[];
  onSelectApp: (app: AppIdea) => void;
  onVote: (appId: string, e: React.MouseEvent) => void;
  onOpenAIGenerator: () => void;
  userVotes: Record<string, boolean>;
  isGenerating?: boolean;
  onShowToast?: (msg: string) => void;
}

export const DailyDropBanner: React.FC<DailyDropBannerProps> = ({
  dailyApps,
  onSelectApp,
  onVote,
  onOpenAIGenerator,
  userVotes,
  isGenerating,
  onShowToast,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 p-4 sm:p-7 md:p-8 shadow-xs">
      {/* Top Banner Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
            <span className="uppercase tracking-wider">Édition Quotidienne</span>
            <span className="text-slate-300 dark:text-zinc-700">|</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">Analyse IA (Gemini)</span>
          </div>
          <h1 className="mt-1 text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Les 4 applications sélectionnées par l'IA aujourd'hui
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Chaque matin, l'IA analyse les données démographiques, climatiques et sanitaires
            pour proposer 4 solutions logicielles manquantes prioritaires pour l'Afrique.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={onOpenAIGenerator}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-2.5 text-xs font-semibold text-white dark:text-black shadow-xs transition-colors hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Génération...' : 'Générer pour un pays africain'}</span>
          </button>
        </div>
      </div>

      {/* 4 Cards Responsive Grid */}
      <div className="relative z-10 mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dailyApps.map((app, index) => {
          const hasVoted = userVotes[app.id];
          return (
            <div
              key={app.id}
              onClick={() => onSelectApp(app)}
              className="group relative flex flex-col justify-between cursor-pointer rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-zinc-600 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xs transition-transform group-hover:scale-105">
                    {getAppIcon(app.icon, 'w-6 h-6')}
                  </div>

                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-2 py-1">
                    <CountryFlagIcon code={app.countryCode || app.country.slice(0, 2)} className="w-4 h-3" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                      {app.country}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="font-bold text-slate-900 dark:text-white">0{index + 1}.</span>
                  <span className="flex items-center gap-1 line-clamp-1">
                    {getSectorIcon(app.sector, 'w-3.5 h-3.5 text-slate-700 dark:text-slate-300 inline')}
                    <span>{app.sector}</span>
                  </span>
                </div>

                <h3 className="mt-1.5 text-base font-bold text-slate-900 dark:text-white group-hover:text-black dark:group-hover:text-slate-200 transition-colors">
                  {app.title}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
                  {app.tagline}
                </p>

                <div className="mt-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-2.5 text-[11px] text-slate-700 dark:text-slate-300 leading-normal">
                  <span className="font-bold text-slate-900 dark:text-white">Défi : </span>
                  <span className="line-clamp-2">{app.problemSolved}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 text-xs gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote(app.id, e);
                    }}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-bold transition-all ${
                      hasVoted
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                        : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-zinc-700 hover:border-slate-400'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${hasVoted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                    <span>{app.votes}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await shareAppIdea(app, onShowToast);
                    }}
                    title="Partager cette application"
                    className="flex items-center justify-center rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
                    aria-label="Partager cette application"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900 dark:text-white">
                  <span>Dossier Dev</span>
                  <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
