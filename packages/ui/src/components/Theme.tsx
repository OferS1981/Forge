import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { Segmented } from './Segmented';

export type Theme = 'system' | 'light' | 'dark';

const KEY = 'forge.theme';

function isTheme(v: unknown): v is Theme {
  return v === 'system' || v === 'light' || v === 'dark';
}

export function readTheme(): Theme {
  try {
    const raw = localStorage.getItem(KEY);
    return isTheme(raw) ? raw : 'system';
  } catch {
    // Private mode, or storage denied. The system theme is a fine answer.
    return 'system';
  }
}

/**
 * System leaves the attribute off, so prefers-color-scheme decides.
 *
 * Every control transitions its background, which is right on hover and wrong here: without the
 * guard, changing theme animates every surface on the page from one palette to the other and the
 * whole thing smears for a tenth of a second. The attribute switches transitions off for one
 * frame, so the new palette simply appears.
 */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.setAttribute('data-theme-switching', '');
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.removeAttribute('data-theme-switching');
    });
  });
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/**
 * Read through useSyncExternalStore rather than copying the stored value into state on mount.
 * That keeps the first paint correct and makes this safe to render on a server, where there is no
 * localStorage and the answer is the system theme.
 */
export function useTheme(): [Theme, (next: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, readTheme, (): Theme => 'system');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const set = useCallback((next: Theme) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Nothing to do: the choice still applies for this visit.
    }
    applyTheme(next);
    for (const l of listeners) l();
  }, []);

  return [theme, set];
}

function osPrefersDark(): boolean {
  // jsdom has no matchMedia; a test environment counts as a light device.
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function subscribeOs(listener: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
    return () => undefined;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', listener);
  return () => {
    mq.removeEventListener('change', listener);
  };
}

/**
 * Two choices, not three. A visitor who has never chosen follows their device, and the toggle
 * simply shows which side of it they are on; the first click makes the choice explicit. "System"
 * as a visible third option read as a duplicate of whichever theme the device was in.
 */
export function ThemeToggle({ className }: { className?: string | undefined }): ReactNode {
  const [theme, set] = useTheme();
  const osDark = useSyncExternalStore(subscribeOs, osPrefersDark, () => false);
  const resolved = theme === 'system' ? (osDark ? 'dark' : 'light') : theme;
  return (
    <Segmented
      className={className}
      label="Theme"
      value={resolved}
      onChange={(v) => {
        if (v === 'light' || v === 'dark') set(v);
      }}
      options={[
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ]}
    />
  );
}
