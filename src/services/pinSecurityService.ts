export const PIN_LENGTH = 4;

export interface PinSettings {
  hash: string;
  autoLockOnReturn: boolean;
  lockDelaySeconds: number;
  updatedAt: string;
}

export interface ScreenLockState {
  locked: boolean;
  email: string;
  lockedAt: number;
}

const PIN_STORAGE_PREFIX = 'tomorrow_pin_cfg_v1_';
const SCREEN_LOCK_KEY = 'tomorrow_screen_locked_v1';
const LAST_BG_AT_KEY = 'tomorrow_last_bg_at_v1';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getPinStorageKey(email: string): string {
  return `${PIN_STORAGE_PREFIX}${normalizeEmail(email)}`;
}

function fallbackHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `fb:${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

export async function hashPin(pin: string, email: string): Promise<string> {
  const salted = `tomorrow-pin-v1:${normalizeEmail(email)}:${pin}`;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
      const encoded = new TextEncoder().encode(salted);
      const digest = await crypto.subtle.digest('SHA-256', encoded);
      const bytes = Array.from(new Uint8Array(digest));
      return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback below if Web Crypto is unavailable
  }
  return fallbackHash(salted);
}

export function getUserPinSettings(email?: string | null): PinSettings | null {
  if (!email) return null;
  try {
    const raw = localStorage.getItem(getPinStorageKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PinSettings;
    if (!parsed || typeof parsed.hash !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasUserPin(email?: string | null): boolean {
  return Boolean(getUserPinSettings(email));
}

export async function saveUserPin(
  email: string,
  pin: string,
  options?: { autoLockOnReturn?: boolean; lockDelaySeconds?: number }
): Promise<PinSettings> {
  const hash = await hashPin(pin, email);
  const existing = getUserPinSettings(email);
  const settings: PinSettings = {
    hash,
    autoLockOnReturn: options?.autoLockOnReturn ?? existing?.autoLockOnReturn ?? true,
    lockDelaySeconds: options?.lockDelaySeconds ?? existing?.lockDelaySeconds ?? 15,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(getPinStorageKey(email), JSON.stringify(settings));
  } catch {}
  return settings;
}

export function updateUserPinPreferences(
  email: string,
  patch: Partial<Pick<PinSettings, 'autoLockOnReturn' | 'lockDelaySeconds'>>
): PinSettings | null {
  const current = getUserPinSettings(email);
  if (!current) return null;
  const updated: PinSettings = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(getPinStorageKey(email), JSON.stringify(updated));
  } catch {}
  return updated;
}

export async function verifyUserPin(email: string, pin: string): Promise<boolean> {
  const settings = getUserPinSettings(email);
  if (!settings) return false;
  const candidateHash = await hashPin(pin, email);
  return candidateHash === settings.hash;
}

export function removeUserPin(email: string): void {
  try {
    localStorage.removeItem(getPinStorageKey(email));
    const lock = getScreenLockState();
    if (lock && normalizeEmail(lock.email) === normalizeEmail(email)) {
      setScreenLockState(null);
    }
  } catch {}
}

export function getScreenLockState(): ScreenLockState | null {
  try {
    const raw = localStorage.getItem(SCREEN_LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScreenLockState;
    if (!parsed || !parsed.locked || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setScreenLockState(state: ScreenLockState | null): void {
  try {
    if (!state || !state.locked) {
      localStorage.removeItem(SCREEN_LOCK_KEY);
    } else {
      localStorage.setItem(SCREEN_LOCK_KEY, JSON.stringify(state));
    }
  } catch {}
}

export function getLastBackgroundTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(LAST_BG_AT_KEY);
    if (!raw) return null;
    const val = Number(raw);
    return Number.isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

export function setLastBackgroundTimestamp(ts: number | null): void {
  try {
    if (ts === null) {
      localStorage.removeItem(LAST_BG_AT_KEY);
    } else {
      localStorage.setItem(LAST_BG_AT_KEY, String(ts));
    }
  } catch {}
}
