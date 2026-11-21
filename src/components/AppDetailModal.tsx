import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Heart,
  Code,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Send,
  User as UserIcon,
  Globe,
  ArrowUpRight,
  Upload,
} from 'lucide-react';
import { AppIdea } from '../types/app';
import { ProjectBuild } from '../types/builder';
import type { User } from '../types/auth';
import { getAppIcon } from '../utils/icons';
import { CountryFlagIcon } from '../utils/countryIcons';
import { getSectorIcon } from '../utils/sectorIcons';
import { AfricaContinentIcon, AdinkraMotifIcon } from '../utils/africanIcons';
import { ExportShareBar } from './ExportShareBar';

interface AppDetailModalProps {
  app: AppIdea | null;
  onClose: () => void;
  hasVoted: boolean;
  onVote: (appId: string) => void;
  onOpenPledge: (app: AppIdea) => void;
  onAddComment: (appId: string, author: string, role: string, text: string) => Promise<void>;
  onShowToast: (msg: string) => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  builds?: ProjectBuild[];
  onOpenStudio?: (app: AppIdea, tab?: 'renders' | 'import' | 'ai' | 'agents') => void;
  onOpenPublicRender?: (build: ProjectBuild) => void;
}

export const AppDetailModal: React.FC<AppDetailModalProps> = ({
  app,
  onClose,
  hasVoted,
  onVote,
  onOpenPledge,
  onAddComment,
  onShowToast,
  currentUser,
  onOpenAuth,
  builds = [],
  onOpenStudio,
  onOpenPublicRender,
}) => {
  const [commentAuthor, setCommentAuthor] = useState(currentUser?.name || '');
  const [commentRole, setCommentRole] = useState(currentUser?.role || 'Développeur');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (currentUser?.name && !commentAuthor) {
      setCommentAuthor(currentUser.name);
    }
    if (currentUser?.role) {
      setCommentRole(currentUser.role);
    }
  }, [currentUser]);

  if (!app) return null;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      onShowToast('Lien du concept copié dans le presse-papier !');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentAuthor.trim() || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(app.id, commentAuthor.trim(), commentRole, commentText.trim());
      setCommentText('');
      onShowToast('Votre commentaire a été publié !');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto bg-slate-900/55 dark:bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden my-4 sm:my-6">
        {/* Top visual banner header */}
        <div className="relative p-4 sm:p-7 md:p-8 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/70">
          {/* Top Back & Close Bar */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Retour au catalogue</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <div className="flex h-14 w-14 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl sm:rounded-3xl bg-black dark:bg-white text-white dark:text-black shadow-sm">
              {getAppIcon(app.icon, 'w-7 h-7 sm:w-10 sm:h-10')}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <CountryFlagIcon code={app.countryCode || app.country.slice(0, 2)} className="w-4 h-3" />
                  {app.country}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
                <span>{app.continent}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
                <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                  {getSectorIcon(app.sector, 'w-3.5 h-3.5 text-slate-700 dark:text-slate-300')}
                  {app.sector}
                </span>
                {app.isDailyDrop && (
                  <>
                    <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
                    <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
                      <AfricaContinentIcon className="h-3 w-3" /> Nouveauté IA
                    </span>
                  </>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {app.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {app.tagline}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => onVote(app.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs ${
                hasVoted
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900'
                  : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-zinc-700 hover:border-slate-400'
              }`}
            >
              <Heart className={`h-4 w-4 ${hasVoted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
              <span>{app.votes} votes</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                {hasVoted ? '(Voté)' : '(Voter)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenPledge(app)}
              className="flex items-center gap-2 rounded-xl bg-black dark:bg-white px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white dark:text-black shadow-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors active:scale-95"
            >
              <Code className="h-4 w-4" />
              <span>Je veux développer cette app</span>
            </button>

            {onOpenStudio && (
              <button
                type="button"
                onClick={() => onOpenStudio(app, builds.length > 0 ? 'renders' : 'ai')}
                className="flex items-center gap-2 rounded-xl border border-slate-900 dark:border-white bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <AdinkraMotifIcon className="h-4 w-4 text-black dark:text-white" />
                <span>
                  Studio Dev, WebView & IA {builds.length > 0 ? `(${builds.length})` : ''}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Lien</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-7 md:p-8 space-y-7 max-h-[62vh] overflow-y-auto">
          <ExportShareBar app={app} builds={builds} onShowToast={onShowToast} />

          {/* Section 1 */}
          <section className="space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-slate-400 dark:text-zinc-500">01.</span>
              <span>Pourquoi cette application doit absolument exister</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              {app.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 p-4">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Le problème non résolu</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {app.problemSolved}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30 p-4">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Impact potentiel estimé</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {app.impactPotential}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-3.5 text-xs text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white font-bold">Public cible prioritaire : </strong>
              <span>{app.targetAudience}</span>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 border-t border-slate-200 dark:border-zinc-800 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-slate-400 dark:text-zinc-500">02.</span>
                <span>Cahier des charges pour développeurs locaux</span>
              </h3>
              <span className="rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-bold">
                Difficulté : {app.difficulty}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <span>Périmètre MVP (Version 1 recommandée)</span>
              </h4>
              <ul className="space-y-2">
                {app.developerBrief.mvpScope.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-2">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Contraintes terrain locales</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {app.developerBrief.localConstraints.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">·</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  <span>Conseil d'architecture logicielle</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {app.developerBrief.architecturalTip}
                </p>
                <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-white font-bold">Modèle économique : </strong>
                  {app.developerBrief.monetization}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Technologies conseillées :</h4>
              <div className="flex flex-wrap gap-2">
                {app.techStackSuggested.map((t) => (
                  <span
                    key={t}
                    className="rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-1 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3: Studio & WebView Builds */}
          {onOpenStudio && (
            <section className="space-y-4 border-t border-slate-200 dark:border-zinc-800 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-slate-400 dark:text-zinc-500">03.</span>
                  <span>Rendus WebView, Équipes & Studio IA ({builds.length})</span>
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenStudio(app, 'import')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-800"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Importer un projet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenStudio(app, 'ai')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-3 py-1.5 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
                  >
                    <AdinkraMotifIcon className="h-3.5 w-3.5" />
                    <span>Créer par l'IA / Agents MCP</span>
                  </button>
                </div>
              </div>

              {builds.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {builds.map((b) => {
                    const ver =
                      b.versions.find((v) => v.id === b.activeVersionId) || b.versions[0];
                    return (
                      <div
                        key={b.id}
                        className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{b.title}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                              {ver?.versionTag || 'v0.1.0'} · {b.progressStage} ({b.progressPercent}%) · {b.members.length} membre(s)
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {b.summary || ver?.changelog}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onOpenStudio(app, 'renders')}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
                          >
                            <Globe className="h-3 w-3" />
                            <span>Ouvrir dans Studio</span>
                          </button>

                          {onOpenPublicRender && (
                            <button
                              type="button"
                              onClick={() => onOpenPublicRender(b)}
                              className="inline-flex items-center gap-1 rounded-lg bg-black dark:bg-white px-2.5 py-1.5 text-[11px] font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
                            >
                              <ArrowUpRight className="h-3 w-3" />
                              <span>Rendu public</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-5 text-center space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Codez ce projet seul ou en groupe avec gestion de versions, importez votre client WebView/GitHub, ou générez un prototype interactif en interne avec l'IA et vos serveurs MCP.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Section 4: Pledged Developers */}
          <section className="space-y-4 border-t border-slate-200 dark:border-zinc-800 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-slate-400 dark:text-zinc-500">04.</span>
                <span>Développeurs & Équipes mobilisés ({app.devPledges?.length || 0})</span>
              </h3>
              <button
                type="button"
                onClick={() => onOpenPledge(app)}
                className="text-xs text-slate-900 dark:text-white hover:underline font-bold"
              >
                + Rejoindre l'équipe
              </button>
            </div>

            {app.devPledges && app.devPledges.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {app.devPledges.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{p.role} · {p.country}</div>
                      </div>
                      {p.githubOrContact && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[140px]">
                          {p.githubOrContact}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{p.comment}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-6 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Aucun développeur ne s'est encore engagé sur ce projet. Soyez le premier !
                </p>
                <button
                  type="button"
                  onClick={() => onOpenPledge(app)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-3.5 py-2 text-xs font-semibold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Je m'engage sur ce projet</span>
                </button>
              </div>
            )}
          </section>

          {/* Section 5: Community Comments */}
          <section className="space-y-4 border-t border-slate-200 dark:border-zinc-800 pt-6">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-slate-400 dark:text-zinc-500">05.</span>
              <span>Retours terrain & Discussions ({app.comments?.length || 0})</span>
            </h3>

            <div className="space-y-3">
              {app.comments?.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-3.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 dark:text-white">{c.author}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{c.role}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{c.text}</p>
                </div>
              ))}
            </div>

            {!currentUser ? (
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 text-center space-y-2.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Connectez-vous pour participer aux retours terrain et commenter.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  L'inscription est gratuite et obligatoire afin de préserver la qualité des échanges citoyens.
                </p>
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => onOpenAuth()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>Se connecter / S'inscrire pour commenter</span>
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleCommentSubmit} className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Votre nom ou pseudo"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
                  />
                  <select
                    value={commentRole}
                    onChange={(e) => setCommentRole(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white focus:outline-none"
                  >
                    <option value="Développeur">Développeur</option>
                    <option value="Citoyen local">Citoyen / Usager local</option>
                    <option value="Entrepreneur">Entrepreneur / Porteur de projet</option>
                    <option value="ONG / Association">Acteur humanitaire / ONG</option>
                    <option value="Designer">Product Designer</option>
                  </select>
                </div>

                <textarea
                  required
                  rows={2}
                  placeholder="Partagez un avis, une nuance locale ou un conseil..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none resize-none"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Publier mon commentaire</span>
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
