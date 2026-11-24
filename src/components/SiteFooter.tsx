import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Languages, Check, Send, RefreshCw, ChevronUp, Heart } from 'lucide-react';
import { AFRICAN_LANGUAGES, getAfricanLanguageByCode } from '../data/africanLanguages';

interface SiteFooterProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: string;
  onChangeLanguage: (langCode: string) => void;
  isTranslating?: boolean;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  subtitle?: string;
  withBottomDockPadding?: boolean;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  theme,
  onToggleTheme,
  language,
  onChangeLanguage,
  isTranslating = false,
  onPrimaryAction,
  primaryActionLabel,
  subtitle = "L'App Store africain des applications qui manquent à l'Afrique",
  withBottomDockPadding = false,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLang = getAfricanLanguageByCode(language);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    if (langMenuOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [langMenuOpen]);

  return (
    <footer
      className={`mt-14 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pt-8 text-xs text-slate-500 dark:text-slate-400 transition-colors ${
        withBottomDockPadding ? 'pb-24 sm:pb-28' : 'pb-10'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Footer Row: Brand + Navigation + Controls (Theme + Google African Language Selector) */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-center lg:text-left">
            <span className="font-black text-black dark:text-white lowercase text-sm" data-no-translate="true">
              tomorrow
            </span>
            <span className="text-slate-400 dark:text-slate-500">· {subtitle}</span>
          </div>

          {/* Footer Controls: Language Selector (Google) + Dark Mode Switch */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {onPrimaryAction && primaryActionLabel && (
              <button
                type="button"
                onClick={onPrimaryAction}
                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white hover:border-black dark:hover:border-white transition-colors"
              >
                {primaryActionLabel}
              </button>
            )}

            {/* Language Picker (African Languages Powered by Google) */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen((v) => !v)}
                aria-expanded={langMenuOpen}
                aria-label="Choisir une langue africaine (propulsé par Google)"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-slate-900 dark:hover:border-white transition-colors"
              >
                {isTranslating ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-black dark:text-white" />
                ) : (
                  <Languages className="h-3.5 w-3.5 text-black dark:text-white" />
                )}
                <span data-no-translate="true">{currentLang.nativeName}</span>
                <ChevronUp
                  className={`h-3 w-3 text-slate-400 transition-transform ${
                    langMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {langMenuOpen && (
                <div
                  data-no-translate="true"
                  className="absolute bottom-full mb-2 right-0 sm:left-0 sm:right-auto w-72 max-h-80 flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl z-50 overflow-hidden"
                >
                  <div className="border-b border-slate-100 dark:border-zinc-800 px-3.5 py-2.5 flex items-center justify-between bg-slate-50 dark:bg-zinc-950/70">
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                      Langues d'Afrique
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      Propulsé par Google
                    </span>
                  </div>

                  <div className="overflow-y-auto p-1.5 space-y-0.5">
                    {AFRICAN_LANGUAGES.map((lang) => {
                      const active = lang.code === language;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            onChangeLanguage(lang.code);
                            setLangMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
                            active
                              ? 'bg-black dark:bg-white text-white dark:text-black'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">
                              {lang.nativeName}{' '}
                              {lang.nativeName !== lang.frenchName && (
                                <span
                                  className={`font-normal ${
                                    active
                                      ? 'text-slate-300 dark:text-slate-600'
                                      : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                >
                                  ({lang.frenchName})
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-[10px] truncate ${
                                active
                                  ? 'text-slate-300 dark:text-slate-600'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {lang.region}
                            </div>
                          </div>
                          {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle Moved to Footer */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-slate-900 dark:hover:border-white transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-white" />
                  <span>Mode clair</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-black" />
                  <span>Mode sombre</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Attribution Row */}
        <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href="https://t.me/+2250504206378"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white hover:opacity-75 transition-opacity"
          >
            <Send className="h-3.5 w-3.5 text-black dark:text-white" />
            <span className="inline-flex items-center gap-1">
              <span>Réaliser avec le</span>
              <Heart
                className="h-3.5 w-3.5 fill-black text-black dark:fill-white dark:text-white"
                aria-label="❤️"
              />
              <span>par Jdeek studio</span>
            </span>
          </a>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
            4 nouveautés quotidiennes par IA · Mode hors-ligne · Afrique
          </span>
        </div>
      </div>
    </footer>
  );
};
