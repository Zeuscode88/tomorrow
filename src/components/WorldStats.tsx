import React, { useMemo } from 'react';
import { BarChart3, MapPin } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AppIdea } from '../types/app';
import { SECTORS } from '../data/seedApps';
import { CountryFlagIcon } from '../utils/countryIcons';

interface WorldStatsProps {
  totalApps: number;
  totalVotes: number;
  totalDevs: number;
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
  apps?: AppIdea[];
  isDark?: boolean;
}

const SECTOR_SHORT_LABELS: Record<string, string> = {
  'Agriculture & Alimentation': 'Agriculture',
  'Santé & Urgence': 'Santé',
  'Éducation & Langues': 'Éducation',
  'Inclusion Financière & Tontines': 'Fintech & Tontines',
  'Énergie, Eau & Climat': 'Énergie & Eau',
  'Mobilité & Logistique': 'Mobilité',
  'Artisanat, Commerce & Tourisme': 'Artisanat',
  'Citoyenneté & Droits': 'Citoyenneté',
};

export const WorldStats: React.FC<WorldStatsProps> = ({
  totalApps,
  totalVotes,
  totalDevs,
  selectedCountry,
  onSelectCountry,
  apps = [],
  isDark = false,
}) => {
  const countryStats = useMemo(() => {
    const map = new Map<string, { country: string; code: string; count: number }>();
    apps.forEach((a) => {
      if (!a.country) return;
      const existing = map.get(a.country);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(a.country, {
          country: a.country,
          code: a.countryCode || a.country.slice(0, 2),
          count: 1,
        });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
      .slice(0, 8);
  }, [apps]);

  const chartData = useMemo(() => {
    const relevantApps =
      selectedCountry === 'Tous'
        ? apps
        : apps.filter((a) => a.country.toLowerCase() === selectedCountry.toLowerCase());

    const sectorsList = SECTORS.filter((s) => s !== 'Tous');

    return sectorsList.map((sector) => {
      const matching = relevantApps.filter((a) => a.sector === sector);
      const votes = matching.reduce((sum, a) => sum + (a.votes || 0), 0);
      return {
        sector,
        shortName: SECTOR_SHORT_LABELS[sector] || sector,
        votes,
        appsCount: matching.length,
      };
    });
  }, [apps, selectedCountry]);

  const maxVotes = useMemo(() => {
    return Math.max(...chartData.map((d) => d.votes), 5);
  }, [chartData]);

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-7 md:p-8 shadow-xs space-y-7">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-zinc-800 pb-6">
        <div>
          <h2 className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-slate-900 dark:text-white shrink-0" />
            <span>Répartition africaine des besoins technologiques</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Cliquez sur un pays d'Afrique pour filtrer instantanément les concepts d'applications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs self-start md:self-auto">
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{totalApps}</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">Apps en Afrique</div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800" />
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{totalVotes}</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">Votes citoyens</div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800" />
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{totalDevs}</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">Devs mobilisés</div>
          </div>
        </div>
      </div>

      {/* African Countries Quick Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {countryStats.map((item) => {
          const isSelected = selectedCountry.toLowerCase() === item.country.toLowerCase();

          return (
            <button
              key={item.country}
              type="button"
              onClick={() => onSelectCountry(isSelected ? 'Tous' : item.country)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
                isSelected
                  ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-xs'
                  : 'border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800'
              }`}
            >
              <CountryFlagIcon code={item.code} className="w-5 h-3.5 mb-1.5" />
              <span className="text-[11px] font-bold leading-tight truncate max-w-full">{item.country}</span>
              <span
                className={`mt-0.5 text-[10px] font-mono font-medium ${
                  isSelected
                    ? 'text-slate-300 dark:text-slate-700'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.count} {item.count > 1 ? 'concepts' : 'concept'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Recharts Bar Chart */}
      <div className="border-t border-slate-200 dark:border-zinc-800 pt-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black dark:bg-white text-white dark:text-black">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Répartition des votes par secteur en Afrique
              </h3>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                {selectedCountry === 'Tous'
                  ? "Vue continentale (Toute l'Afrique)"
                  : `Filtré sur le pays : ${selectedCountry}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10.5px] font-semibold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-black dark:bg-white inline-block" />
              <span>Votes citoyens cumulés</span>
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/70 p-2.5 sm:p-4">
          <div className="h-60 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 10, left: -16, bottom: 24 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#27272a' : '#e2e8f0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="shortName"
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#3f3f46' : '#cbd5e1' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={[0, maxVotes]}
                />
                <Tooltip
                  cursor={{ fill: isDark ? '#18181b' : '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 shadow-lg text-xs">
                          <p className="font-bold text-slate-900 dark:text-white">{data.sector}</p>
                          <div className="mt-1.5 flex items-center justify-between gap-4 text-slate-600 dark:text-slate-300">
                            <span>Votes exprimés :</span>
                            <span className="font-bold font-mono text-black dark:text-white">{data.votes}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400 text-[11px]">
                            <span>Applications :</span>
                            <span className="font-medium font-mono">{data.appsCount}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="votes"
                  fill={isDark ? '#ffffff' : '#000000'}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
