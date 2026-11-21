import React, { useEffect } from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { PIN_LENGTH } from '../services/pinSecurityService';

interface PinKeypadProps {
  value: string;
  onChange: (nextValue: string) => void;
  length?: number;
  hasError?: boolean;
  disabled?: boolean;
  shakeKey?: number;
  enableKeyboard?: boolean;
}

const KEY_ROWS: (string | 'clear' | 'backspace')[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'backspace'],
];

export const PinKeypad: React.FC<PinKeypadProps> = ({
  value,
  onChange,
  length = PIN_LENGTH,
  hasError = false,
  disabled = false,
  shakeKey = 0,
  enableKeyboard = true,
}) => {
  const handleDigit = (digit: string) => {
    if (disabled) return;
    if (value.length >= length) return;
    onChange(`${value}${digit}`);
  };

  const handleBackspace = () => {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled || value.length === 0) return;
    onChange('');
  };

  useEffect(() => {
    if (!enableKeyboard || disabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        if (value.length < length) {
          onChange(`${value}${e.key}`);
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (value.length > 0) {
          onChange(value.slice(0, -1));
        }
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        if (value.length > 0) {
          onChange('');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enableKeyboard, disabled, value, length, onChange]);

  return (
    <div className="w-full max-w-[290px] mx-auto select-none">
      {/* 4-dot PIN Entry Indicator */}
      <div
        key={shakeKey}
        aria-label={`Code PIN : ${value.length} sur ${length} chiffres saisis`}
        className={`flex items-center justify-center gap-4 mb-6 ${
          hasError ? 'animate-pin-shake' : ''
        }`}
      >
        {Array.from({ length }).map((_, idx) => {
          const filled = idx < value.length;
          return (
            <span
              key={idx}
              className={`h-3.5 w-3.5 rounded-full border-2 transition-all duration-150 ${
                hasError
                  ? 'border-rose-500 bg-rose-500/20'
                  : filled
                  ? 'border-black dark:border-white bg-black dark:bg-white scale-110'
                  : 'border-slate-300 dark:border-zinc-700 bg-transparent'
              }`}
            />
          );
        })}
      </div>

      {/* Integrated Touch Numeric Keypad */}
      <div
        role="group"
        aria-label="Clavier numérique intégré pour code PIN"
        className="grid grid-cols-3 gap-2.5 sm:gap-3"
      >
        {KEY_ROWS.flat().map((item) => {
          if (item === 'clear') {
            return (
              <button
                key="clear"
                type="button"
                disabled={disabled || value.length === 0}
                onClick={handleClear}
                aria-label="Effacer le code saisi"
                className="min-h-[56px] sm:min-h-[60px] flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 disabled:opacity-40 transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-[10px] font-semibold mt-0.5">Effacer</span>
              </button>
            );
          }

          if (item === 'backspace') {
            return (
              <button
                key="backspace"
                type="button"
                disabled={disabled || value.length === 0}
                onClick={handleBackspace}
                aria-label="Supprimer le dernier chiffre"
                className="min-h-[56px] sm:min-h-[60px] flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 disabled:opacity-40 transition-all"
              >
                <Delete className="h-5 w-5" />
              </button>
            );
          }

          return (
            <button
              key={item}
              type="button"
              disabled={disabled || value.length >= length}
              onClick={() => handleDigit(item)}
              aria-label={`Chiffre ${item}`}
              className="min-h-[56px] sm:min-h-[60px] flex items-center justify-center rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xl font-bold tabular-nums text-slate-900 dark:text-white shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 active:scale-95 active:bg-slate-100 dark:active:bg-zinc-700 disabled:opacity-50 transition-all"
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
};
