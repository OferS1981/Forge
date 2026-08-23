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

export function ThemeToggle({ className }: { className?: string | undefined }): ReactNode {
  const [theme, set] = useTheme();
  return (
    <Segmented
      className={className}
      label="Theme"
      value={theme}
      onChange={(v) => {
        if (isTheme(v)) set(v);
      }}
      options={[
        { value: 'system', label: 'System' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ]}
    />
  );
}
