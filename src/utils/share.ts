import { AppIdea } from '../types/app';

export async function shareAppIdea(
  app: AppIdea,
  onNotify?: (message: string) => void
): Promise<void> {
  const origin = window.location.origin || '';
  const pathname = window.location.pathname || '';
  const url = `${origin}${pathname}?app=${encodeURIComponent(app.id)}`;

  const shareData = {
    title: `${app.title} - tomorrow`,
    text: `${app.title} (${app.country}) : ${app.tagline}. Découvrez cette application qui devrait exister sur tomorrow !`,
    url,
  };

  // 1. Try Web Share API (mobile & supported desktop browsers)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(shareData);
      onNotify?.(`"${app.title}" partagé avec succès !`);
      return;
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        // User closed the share sheet, do not fallback
        return;
      }
    }
  }

  // 2. Fallback to Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      onNotify?.(`Lien unique copié : ${app.title}`);
      return;
    } catch {
      // ignore
    }
  }

  // 3. Fallback prompt
  try {
    window.prompt('Copiez ce lien unique vers l\'application :', url);
  } catch {
    onNotify?.('Partage non disponible sur ce navigateur.');
  }
}
