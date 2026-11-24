import React, { useState } from 'react';
import {
  ArrowRight,
  Code,
  Heart,
  ChevronDown,
  Cpu,
  Smartphone,
  Users,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { AppIdea } from '../types/app';
import { getAppIcon } from '../utils/icons';
import { AfricaContinentIcon, AdinkraMotifIcon } from '../utils/africanIcons';
import { SiteFooter } from './SiteFooter';

interface LandingPageProps {
  onEnterStore: () => void;
  featuredApps: AppIdea[];
  totalAppsCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: string;
  onChangeLanguage: (langCode: string) => void;
  isTranslating?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterStore,
  featuredApps,
  totalAppsCount,
  theme,
  onToggleTheme,
  language,
  onChangeLanguage,
  isTranslating = false,
}) => {
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);

  const previewApp = featuredApps[selectedDemoIndex] || featuredApps[0];

  const steps = [
    {
      step: '01',
      title: 'Identification Citoyenne',
      subtitle: 'Partir du terrain, pas des algorithmes de la Silicon Valley.',
      description:
        'Partout en Afrique, des agriculteurs, soignants, artisans et commerçants affrontent des défis concrets non résolus. Les citoyens soumettent directement les problèmes vitaux de leur pays.',
      icon: <AfricaContinentIcon className="h-6 w-6" />,
    },
    {
      step: '02',
      title: 'Spécification IA & Architecture MVP',
      subtitle: "Transformer une intuition en dossier d'ingénierie complet.",
      description:
        "L'intelligence artificielle de tomorrow analyse la problématique, évalue l'impact humain, et génère un cahier des charges complet : stack technique adaptée (offline-first, USSD), modèle de données et périmètre MVP.",
      icon: <Cpu className="h-6 w-6 stroke-[1.8]" />,
    },
    {
      step: '03',
      title: 'Mobilisation & Engagement Développeur',
      subtitle: 'Passer du vote citoyen à la réalité du code.',
      description:
        'Grâce au bouton "Je veux coder", des ingénieurs africains et de la diaspora s\'engagent nominativement sur les projets prioritaires pour construire et déployer les solutions logicielles.',
      icon: <Code className="h-6 w-6 stroke-[1.8]" />,
    },
  ];

  const pillars = [
    {
      title: 'Contraintes Terrain Réelles',
      desc: 'Connectivité intermittente, SMS/USSD, faible consommation de batterie et terminaux Android modestes.',
      icon: <Smartphone className="h-5 w-5" />,
    },
    {
      title: 'Drop IA Quotidien',
      desc: "Chaque jour à minuit, 4 nouveaux concepts sourcés par IA sont révélés pour stimuler l'innovation collective.",
      icon: <AdinkraMotifIcon className="h-5 w-5" />,
    },
    {
      title: 'Démocratie Participative',
      desc: 'Le vote citoyen décide des priorités de développement, garantissant que chaque ligne de code répond à un besoin.',
      icon: <Heart className="h-5 w-5" />,
    },
    {
      title: 'Engagement Open-Impact',
      desc: "Mise en relation directe entre porteurs d'idées, communautés locales et développeurs volontaires.",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-zinc-950 text-slate-900 dark:text-slate-100 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black font-sans antialiased overflow-x-hidden">
      {/* Background Subtle Mesh & Glass Gradients */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-slate-200/50 dark:bg-zinc-800/25 blur-[130px]" />
        <div className="absolute top-[40%] -left-[10%] h-[500px] w-[500px] rounded-full bg-slate-100 dark:bg-zinc-900/40 blur-[100px]" />
        <div className="absolute top-[70%] -right-[10%] h-[600px] w-[600px] rounded-full bg-slate-200/40 dark:bg-zinc-800/20 blur-[120px]" />
      </div>

      {/* Floating Frosted Glass Fixed Header */}
      <header className="fixed top-3 left-0 right-0 z-50 mx-auto max-w-5xl px-3 sm:px-4">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/60 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/90 p-2 sm:px-4 sm:py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl transition-all">
          <div className="flex items-center px-1">
            <span
              data-no-translate="true"
              className="text-base sm:text-lg font-black tracking-tight text-black dark:text-white lowercase"
            >
              tomorrow
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#how-it-works" className="hover:text-black dark:hover:text-white transition-colors">
              Fonctionnement
            </a>
            <a href="#showcase" className="hover:text-black dark:hover:text-white transition-colors">
              Aperçu
            </a>
            <a href="#pillars" className="hover:text-black dark:hover:text-white transition-colors">
              Piliers
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onEnterStore}
              className="group flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-3 sm:px-4 py-2 text-xs font-bold text-white dark:text-black shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95 whitespace-nowrap"
            >
              <span className="hidden xs:inline">Accéder à l'App Store</span>
              <span className="xs:hidden">Explorer</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pt-24 sm:pt-28 md:pt-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/15 bg-white/80 dark:bg-zinc-900/80 px-3.5 py-1 text-[11px] font-semibold tracking-wide text-slate-700 dark:text-slate-300 shadow-xs backdrop-blur-md">
          <span className="flex h-1.5 w-1.5 rounded-full bg-black dark:bg-white animate-pulse" />
          <span>L'App Store réinventé par et pour l'Afrique</span>
        </div>

        <h1 className="mt-8 text-3xl sm:text-6xl md:text-7xl font-black tracking-tight text-black dark:text-white leading-[1.08]">
          Des millions d'applications existent.
          <br />
          <span className="text-slate-400 dark:text-zinc-500 font-extrabold">
            Voici celles qui manquent à l'Afrique.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-sm sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
          <span className="font-bold text-black dark:text-white lowercase">tomorrow</span> inverse la logique des magasins d'applications. Découvrez, votez et codez
          les solutions numériques indispensables pour les pays, villes et villages d'Afrique.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            type="button"
            onClick={onEnterStore}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-black dark:bg-white px-7 py-3.5 text-sm font-bold text-white dark:text-black shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>Explorer le catalogue ({totalAppsCount}+ apps)</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <a
            href="#how-it-works"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-black/10 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/80 px-6 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-xs backdrop-blur-md hover:bg-white dark:hover:bg-zinc-800 transition-all"
          >
            <span>Comment ça fonctionne</span>
            <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </a>
        </div>

        <div className="mt-16 border-t border-slate-200/80 dark:border-zinc-800 pt-8 grid grid-cols-3 max-w-lg mx-auto text-center gap-4">
          <div>
            <div className="text-2xl font-black text-black dark:text-white">54</div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Pays d'Afrique ciblés</div>
          </div>
          <div>
            <div className="text-2xl font-black text-black dark:text-white">8</div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Secteurs vitaux</div>
          </div>
          <div>
            <div className="text-2xl font-black text-black dark:text-white">100%</div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Axé utilité réelle</div>
          </div>
        </div>
      </section>

      {/* Interactive Product Showcase */}
      <section id="showcase" className="relative z-10 mx-auto max-w-5xl px-4 pt-20 sm:pt-28">
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            Aperçu de l'interface
          </h2>
          <p className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
            Chaque concept est un véritable dossier technique.
          </p>
        </div>

        <div className="relative mx-auto rounded-3xl border border-white/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/75 p-4 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-zinc-800 pb-4 mb-5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-zinc-700 shrink-0" />
              <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-zinc-700 shrink-0" />
              <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-zinc-700 shrink-0" />
              <span className="ml-2 font-mono text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                tomorrow.africa/app/{previewApp?.id || 'dossier'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {featuredApps.slice(0, 3).map((app, idx) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setSelectedDemoIndex(idx)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    selectedDemoIndex === idx
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {app.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {previewApp && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xs">
                    {getAppIcon(previewApp.icon, 'w-7 h-7')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{previewApp.country}</span>
                      <span aria-hidden="true">·</span>
                      <span>{previewApp.continent}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-black dark:text-white font-bold">{previewApp.sector}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-black dark:text-white mt-0.5">
                      {previewApp.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                      {previewApp.tagline}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 p-4 space-y-2 backdrop-blur-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Problématique terrain identifiée
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                    {previewApp.problemSolved}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 p-4 space-y-2 backdrop-blur-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Impact potentiel mesuré
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                    {previewApp.impactPotential}
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 p-4 backdrop-blur-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Statut actuel
                  </span>
                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-black dark:bg-white px-2.5 py-1 text-xs font-bold text-white dark:text-black">
                    <span>{previewApp.status}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Stack technique recommandée
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {previewApp.techStackSuggested.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-800 dark:text-slate-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                    <Heart className="h-4 w-4 text-black dark:text-white fill-black dark:fill-white" />
                    <span>{previewApp.votes} votes</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                    <Users className="h-4 w-4 text-black dark:text-white" />
                    <span>{previewApp.devPledges?.length || 0} développeurs</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onEnterStore}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-black dark:bg-white py-2.5 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs"
                >
                  <span>Rejoindre et voter</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-5xl px-4 pt-20 sm:pt-28">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            Mécanisme
          </h2>
          <p className="mt-1 text-2xl sm:text-4xl font-black tracking-tight text-black dark:text-white">
            Comment fonctionne <span className="lowercase text-black dark:text-white">tomorrow</span> ?
          </p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
            Une chaîne continue de la prise de conscience citoyenne au déploiement du code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div
              key={s.step}
              className="relative flex flex-col justify-between rounded-3xl border border-white/80 dark:border-zinc-800 bg-white/75 dark:bg-zinc-900/75 p-6 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-black/20 dark:hover:border-zinc-700 hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xs">
                    {s.icon}
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-300 dark:text-zinc-700">
                    {s.step}
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-black text-black dark:text-white">
                  {s.title}
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                  {s.subtitle}
                </p>
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  {s.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-1.5 text-[11px] font-bold text-black dark:text-white">
                <CheckCircle2 className="h-3.5 w-3.5 text-black dark:text-white" />
                <span>Impact direct vérifié</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars Section */}
      <section id="pillars" className="relative z-10 mx-auto max-w-5xl px-4 pt-20 sm:pt-28">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            Architecture
          </h2>
          <p className="mt-1 text-2xl sm:text-4xl font-black tracking-tight text-black dark:text-white">
            Conçu pour les réalités africaines.
          </p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
            Pas de fonctionnalités gadgets ou d'illusions spéculatives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {pillars.map((p, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 rounded-3xl border border-white/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-6 shadow-xs backdrop-blur-xl hover:border-black/15 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xs">
                {p.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">{p.title}</h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action Card */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 py-20 sm:py-28">
        <div className="relative overflow-hidden rounded-3xl border border-black dark:border-zinc-800 bg-black dark:bg-zinc-900 p-8 sm:p-12 md:p-16 text-center text-white shadow-2xl">
          <div className="pointer-events-none absolute inset-0 bg-radial from-white/10 to-transparent" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Prêt à transformer les besoins de l'Afrique en code ?
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Rejoignez les citoyens, porteurs de projet et développeurs à travers l'Afrique.
              Votez pour les projets prioritaires ou engagez-vous pour développer le prochain MVP.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={onEnterStore}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-black hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 shadow-md"
              >
                <span>Accéder à tomorrow maintenant</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Theme Toggle, Google African Language Picker & Jdeek Studio Link */}
      <div className="relative z-10">
        <SiteFooter
          theme={theme}
          onToggleTheme={onToggleTheme}
          language={language}
          onChangeLanguage={onChangeLanguage}
          isTranslating={isTranslating}
          onPrimaryAction={onEnterStore}
          primaryActionLabel="Lancer l'application →"
          withBottomDockPadding={false}
        />
      </div>
    </div>
  );
};
