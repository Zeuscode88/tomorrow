import React, { useEffect, useState } from 'react';
import { Briefcase, Plus, Trash2, Check, Globe, Code2 } from 'lucide-react';
import { AvailabilityStatus, PortfolioItem, PublicProfile } from '../types/social';
import { SavePortfolioPayload } from '../services/socialSync';
import { User } from '../types/auth';

interface PortfolioEditorProps {
  currentUser: User;
  profile: PublicProfile | null;
  onSave: (payload: SavePortfolioPayload) => Promise<void>;
  onOpenPublicNetwork?: () => void;
}

const AVAILABILITY_OPTIONS: AvailabilityStatus[] = [
  'Disponible',
  'Ouvert aux collabs',
  'Occupé',
];

export const PortfolioEditor: React.FC<PortfolioEditorProps> = ({
  currentUser,
  profile,
  onSave,
  onOpenPublicNetwork,
}) => {
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [availability, setAvailability] = useState<AvailabilityStatus>(
    profile?.availability || 'Disponible'
  );
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl || '');
  const [websiteUrl, setWebsiteUrl] = useState(profile?.websiteUrl || '');
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(
    profile?.portfolioItems || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setHeadline(profile.headline || '');
    setBio(profile.bio || '');
    setAvailability(profile.availability || 'Disponible');
    setSkills(profile.skills || []);
    setGithubUrl(profile.githubUrl || '');
    setWebsiteUrl(profile.websiteUrl || '');
    setPortfolioItems(profile.portfolioItems || []);
  }, [profile]);

  const handleAddSkill = () => {
    const clean = skillInput.trim().slice(0, 32);
    if (!clean) return;
    if (skills.length >= 8) return;
    if (skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setSkills((prev) => [...prev, clean]);
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleAddProject = () => {
    if (portfolioItems.length >= 4) return;
    setPortfolioItems((prev) => [
      ...prev,
      {
        id: `pf-${Date.now()}`,
        title: '',
        description: '',
        tech: '',
        url: '',
      },
    ]);
  };

  const handleUpdateProject = (
    idx: number,
    field: keyof PortfolioItem,
    value: string
  ) => {
    setPortfolioItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveProject = (idx: number) => {
    setPortfolioItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedNotice(false);
    try {
      const cleanedItems = portfolioItems
        .filter((item) => item.title.trim().length > 0)
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          title: item.title.trim().slice(0, 80),
          description: item.description.trim().slice(0, 200),
          tech: item.tech?.trim().slice(0, 60) || undefined,
          url: item.url?.trim() || undefined,
        }));

      await onSave({
        name: currentUser.name,
        role: currentUser.role,
        country: currentUser.country || "Côte d'Ivoire",
        headline: headline.trim().slice(0, 100),
        bio: bio.trim().slice(0, 400),
        skills: skills.slice(0, 8),
        portfolioItems: cleanedItems,
        githubUrl: githubUrl.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        availability,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2600);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 p-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            <span>Portfolio bref public</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Visible par les autres développeurs et membres pour découvrir vos réalisations et vous inviter.
          </p>
        </div>
        {onOpenPublicNetwork && (
          <button
            type="button"
            onClick={onOpenPublicNetwork}
            className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-[11px] font-bold text-slate-900 dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            Voir l'annuaire
          </button>
        )}
      </div>

      {/* Availability */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Disponibilité
        </label>
        <div className="grid grid-cols-3 gap-2">
          {AVAILABILITY_OPTIONS.map((opt) => {
            const active = availability === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setAvailability(opt)}
                className={`rounded-xl border px-2.5 py-2 text-[11px] font-bold transition-colors ${
                  active
                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-zinc-600'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Headline */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Accroche (Titre court)
          </label>
          <span className="text-[10px] font-mono text-slate-400">{headline.length}/100</span>
        </div>
        <input
          type="text"
          maxLength={100}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Ex : Dev Full-Stack Mobile Money & Offline-First"
          className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
        />
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Présentation brève
          </label>
          <span className="text-[10px] font-mono text-slate-400">{bio.length}/400</span>
        </div>
        <textarea
          rows={3}
          maxLength={400}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Décrivez brièvement votre parcours, vos domaines favoris et ce que vous souhaitez bâtir en Afrique..."
          className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none resize-none"
        />
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Compétences clés ({skills.length}/8)
          </label>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={32}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            placeholder="Ex : React, Flutter, USSD, Design..."
            disabled={skills.length >= 8}
            className="flex-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            disabled={skills.length >= 8 || !skillInput.trim()}
            className="inline-flex items-center gap-1 rounded-xl bg-black dark:bg-white px-3 py-2 text-xs font-bold text-white dark:text-black disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter</span>
          </button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-slate-900 dark:text-white"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(s)}
                  className="text-slate-400 hover:text-black dark:hover:text-white"
                  aria-label={`Retirer ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Code2 className="h-3 w-3" />
            <span>GitHub (optionnel)</span>
          </label>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/..."
            className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span>Site / Lien pro (optionnel)</span>
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-black dark:focus:border-white focus:outline-none"
          />
        </div>
      </div>

      {/* Portfolio Items */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Réalisations / Projets ({portfolioItems.length}/4)
          </label>
          <button
            type="button"
            onClick={handleAddProject}
            disabled={portfolioItems.length >= 4}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-slate-900 dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-40 transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Ajouter un projet</span>
          </button>
        </div>

        {portfolioItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-4 text-center text-[11px] text-slate-500 dark:text-slate-400">
            Ajoutez jusqu'à 4 projets brefs pour présenter votre savoir-faire à la communauté.
          </div>
        ) : (
          <div className="space-y-3">
            {portfolioItems.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                    Projet #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(idx)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-black dark:hover:text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Retirer</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    maxLength={80}
                    required
                    value={item.title}
                    onChange={(e) => handleUpdateProject(idx, 'title', e.target.value)}
                    placeholder="Nom du projet (obligatoire)"
                    className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none"
                  />
                  <input
                    type="text"
                    maxLength={60}
                    value={item.tech || ''}
                    onChange={(e) => handleUpdateProject(idx, 'tech', e.target.value)}
                    placeholder="Technos (ex : React, Node.js)"
                    className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none"
                  />
                </div>

                <textarea
                  rows={2}
                  maxLength={200}
                  value={item.description}
                  onChange={(e) => handleUpdateProject(idx, 'description', e.target.value)}
                  placeholder="Résumé bref (max 200 caractères)..."
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-xs text-slate-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none resize-none"
                />

                <input
                  type="url"
                  value={item.url || ''}
                  onChange={(e) => handleUpdateProject(idx, 'url', e.target.value)}
                  placeholder="Lien démo ou repo (https://...)"
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save footer */}
      <div className="pt-2 flex items-center justify-end gap-3">
        {savedNotice && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-black dark:text-white">
            <Check className="h-3.5 w-3.5" />
            <span>Portfolio enregistré</span>
          </span>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors"
        >
          <span>{isSaving ? 'Enregistrement...' : 'Enregistrer mon portfolio'}</span>
        </button>
      </div>
    </form>
  );
};
