import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 260);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Aller vers le haut"
      title="Aller vers le haut"
      className="fixed bottom-20 md:bottom-24 left-4 sm:left-6 z-40 inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-zinc-700 bg-black dark:bg-white px-3.5 py-2.5 text-xs font-bold text-white dark:text-black shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95"
    >
      <ArrowUp className="h-4 w-4" />
      <span className="hidden sm:inline">Haut de page</span>
    </button>
  );
};
