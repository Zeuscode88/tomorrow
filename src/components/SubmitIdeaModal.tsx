import React, { useState } from 'react';
import { X, Send, Lightbulb, RefreshCw, ArrowLeft } from 'lucide-react';
import { Sector } from '../types/app';
import { SECTORS } from '../data/seedApps';
import { CountryFlagIcon } from '../utils/countryIcons';
import { User } from '../types/auth';
import { AdinkraMotifIcon, AfricaContinentIcon } from '../utils/africanIcons';
import { AFRICAN_COUNTRIES, DEFAULT_AFRICAN_COUNTRY } from '../data/africanCountries';

interface SubmitIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appData: any) => Promise<void>;
  onShowToast: (msg: string) => void;
  currentUser?: User | null;
}

export const SubmitIdeaModal: React.FC<SubmitIdeaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onShowToast,
  currentUser,
}) => {
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [country, setCountry] = useState(currentUser?.country || DEFAULT_AFRICAN_COUNTRY);
  const [countryCode, setCountryCode] = useState('CI');
  const [sector, setSector] = useState<Sector>('Agriculture & Alimentation');
  const [targetAudience, setTargetAudience] = useState('');
  const [problemSolved, setProblemSolved] = useState('');
  const [impactPotential, setImpactPotential] = useState('');
  const [techStackInput, setTechStackInput] = useState('React Native, Node.js, SQLite Offline');
  const [rawPitch, setRawPitch] = useState('');
  const [isEnhancingWithAI, setIsEnhancingWithAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCountryChange = (val: string) => {
    setCountry(val);
    const low = val.toLowerCase();
    if (low.includes('sénégal') || low.includes('senegal')) setCountryCode('SN');
    else if (low.includes('côte') || low.includes('cote') || low.includes('ivoire')) setCountryCode('CI');
    else if (low.includes('mali')) setCountryCode('ML');
    else if (low.includes('guinée') || low.includes('guinee')) setCountryCode('GN');
    else if (low.includes('cameroun') || low.includes('cameroon')) setCountryCode('CM');
    else if (low.includes('rdc') || low.includes('kinshasa')) setCountryCode('CD');
    else if (low.includes('kenya')) setCountryCode('KE');
    else if (low.includes('nigeria')) setCountryCode('NG');
    else if (low.includes('maroc') || low.includes('morocco')) setCountryCode('MA');
    else if (low.includes('algérie') || low.includes('algerie')) setCountryCode('DZ');
    else if (low.includes('tunisie') || low.includes('tunisia')) setCountryCode('TN');
    else if (low.includes('madagascar')) setCountryCode('MG');
    else if (low.includes('ghana')) setCountryCode('GH');
    else if (low.includes('rwanda')) setCountryCode('RW');
    else if (low.includes('burkina')) setCountryCode('BF');
    else if (low.includes('bénin') || low.includes('benin')) setCountryCode('BJ');
    else if (low.includes('togo')) setCountryCode('TG');
    else if (low.includes('éthiopie') || low.includes('ethiopie') || low.includes('ethiopia')) setCountryCode('ET');
    else if (low.includes('afrique du sud') || low.includes('south africa')) setCountryCode('ZA');
    else if (low.includes('égypte') || low.includes('egypte') || low.includes('egypt')) setCountryCode('EG');
    else setCountryCode(val.slice(0, 2).toUpperCase() || 'AF');
  };

  const handleEnhanceWithAI = async () => {
    const textToAnalyze = rawPitch || problemSolved || title;
    if (!textToAnalyze.trim()) {
      onShowToast("Veuillez décrire brièvement votre idée d'abord.");
      return;
    }

    setIsEnhancingWithAI(true);
    try {
      const res = await fetch('/api/gemini/enhance-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawPitch: textToAnalyze,
          country,
          sector,
        }),
      });
      const data = await res.json();
      if (data.success && data.enhanced) {
        const enh = data.enhanced;
        if (enh.title) setTitle(enh.title);
        if (enh.tagline) setTagline(enh.tagline);
        if (enh.problemSolved) setProblemSolved(enh.problemSolved);
        if (enh.impactPotential) setImpactPotential(enh.impactPotential);
        if (enh.techStackSuggested?.length) {
          setTechStackInput(enh.techStackSuggested.join(', '));
        }
        onShowToast("Votre concept a été enrichi avec succès par l'IA !");
      }
    } catch (err) {
      console.error(err);
      onShowToast("Erreur lors de l'enrichissement IA.");
    } finally {
      setIsEnhancingWithAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !country.trim() || !problemSolved.trim()) return;

    setIsSubmitting(true);
    try {
      const techStack = techStackInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await onSubmit({
        title: title.trim(),
        tagline: tagline.trim() || title.trim(),
        description: problemSolved.trim(),
        continent: 'Afrique',
        country: country.trim(),
        countryCode: countryCode.toUpperCase(),
        flag: countryCode.toUpperCase(),
        sector,
        targetAudience: targetAudience.trim() || 'Usagers et professionnels locaux en Afrique',
        problemSolved: problemSolved.trim(),
        impactPotential: impactPotential.trim() || 'Impact positif direct pour la communauté',
        techStackSuggested: techStack.length ? techStack : ['React Native', 'Node.js'],
        difficulty: 'Modéré',
        authorEmail: currentUser?.email || '',
        authorName: currentUser?.name || 'Contributeur',
        developerBrief: {
          mvpScope: [
            'Interface mobile intuitive adaptée au contexte local africain',
            'Synchronisation des données en tâche de fond',
            'Système de notification ou SMS / USSD pour alertes',
          ],
          localConstraints: ['Faible bande passante', 'Paiement Mobile Money', 'Multi-langue'],
          monetization: "Modèle ouvert / Subvention d'impact",
          openSourceFriendly: true,
          architecturalTip: 'Privilégier une conception offline-first et légère.',
        },
      });

      onShowToast('Votre proposition a été publiée sur tomorrow !');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/55 dark:bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-7 md:p-8 shadow-2xl my-4 sm:my-6">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Retour</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xs">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Proposer une application pour l'Afrique
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Quelle application manque cruellement dans votre pays ou communauté africaine ?
            </p>
          </div>
        </div>

        {/* AI Assistant Banner */}
        <div className="mt-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <AfricaContinentIcon className="h-4 w-4 text-black dark:text-white" />
              <span>Assistance IA (Structuration automatique)</span>
            </div>
            <button
              type="button"
              onClick={handleEnhanceWithAI}
              disabled={isEnhancingWithAI}
              className="flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-3 py-1.5 text-xs font-semibold text-white dark:text-black shadow-xs hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              {isEnhancingWithAI ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <AdinkraMotifIcon className="h-3.5 w-3.5" />
              )}
              <span>{isEnhancingWithAI ? 'Structuration...' : "Structurer avec l'IA"}</span>
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-normal">
            Écrivez simplement votre idée en quelques mots et l'IA formulera automatiquement le titre, le problème, la stack tech et le cahier des charges !
          </p>
          <input
            type="text"
            placeholder="Ex: Une app pour connecter les coopératives agricoles en Côte d'Ivoire..."
            value={rawPitch}
            onChange={(e) => setRawPitch(e.target.value)}
            className="mt-2.5 w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
          />
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nom de l'application *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: IvoireAgri"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Slogan / Tagline
              </label>
              <input
                type="text"
                placeholder="Ex: Alerte en temps réel sur les stocks d'urgence"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Continent
              </label>
              <div className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-bold">
                Afrique (Exclusif)
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Pays africain cible *
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white focus:outline-none font-medium"
                >
                  {AFRICAN_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <CountryFlagIcon code={countryCode} className="w-5 h-4 shrink-0" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Secteur *
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as Sector)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white focus:outline-none font-medium"
              >
                {SECTORS.filter((s) => s !== 'Tous').map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Quel problème précis cette application résout-elle ? *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Expliquez pourquoi les populations locales souffrent de ce manque aujourd'hui..."
              value={problemSolved}
              onChange={(e) => setProblemSolved(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Impact potentiel mesurable
              </label>
              <input
                type="text"
                placeholder="Ex: Éviter 20h d'attente pour 50 000 patients"
                value={impactPotential}
                onChange={(e) => setImpactPotential(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Technologies suggérées (séparées par des virgules)
              </label>
              <input
                type="text"
                placeholder="React Native, PWA, SMS Gateway..."
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
              />
            </div>
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
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-5 py-2.5 text-xs font-semibold text-white dark:text-black shadow-xs hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Publication...' : 'Publier sur le Store'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
