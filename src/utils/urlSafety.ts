/**
 * Validates that a URL uses http: or https: and does not contain dangerous schemes.
 */
export function isSafeHttpUrl(rawUrl?: string | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function sanitizeExternalUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  if (!isSafeHttpUrl(withProto)) return null;
  return withProto;
}

export function isSafeImageSrc(src?: string | null): boolean {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (trimmed.startsWith('data:image/png;base64,') || trimmed.startsWith('data:image/jpeg;base64,') || trimmed.startsWith('data:image/webp;base64,')) {
    return trimmed.length <= 450_000;
  }
  return isSafeHttpUrl(trimmed);
}

/**
 * Compresses an uploaded screenshot file client-side to keep Firestore/JSON payloads lightweight.
 */
export function compressImageFile(file: File, maxWidth = 960, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Format image non supporté.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image invalide.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Contexte graphique indisponible.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
