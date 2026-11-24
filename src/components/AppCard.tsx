import React from 'react';
import { Heart, Users, Code, Share2 } from 'lucide-react';
import { AppIdea } from '../types/app';
import { getAppIcon } from '../utils/icons';
import { CountryFlagIcon } from '../utils/countryIcons';
import { getSectorIcon } from '../utils/sectorIcons';
import { shareAppIdea } from '../utils/share';
import { AfricaContinentIcon } from '../utils/africanIcons';

interface AppCardProps {
  app: AppIdea;
  hasVoted: boolean;
  onVote: (appId: string, e: React.MouseEvent) => void;
  onSelectApp: (app: AppIdea) => void;
  onOpenPledge: (app: AppIdea, e: React.MouseEvent) => void;
  onShowToast?: (msg: string) => void;
  buildsCount?: number;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  hasVoted,
  onVote,
  onSelectApp,
  onOpenPledge,
  onShowToast,
  buildsCount = 0,
}) => {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await shareAppIdea(app, onShowToast);
  };

  return (
    <div
      onClick={() => onSelectApp(app)}
      className="group relative flex flex-col justify-between cursor-pointer rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-zinc-600 hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xs transition-transform group-hover:scale-105">
              {getAppIcon(app.icon, 'w-6 h-6')}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <CountryFlagIcon code={app.countryCode || app.country.slice(0, 2)} className="w-3.5 h-2.5 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{app.country}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
                <span className="shrink-0">{app.continent}</span>
              </div>
              <h3 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white group-hover:text-black dark:group-hover:text-slate-200 transition-colors truncate">
                {app.title}
              </h3>
              <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                {getSectorIcon(app.sector, 'w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0')}
                <span className="truncate">{app.sector}</span>
              </p>
            </div>
          </div>

          {app.isDailyDrop ? (
            <span className="flex items-center gap-1 rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700 shrink-0">
              <AfricaContinentIcon className="h-3 w-3" />
              <span>Drop IA</span>
            </span>
          ) : (
            <span className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
              {app.status}
            </span>
          )}
        </div>

        <p className="mt-3 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
          {app.tagline}
        </p>

        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {app.problemSolved}
        </p>

        <div className="mt-3 rounded-xl bg-slate-50 dark:bg-zinc-950 p-2.5 border border-slate-100 dark:border-zinc-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-2">
          <span className="text-slate-900 dark:text-white font-bold shrink-0">Impact :</span>
          <span className="line-clamp-2">{app.impactPotential}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {app.techStackSuggested.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-700 dark:text-slate-300"
            >
              {tech}
            </span>
          ))}
          {app.techStackSuggested.length > 3 && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              +{app.techStackSuggested.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 text-xs gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onVote(app.id, e);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-bold transition-all ${
              hasVoted
                ? 'bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white'
                : 'bg-white dark:bg-zinc-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-zinc-700 hover:border-black dark:hover:border-white'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${hasVoted ? 'fill-current' : 'text-black dark:text-white'}`} />
            <span>{app.votes}</span>
            <span
              className={`text-[11px] font-normal ${
                hasVoted ? 'text-slate-300 dark:text-zinc-600' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              votes
            </span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            title="Partager cette application"
            className="flex items-center justify-center rounded-xl p-2 text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            aria-label="Partager cette idée"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {buildsCount > 0 && (
            <span className="hidden sm:inline text-[11px] text-slate-700 dark:text-slate-300 font-semibold tabular-nums">
              {buildsCount} rendu{buildsCount > 1 ? 's' : ''}
            </span>
          )}
          {app.devPledges?.length > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
              <Users className="h-3 w-3" />
              <span>{app.devPledges.length} dev{app.devPledges.length > 1 ? 's' : ''}</span>
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPledge(app, e);
            }}
            className="flex items-center gap-1 rounded-xl bg-slate-900 dark:bg-white px-2.5 py-1.5 text-[11px] font-bold text-white dark:text-black hover:bg-black dark:hover:bg-slate-200 transition-colors"
          >
            <Code className="h-3 w-3" />
            <span>Je veux coder</span>
          </button>
        </div>
      </div>
    </div>
  );
};
