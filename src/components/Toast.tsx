import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-20 md:bottom-24 right-4 sm:right-5 z-50 max-w-[90vw] sm:max-w-md flex items-center gap-3 rounded-2xl border border-slate-800 dark:border-zinc-700 bg-black dark:bg-zinc-900 px-4 py-3 text-xs text-white shadow-xl">
      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
      <span className="font-semibold">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1 text-slate-400 hover:text-white shrink-0"
        aria-label="Fermer la notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
