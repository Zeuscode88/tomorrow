import React, { useEffect, useState } from 'react';
import { Lock, LogOut, ShieldCheck } from 'lucide-react';
import { User } from '../types/auth';
import { PinKeypad } from './PinKeypad';
import { PIN_LENGTH, verifyUserPin } from '../services/pinSecurityService';

interface PinLockScreenProps {
  user: User;
  onUnlock: () => void;
  onFallbackToPassword: () => void;
}

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  user,
  onUnlock,
  onFallbackToPassword,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasErrorShake, setHasErrorShake] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          setAttempts(0);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH || isVerifying || cooldownRemaining > 0) return;

    let cancelled = false;
    setIsVerifying(true);

    const verify = async () => {
      const ok = await verifyUserPin(user.email, pin);
      if (cancelled) return;

      if (ok) {
        setError(null);
        setHasErrorShake(false);
        setTimeout(() => {
          if (!cancelled) onUnlock();
        }, 90);
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setHasErrorShake(true);
        setShakeKey((k) => k + 1);
        setPin('');
        if (nextAttempts >= MAX_ATTEMPTS) {
          setCooldownRemaining(COOLDOWN_SECONDS);
          setError(`Trop de tentatives. Réessayez dans ${COOLDOWN_SECONDS}s ou utilisez votre mot de passe.`);
        } else {
          setError(`Code PIN incorrect (${nextAttempts}/${MAX_ATTEMPTS})`);
        }
      }
      setIsVerifying(false);
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [pin, user.email, attempts, cooldownRemaining, isVerifying, onUnlock]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-lock-title"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/98 dark:bg-zinc-950/98 backdrop-blur-xl px-4 py-8 overflow-y-auto"
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Brand Wordmark */}
        <span
          data-no-translate="true"
          className="text-xl font-black tracking-tight text-black dark:text-white lowercase mb-6"
        >
          tomorrow
        </span>

        {/* User Identity */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xl font-black shadow-sm mb-3">
          {user.name.slice(0, 1).toUpperCase()}
        </div>

        <h1
          id="pin-lock-title"
          className="text-lg font-black tracking-tight text-slate-900 dark:text-white"
        >
          {user.name}
        </h1>

        <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate max-w-[200px]">{user.email}</span>
          {user.country && (
            <>
              <span aria-hidden="true">·</span>
              <span>{user.country}</span>
            </>
          )}
        </div>

        <div className="mt-5 mb-5 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Lock className="h-3.5 w-3.5 text-black dark:text-white shrink-0" />
          <span>Écran verrouillé temporairement · Entrez votre code PIN</span>
        </div>

        {/* Feedback / Error / Cooldown */}
        <div className="min-h-[24px] mb-3 flex items-center justify-center">
          {cooldownRemaining > 0 ? (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
              Patientez {cooldownRemaining}s avant de réessayer
            </p>
          ) : error ? (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Utilisez les touches ci-dessous ou votre clavier
            </p>
          )}
        </div>

        {/* Integrated Keypad */}
        <PinKeypad
          value={pin}
          onChange={(next) => {
            if (hasErrorShake) setHasErrorShake(false);
            if (error && cooldownRemaining === 0) setError(null);
            setPin(next);
          }}
          hasError={hasErrorShake}
          disabled={isVerifying || cooldownRemaining > 0}
          shakeKey={shakeKey}
        />

        {/* Recovery Action */}
        <div className="mt-7 pt-5 border-t border-slate-200/80 dark:border-zinc-800 w-full flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={onFallbackToPassword}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Utiliser mon mot de passe ou changer de compte</span>
          </button>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="h-3 w-3" />
            <span>Session protégée localement par code PIN chiffré</span>
          </div>
        </div>
      </div>
    </div>
  );
};
