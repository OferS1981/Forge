/**
 * The key.
 *
 * Section 12: stored in `localStorage` on their machine only, never sent to our server, never
 * logged, never placed in a URL. The first three are properties of where it is kept; the fourth is
 * a property of this package never seeing a URL at all. What is left is the one thing code here can
 * get wrong, which is keeping a copy of it somewhere it does not belong.
 */

export interface KeyStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export const KEY_NAME = 'forge.assistant-key';

/** Loose on purpose: refusing a key because it does not look like last year's is worse. */
export function looksLikeKey(value: string): boolean {
  return value.trim().length >= 20 && !/\s/.test(value.trim());
}

export function readKey(store: KeyStore): string | null {
  try {
    const raw = store.getItem(KEY_NAME);
    if (raw === null) return null;
    const trimmed = raw.trim();
    return trimmed.length === 0 ? null : trimmed;
  } catch {
    return null;
  }
}

export function writeKey(store: KeyStore, value: string): boolean {
  if (!looksLikeKey(value)) return false;
  try {
    store.setItem(KEY_NAME, value.trim());
    return true;
  } catch {
    return false;
  }
}

/** One click, and it is gone from this machine. */
export function forgetKey(store: KeyStore): void {
  try {
    store.removeItem(KEY_NAME);
  } catch {
    // Nothing kept it, so nothing to remove.
  }
}

/**
 * What a key may appear as anywhere it might be shown: the last four characters and nothing else.
 * Used by the panel so somebody can tell which key is stored without the whole thing being on a
 * screen that might be shared.
 */
export function maskKey(value: string): string {
  const tail = value.trim().slice(-4);
  return `the key ending ${tail}`;
}
