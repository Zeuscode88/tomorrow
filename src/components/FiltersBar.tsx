import React from 'react';
import { SECTORS } from '../data/seedApps';
import { Flame, Code2, MapPin } from 'lucide-react';
import { getSectorIcon } from '../utils/sectorIcons';
import { AfricaContinentIcon } from '../utils/africanIcons';

interface FiltersBarProps {
  selectedSector: string;
  onSelectSector: (sector: string) => void;
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
  availableCountries: string[];
  sortMode: 'popular' | 'daily' | 'devs' | 'recent';
  onSortModeChange: (mode: 'popular' | 'daily' | 'devs' | 'recent') => void;
  totalAppsCount: number;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  selectedSector,
  onSelectSector,
  selectedCountry,
  onSelectCountry,
  availableCountries,
  sortMode,
  onSortModeChange,
  totalAppsCount,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Filter Bar: African Countries & Sort Options */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-2.5 py-1 text-[10.5px] sm:text-[11px] font-semibold text-white dark:text-black shadow-xs whitespace-nowrap">
            <span>Afrique uniquement</span>
            <span className="text-[10px] font-mono px-1 rounded-sm bg-slate-800 dark:bg-slate-200 text-slate-200 dark:text-black tabular-nums">
              {totalAppsCount}
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedCountry}
              onChange={(e) => onSelectCountry(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 pl-6 pr-6 text-[10.5px] sm:text-[11px] font-semibold text-slate-800 dark:text-slate-100 focus:border-slate-900 dark:focus:border-white focus:outline-none shadow-xs max-w-[200px] sm:max-w-none truncate"
            >
              <option value="Tous">Tous les pays africains ({availableCountries.length})</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <MapPin className="pointer-events-none absolute left-2 top-1.5 h-3 w-3 text-slate-400" />
          </div>
        </div>

        {/* Sort Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex flex-wrap items-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 p-0.5 text-[10.5px] sm:text-[11px]">
            <button
              type="button"
              onClick={() => onSortModeChange('popular')}
              className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 font-semibold transition-colors whitespace-nowrap ${
                sortMode === 'popular'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flame className="h-3 w-3 text-black dark:text-white shrink-0" />
              <span>Populaires</span>
            </button>
            <button
              type="button"
              onClick={() => onSortModeChange('daily')}
              className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 font-semibold transition-colors whitespace-nowrap ${
                sortMode === 'daily'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AfricaContinentIcon className="h-3 w-3 text-black dark:text-white shrink-0" />
              <span>4 du jour</span>
            </button>
            <button
              type="button"
              onClick={() => onSortModeChange('devs')}
              className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 font-semibold transition-colors whitespace-nowrap ${
                sortMode === 'devs'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="h-3 w-3 shrink-0" />
              <span>Devs recherchés</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sector categories bar — wrapped so every sector tab stays visible across all devices */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-0.5 hidden sm:inline shrink-0">
          Secteurs :
        </span>
        {SECTORS.map((sector) => {
          const isSelected = selectedSector === sector;
          return (
            <button
              key={sector}
              type="button"
              onClick={() => onSelectSector(sector)}
              className={`flex items-center gap-1 whitespace-nowrap rounded-xl px-2 sm:px-2.5 py-1 text-[10.5px] sm:text-[11px] font-semibold transition-all shrink-0 ${
                isSelected
                  ? 'border border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-black shadow-xs'
                  : 'border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {sector !== 'Tous' &&
                getSectorIcon(
                  sector,
                  `w-3 h-3 ${isSelected ? 'text-white dark:text-black' : 'text-slate-600 dark:text-slate-400'}`
                )}
              <span>{sector}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
