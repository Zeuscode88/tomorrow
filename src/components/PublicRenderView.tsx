import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  GitBranch,
  Users,
  ExternalLink,
  Code2,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { AppIdea } from '../types/app';
import { ProjectBuild } from '../types/builder';
import { WebViewFrame } from './WebViewFrame';
import { ExportShareBar } from './ExportShareBar';
import { isSafeHttpUrl, isSafeImageSrc } from '../utils/urlSafety';
import { fetchSingleBuild } from '../services/builderSync';
import { SiteFooter } from './SiteFooter';

interface PublicRenderViewProps {
  buildId: string;
  initialBuild?: ProjectBuild | null;
  apps: AppIdea[];
  onBackToStore: () => void;
  onOpenProjectDetail: (app: AppIdea) => void;
  onShowToast: (msg: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: string;
  onChangeLanguage: (langCode: string) => void;
  isTranslating?: boolean;
}

export const PublicRenderView: React.FC<PublicRenderViewProps> = ({
  buildId,
  initialBuild,
  apps,
  onBackToStore,
  onOpenProjectDetail,
  onShowToast,
  theme,
  onToggleTheme,
  language,
  onChangeLanguage,
  isTranslating = false,
}) => {
  const [build, setBuild] = useState<ProjectBuild | null>(initialBuild || null);
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    initialBuild?.activeVersionId || ''
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialBuild);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (initialBuild && initialBuild.id === buildId) {
      setBuild(initialBuild);
      setSelectedVersionId((prev) => prev || initialBuild.activeVersionId);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchSingleBuild(buildId)
      .then((loaded) => {
        if (!active) return;
        if (!loaded) {
          setError('Ce lien de rendu public est introuvable ou a été retiré.');
        } else {
          setBuild(loaded);
          setSelectedVersionId(loaded.activeVersionId || loaded.versions[0]?.id || '');
        }
      })
      .catch(() => {
        if (active) setError('Impossible de charger ce rendu.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [buildId, initialBuild]);

  const parentApp = build ? apps.find((a) => a.id === build.appId) || null : null;
  const activeVersion =
    build?.versions.find((v) => v.id === selectedVersionId) ||
    build?.versions.find((v) => v.id === build.activeVersionId) ||
    build?.versions[0] ||
    null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 mx-auto rounded-full border-2 border-slate-300 dark:border-zinc-700 border-t-black dark:border-t-white animate-spin" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Chargement du rendu public...</p>
        </div>
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center space-y-4">
          <span className="text-lg font-black text-black dark:text-white lowercase">tomorrow</span>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Rendu introuvable</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">{error || 'Lien invalide.'}</p>
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-2.5 text-xs font-semibold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retourner sur tomorrow</span>
          </button>
        </div>
      </div>
    );
  }

  const githubLink =
    (activeVersion?.githubUrl && isSafeHttpUrl(activeVersion.githubUrl) && activeVersion.githubUrl) ||
    (build.githubUrl && isSafeHttpUrl(build.githubUrl) && build.githubUrl) ||
    null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Fixed Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Retour</span>
            </button>

            <span
              data-no-translate="true"
              className="text-lg font-black tracking-tight text-black dark:text-white lowercase whitespace-nowrap shrink-0"
            >
              tomorrow
            </span>

            <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700 hidden sm:inline">/</span>

            <div className="min-w-0 hidden sm:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{build.title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Projet : {build.appTitle} · {build.progressStage} ({build.progressPercent}%)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Version Switcher */}
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <select
                value={activeVersion?.id || ''}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                aria-label="Sélectionner une version du rendu"
                className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 focus:border-slate-900 dark:focus:border-white focus:outline-none"
              >
                {build.versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.versionTag} {v.id === build.activeVersionId ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {githubLink && (
              <a
                href={githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-800 whitespace-nowrap shrink-0"
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>GitHub</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            )}

            {parentApp && (
              <button
                type="button"
                onClick={() => onOpenProjectDetail(parentApp)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-3.5 py-1.5 text-xs font-semibold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 whitespace-nowrap shrink-0"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Fiche & Studio</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Public Showcase Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 sm:px-6 pt-20 sm:pt-24 pb-6 space-y-6">
        {activeVersion && (
          <WebViewFrame
            mode={activeVersion.mode}
            previewUrl={activeVersion.previewUrl}
            htmlCode={activeVersion.htmlCode}
            title={build.title}
            heightClass="h-[460px] sm:h-[580px]"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white">{build.title}</h1>
                <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                  {build.progressStage} · {build.progressPercent}%
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {build.summary || 'Prototype communautaire développé sur tomorrow.'}
              </p>

              {activeVersion && (
                <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Notes de version ({activeVersion.versionTag})
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{activeVersion.changelog}</p>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    Publié par {activeVersion.authorName} · {new Date(activeVersion.createdAt).toLocaleDateString('fr-FR')}
                    {activeVersion.aiEngineLabel ? ` · ${activeVersion.aiEngineLabel}` : ''}
                  </div>
                </div>
              )}
            </section>

            {activeVersion?.screenshots && activeVersion.screenshots.filter(isSafeImageSrc).length > 0 && (
              <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span>Captures & Avancement ({activeVersion.screenshots.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeVersion.screenshots.filter(isSafeImageSrc).map((src, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950">
                      <img
                        src={src}
                        alt={`Capture ${i + 1} de ${build.title}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span>
                  {build.isGroupProject ? 'Équipe du projet' : 'Créateur'} ({build.members.length})
                </span>
              </h2>
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {build.members.map((m) => (
                  <div key={m.userId} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{m.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.role}</div>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{m.country}</span>
                  </div>
                ))}
              </div>
            </section>

            {parentApp && (
              <ExportShareBar
                app={parentApp}
                builds={[build]}
                renderBuildId={build.id}
                onShowToast={onShowToast}
                compact
              />
            )}
          </div>
        </div>
      </main>

      <SiteFooter
        theme={theme}
        onToggleTheme={onToggleTheme}
        language={language}
        onChangeLanguage={onChangeLanguage}
        isTranslating={isTranslating}
        subtitle="Rendu public collaboratif"
        onPrimaryAction={onBackToStore}
        primaryActionLabel="Retour au catalogue"
        withBottomDockPadding={false}
      />
    </div>
  );
};
