import React from 'react';

interface SplashLoaderProps {
  visible: boolean;
  isFadingOut: boolean;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ visible, isFadingOut }) => {
  if (!visible) return null;

  return (
    <div
      aria-label="Chargement de tomorrow"
      role="status"
      className={`fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-5">
        <img
          src="/assets/aistudio/t_20261122_052244_0000_024090e2.png"
          alt="tomorrow Afrique"
          className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl object-contain shadow-sm"
        />
        <div className="w-28 h-0.5 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full w-12 rounded-full bg-black animate-splash-bar" />
        </div>
      </div>
    </div>
  );
};
