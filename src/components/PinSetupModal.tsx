import React, { useEffect, useState } from 'react';
import { X, ArrowLeft, Lock, ShieldCheck, Trash2, CheckCircle2, Smartphone } from 'lucide-react';
import { PinKeypad } from './PinKeypad';
import {
  PIN_LENGTH,
  getUserPinSettings,
  saveUserPin,
  updateUserPinPreferences,
  removeUserPin,
} from '../services/pinSecurityService';

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  hasInstalledApp: boolean;
  onPinUpdated: () => void;
  onLockNow?: () => void;
  onShowToast: (msg: string) => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  hasInstalledApp,
  onPinUpdated,
  onLockNow,
  onShowToast,
}) => {
  const existingSettings = getUserPinSettings(userEmail);
  const [mode, setMode] = useState<'manage' | 'step1' | 'step2'>('step1');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [autoLockOnReturn, setAutoLockOnReturn] = useState(true);
  const [lockDelaySeconds, setLockDelaySeconds] = useState(15);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const current = getUserPinSettings(userEmail);
    if (current) {
      setMode('manage');
      setAutoLockOnReturn(current.autoLockOnReturn);
      setLockDelaySeconds(current.lockDelaySeconds);
    } else {
      setMode('step1');
      setAutoLockOnReturn(true);
      setLockDelaySeconds(15);
    }
    setFirstPin('');
    setConfirmPin('');
    setError(null);
  }, [isOpen, userEmail]);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'step1' && firstPin.length === PIN_LENGTH) {
      const t = setTimeout(() => {
        setError(null);
        setMode('step2');
      }, 120);
      return () => clearTimeout(t);
    }
  }, [isOpen, mode, firstPin]);

  useEffect(() => {
    if (!isOpen || mode !== 'step2' || confirmPin.length !== PIN_LENGTH || isSaving) return;

    let cancelled = false;
    setIsSaving(true);

    const finalize = async () => {
      if (confirmPin !== firstPin) {
        if (!cancelled) {
          setError('Les deux codes PIN ne correspondent pas. Réessayez.');
          setShakeKey((k) => k + 1);
          setConfirmPin('');
          setIsSaving(false);
        }
        return;
      }

      await saveUserPin(userEmail, confirmPin, {
        autoLockOnReturn,
        lockDelaySeconds,
      });

      if (!cancelled) {
        setIsSaving(false);
        onPinUpdated();
        onShowToast('Code PIN enregistré ! Vous pouvez verrouiller votre écran à tout moment.');
        setMode('manage');
        setFirstPin('');
        setConfirmPin('');
      }
    };

    finalize();
    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    mode,
    confirmPin,
    firstPin,
    userEmail,
    autoLockOnReturn,
    lockDelaySeconds,
    isSaving,
    onPinUpdated,
    onShowToast,
  ]);

  if (!isOpen) return null;

  const handleToggleAutoLock = (checked: boolean) => {
    setAutoLockOnReturn(checked);
    if (existingSettings) {
      updateUserPinPreferences(userEmail, { autoLockOnReturn: checked });
      onPinUpdated();
    }
  };

  const handleChangeDelay = (seconds: number) => {
    setLockDelaySeconds(seconds);
    if (existingSettings) {
      updateUserPinPreferences(userEmail, { lockDelaySeconds: seconds });
      onPinUpdated();
    }
  };

  const handleRemovePin = () => {
    removeUserPin(userEmail);
    onPinUpdated();
    onShowToast('Code PIN supprimé de cet appareil.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/55 dark:bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-7 shadow-2xl my-6">
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              if (mode === 'step2') {
                setMode('step1');
                setFirstPin('');
                setConfirmPin('');
                setError(null);
              } else if (mode === 'step1' && existingSettings) {
                setMode('manage');
                setFirstPin('');
                setError(null);
              } else {
                onClose();
              }
            }}
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

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-xs">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {mode === 'manage'
                ? 'Verrouillage par code PIN'
                : mode === 'step1'
                ? 'Définir votre code PIN'
                : 'Confirmer votre code PIN'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'manage'
                ? 'Verrouillez temporairement votre écran et reprenez vite.'
                : mode === 'step1'
                ? 'Saisissez 4 chiffres sur le clavier intégré.'
                : 'Saisissez une seconde fois les 4 mêmes chiffres.'}
            </p>
          </div>
        </div>

        {/* Installation context banner (subtle hairline container) */}
        <div className="mb-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 p-3 flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
          <Smartphone className="h-4 w-4 shrink-0 mt-0.5 text-black dark:text-white" />
          <span>
            {hasInstalledApp
              ? 'Application installée détectée : le déverrouillage rapide par code PIN est actif même si vous quittez temporairement.'
              : "Installez l'application tomorrow pour profiter du verrouillage automatique lorsque vous quittez et revenez peu après."}
          </span>
        </div>

        {mode === 'manage' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800 text-xs">
              <span className="inline-flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Code PIN à 4 chiffres activé</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setFirstPin('');
                  setConfirmPin('');
                  setError(null);
                  setMode('step1');
                }}
                className="font-bold text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white underline"
              >
                Modifier
              </button>
            </div>

            {/* Auto-lock Preferences */}
            <div className="space-y-3 py-1">
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Verrouillage automatique au retour
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Demander le code PIN si vous quittez l'application installée et revenez ensuite.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoLockOnReturn}
                  onChange={(e) => handleToggleAutoLock(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-black dark:accent-white"
                />
              </label>

              {autoLockOnReturn && (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Délai avant verrouillage
                  </span>
                  <select
                    value={lockDelaySeconds}
                    onChange={(e) => handleChangeDelay(Number(e.target.value))}
                    aria-label="Délai avant verrouillage automatique"
                    className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value={0}>Immédiat</option>
                    <option value={15}>15 secondes</option>
                    <option value={60}>1 minute</option>
                    <option value={300}>5 minutes</option>
                  </select>
                </div>
              )}
            </div>

            {/* Primary & Secondary Actions */}
            <div className="pt-3 space-y-2.5">
              {onLockNow && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLockNow();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-black dark:bg-white py-3 text-xs font-bold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                  <Lock className="h-4 w-4" />
                  <span>Verrouiller temporairement l'écran</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRemovePin}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Désactiver le code PIN</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <p className="text-center text-xs font-semibold text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}

            <PinKeypad
              value={mode === 'step1' ? firstPin : confirmPin}
              onChange={(next) => {
                setError(null);
                if (mode === 'step1') setFirstPin(next);
                else setConfirmPin(next);
              }}
              hasError={Boolean(error)}
              disabled={isSaving}
              shakeKey={shakeKey}
            />

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
              <ShieldCheck className="h-3 w-3" />
              <span>Code PIN chiffré localement (SHA-256) sur cet appareil</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
