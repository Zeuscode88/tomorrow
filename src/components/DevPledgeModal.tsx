import React, { useState, useEffect } from 'react';
import { X, Code2, Check, ArrowLeft } from 'lucide-react';
import { AppIdea } from '../types/app';
import { CountryFlagIcon } from '../utils/countryIcons';
import { User } from '../types/auth';
import { AFRICAN_COUNTRIES, DEFAULT_AFRICAN_COUNTRY } from '../data/africanCountries';

interface DevPledgeModalProps {
  app: AppIdea | null;
  onClose: () => void;
  onSubmitPledge: (
    appId: string,
    pledgeData: { name: string; role: string; country: string; githubOrContact?: string; comment: string }
  ) => Promise<void>;
  onShowToast: (msg: string) => void;
  currentUser?: User | null;
}

export const DevPledgeModal: React.FC<DevPledgeModalProps> = ({
  app,
  onClose,
  onSubmitPledge,
  onShowToast,
  currentUser,
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [role, setRole] = useState('Développeur Fullstack');
  const [country, setCountry] = useState(currentUser?.country || app?.country || DEFAULT_AFRICAN_COUNTRY);
  const [githubOrContact, setGithubOrContact] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.country) setCountry(currentUser.country);
    } else if (app?.country) {
      setCountry(app.country);
    }
  }, [currentUser, app]);

  if (!app) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmitPledge(app.id, {
        name: name.trim(),
        role,
        country: country.trim() || app.country,
        githubOrContact: githubOrContact.trim(),
        comment: comment.trim() || 'Prêt à développer ou contribuer à cette application !',
      });
      onShowToast(`Merci ${name} ! Votre engagement pour ${app.title} a été enregistré.`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/55 dark:bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-7 shadow-2xl my-4">
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
            <Code2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Rejoindre le développement</h2>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              <span>Projet :</span>
              <span className="text-slate-900 dark:text-white font-bold">{app.title}</span>
              <CountryFlagIcon code={app.countryCode || app.country.slice(0, 2)} className="w-3.5 h-2.5 inline" />
              <span>{app.country}</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
          En vous déclarant intéressé, vous permettez aux citoyens et aux autres développeurs
          de savoir qu'une équipe locale prend en main cette opportunité.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Votre Nom ou Pseudo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Kouassi Konan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Votre Rôle Technique
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white focus:outline-none font-medium"
              >
                <option value="Développeur Mobile (Flutter / React Native)">Mobile (Flutter / RN)</option>
                <option value="Développeur Fullstack">Développeur Fullstack</option>
                <option value="Ingénieur Backend / Cloud">Ingénieur Backend</option>
                <option value="Ingénieur IoT / Hardware">IoT / Matériel / LoRa</option>
                <option value="Designer UI/UX">Designer UI/UX</option>
                <option value="Chef de projet / Product Owner">Chef de projet / PO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Votre Pays de résidence
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white focus:outline-none font-medium"
              >
                {AFRICAN_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Profil GitHub, Portfolio ou Contact (optionnel)
            </label>
            <input
              type="text"
              placeholder="github.com/votre-compte ou email"
              value={githubOrContact}
              onChange={(e) => setGithubOrContact(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Votre message / Ce que vous souhaitez apporter
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Je peux concevoir l'architecture hors-ligne et monter un premier prototype d'ici 3 semaines..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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
              <Check className="h-4 w-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Confirmer mon engagement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
