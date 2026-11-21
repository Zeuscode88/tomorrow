import React, { useState } from 'react';
import { X, RefreshCw, MapPin, ArrowLeft } from 'lucide-react';
import { SECTORS } from '../data/seedApps';
import { AdinkraMotifIcon } from '../utils/africanIcons';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (payload: { continent: string; country: string; sector: string; focus: string }) => Promise<void>;
  isGenerating: boolean;
}

const GENERATION_STEPS = [
  'Analyse des défis socio-économiques et climatiques en Afrique...',
  'Détection des manques critiques non résolus pour les populations africaines...',
  'Modélisation des architectures offline-first / USSD et paiement Mobile Money...',
  'Génération des fiches complètes avec directives MVP pour développeurs africains...',
];

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}) => {
  const [country, setCountry] = useState<string>('');
  const [sector, setSector] = useState<string>('Tous');
  const [focus, setFocus] = useState<string>('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);

    try {
      await onGenerate({
        continent: 'Afrique',
        country: country.trim(),
        sector,
        focus: focus.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      clearInterval(interval);
      setCurrentStepIndex(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/55 dark:bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-7 shadow-2xl overflow-hidden my-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Retour</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xs">
            <AdinkraMotifIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Générateur d'Apps Africaines par IA
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Spécialisé sur les besoins réels du continent africain
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
          Configurez vos critères pour déclencher la création de 4 nouvelles propositions
          d'applications adaptées aux réalités locales africaines (offline-first, Mobile Money, USSD).
        </p>

        {isGenerating ? (
          <div className="mt-8 space-y-6 py-6 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white animate-spin">
              <RefreshCw className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Analyse & Création en cours...
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono transition-all duration-300">
                {GENERATION_STEPS[currentStepIndex]}
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              {GENERATION_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i <= currentStepIndex
                      ? 'w-6 bg-black dark:bg-white'
                      : 'w-2 bg-slate-200 dark:bg-zinc-700'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleStart} className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3.5 py-2.5 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
                <span>Zone géographique</span>
              </span>
              <span className="rounded-md bg-black dark:bg-white px-2 py-0.5 text-[11px] font-bold text-white dark:text-black">
                Afrique (Exclusif)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Pays africain spécifique (optionnel)
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white focus:outline-none font-medium"
              >
                <option value="">Toute l'Afrique (Sélection intelligente IA)</option>
                {AFRICAN_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Secteur prioritaire
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white focus:outline-none font-medium"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Défi ou thématique prioritaire (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: Électrification rurale solaire, tontines, santé maternelle..."
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-5 py-2.5 text-xs font-semibold text-white dark:text-black shadow-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95"
              >
                <AdinkraMotifIcon className="h-4 w-4" />
                <span>Générer 4 propositions</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
