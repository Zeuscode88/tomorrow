import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  MapPin,
} from 'lucide-react';
import { User as UserType, UserRole } from '../types/auth';
import { loginWithFirebase, registerWithFirebase } from '../services/firebaseAuthService';
import { auth } from '../firebase';
import { AFRICAN_COUNTRIES, DEFAULT_AFRICAN_COUNTRY } from '../data/africanCountries';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType, token: string) => void;
  onShowToast: (msg: string) => void;
  hasInstalledApp?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onShowToast,
  hasInstalledApp = false,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Développeur local');
  const [country, setCountry] = useState(DEFAULT_AFRICAN_COUNTRY);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // 1. Attempt Firebase Authentication
      let fbUser: UserType | null = null;
      let fbToken: string | null = null;

      try {
        if (tab === 'login') {
          fbUser = await loginWithFirebase(email.trim(), password);
          const currentUser = auth.currentUser;
          if (currentUser) {
            fbToken = await currentUser.getIdToken();
          }
        } else {
          fbUser = await registerWithFirebase(
            email.trim(),
            password,
            name.trim(),
            role,
            country.trim() || DEFAULT_AFRICAN_COUNTRY
          );
          const currentUser = auth.currentUser;
          if (currentUser) {
            fbToken = await currentUser.getIdToken();
          }
        }
      } catch (fbErr: any) {
        console.warn('Firebase direct auth notice (falling back to server endpoint):', fbErr?.message || fbErr);
      }

      if (fbUser && fbToken) {
        onLoginSuccess(fbUser, fbToken);
        onShowToast(
          tab === 'login'
            ? `Connexion Firebase réussie. Ravi de vous revoir, ${fbUser.name} !`
            : `Compte Firebase créé avec succès. Bienvenue, ${fbUser.name} !`
        );
        onClose();
        return;
      }

      // 2. Server route fallback
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        tab === 'login'
          ? { email: email.trim(), password }
          : {
              email: email.trim(),
              password,
              name: name.trim(),
              role,
              country: country.trim() || DEFAULT_AFRICAN_COUNTRY,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Une erreur est survenue lors de l'authentification.");
        return;
      }

      onLoginSuccess(data.user, data.token);
      onShowToast(
        tab === 'login'
          ? `Ravi de vous revoir, ${data.user.name} !`
          : `Bienvenue sur tomorrow, ${data.user.name} ! Votre compte est sécurisé.`
      );
      onClose();
    } catch {
      setErrorMessage("Impossible de contacter le serveur d'authentification.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/55 dark:bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-7 shadow-2xl my-6">
        {/* Top Back & Close Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Retour</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xs">
            <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {tab === 'login' ? 'Connexion Sécurisée' : 'Créer un Compte'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="font-bold text-black dark:text-white lowercase">tomorrow</span> · Authentification chiffrée
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="mt-5 grid grid-cols-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage(null);
            }}
            className={`rounded-lg py-2 font-bold transition-all ${
              tab === 'login'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMessage(null);
            }}
            className={`rounded-lg py-2 font-bold transition-all ${
              tab === 'register'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            S'inscrire
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nom complet ou Pseudo *
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Amina Diallo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Adresse Email *
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="votre.email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Mot de passe *
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Minimum 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 py-2.5 pl-9 pr-10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Votre Profil
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white focus:outline-none font-medium"
                >
                  <option value="Développeur local">Développeur local</option>
                  <option value="Citoyen / Usager">Citoyen / Usager</option>
                  <option value="Entrepreneur / Porteur de projet">Porteur de projet</option>
                  <option value="Designer UI/UX">Designer UI/UX</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Pays *
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    aria-label="Sélectionner votre pays africain"
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 pl-8 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white focus:outline-none font-medium"
                  >
                    {AFRICAN_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-black dark:bg-white py-2.5 text-xs font-bold text-white dark:text-black shadow-xs hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            <span>
              {isLoading
                ? 'Authentification...'
                : tab === 'login'
                ? 'Accéder à mon espace'
                : 'Créer mon compte'}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Security badge note */}
        <div className="mt-5 border-t border-slate-100 dark:border-zinc-800 pt-4 flex flex-col items-center justify-center gap-1 text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-slate-400 dark:text-slate-500" />
            <span>Hachage cryptographique scrypt + sel aléatoire 128-bit</span>
          </div>
          {hasInstalledApp && (
            <span>
              App installée : configurez un code PIN dans votre profil pour verrouiller et déverrouiller rapidement.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
