'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { Brief, FieldId, Mode, ModelId } from '@forge/catalog';

/**
 * Everything the app remembers between visits, in one place. It is a small typed wrapper over
 * localStorage: no state library, per section 3, and no analytics of any kind.
 *
 * Values are read through useSyncExternalStore rather than copied into state after mount. That
 * keeps the exported HTML and the first client paint in agreement, means two hooks reading the
 * same key never disagree, and works when there is no localStorage at all.
 */

const PREFIX = 'forge.';

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function announce(): void {
  for (const l of listeners) l();
}

/**
 * useSyncExternalStore compares snapshots by identity, so parsing on every read would loop for
 * anything that is not a primitive. The parsed value is cached against the raw string it came
 * from, which makes repeat reads stable and makes a real change a new object exactly once.
 */
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readRaw<T>(key: string, fallback: T, guard: (v: unknown) => v is T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PREFIX + key);
  } catch {
    // Storage denied. The default is a fine answer.
    return fallback;
  }
  const hit = cache.get(key);
  // raw is never undefined, so this narrows hit as well as comparing it.
  if (hit?.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (guard(parsed)) value = parsed;
    } catch {
      // Something else wrote nonsense into our key.
    }
  }
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Nothing to do. The choice still applies for this visit.
  }
  announce();
}

const isMode = (v: unknown): v is Mode => v === 'simple' || v === 'advanced';
const isString = (v: unknown): v is string => typeof v === 'string';
const isBriefMap = (v: unknown): v is Record<string, Brief> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function usePersisted<T>(
  key: string,
  fallback: T,
  guard: (v: unknown) => v is T,
): [T, (next: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readRaw(key, fallback, guard),
    () => fallback,
  );
  const set = useCallback(
    (next: T) => {
      write(key, next);
    },
    [key],
  );
  return [value, set];
}

export function useMode(): [Mode, (next: Mode) => void] {
  return usePersisted<Mode>('mode', 'simple', isMode);
}

export function useModelId(fallback: ModelId): [string, (next: string) => void] {
  return usePersisted<string>('model', fallback, isString);
}

const EMPTY_BRIEFS: Record<string, Brief> = {};
const EMPTY_BRIEF: Brief = {};

/** How many prompts have been forged. Section 8 offers Advanced mode after ten, never forces it. */
export function useForgeCount(): [number, () => void] {
  const [count, set] = usePersisted<number>('forged', 0, isCount);
  const bump = useCallback(() => {
    set(count + 1);
  }, [count, set]);
  return [count, bump];
}

/** One brief per model, so switching models and coming back does not lose the work. */
export function useBriefs(): {
  briefFor: (id: string) => Brief;
  setField: (id: string, field: FieldId, value: string | string[]) => void;
  setFields: (id: string, patch: Brief) => void;
  clear: (id: string) => void;
} {
  const [briefs, setBriefs] = usePersisted<Record<string, Brief>>(
    'briefs',
    EMPTY_BRIEFS,
    isBriefMap,
  );

  const briefFor = useCallback((id: string): Brief => briefs[id] ?? EMPTY_BRIEF, [briefs]);

  const setField = useCallback(
    (id: string, field: FieldId, value: string | string[]) => {
      const current = briefs[id] ?? EMPTY_BRIEF;
      setBriefs({ ...briefs, [id]: { ...current, [field]: value } });
    },
    [briefs, setBriefs],
  );

  /*
   * Several fields in one write. Calling setField in a loop would read the same stored map every
   * time and keep only the last field, so anything filling a brief at once has to come through
   * here: the walkthrough, and the try-it button on a lesson.
   */
  const setFields = useCallback(
    (id: string, patch: Brief) => {
      setBriefs({ ...briefs, [id]: { ...(briefs[id] ?? EMPTY_BRIEF), ...patch } });
    },
    [briefs, setBriefs],
  );

  const clear = useCallback(
    (id: string) => {
      setBriefs({ ...briefs, [id]: {} });
    },
    [briefs, setBriefs],
  );

  return { briefFor, setField, setFields, clear };
}

/**
 * Put a saved brief back where the Build workspace keeps it, and point Build at that model and
 * mode. Written through the same store the hooks read, so every open screen sees it at once.
 */
export function openInBuild(modelId: string, brief: Brief, mode: Mode): void {
  const briefs = readRaw<Record<string, Brief>>('briefs', EMPTY_BRIEFS, isBriefMap);
  write('briefs', { ...briefs, [modelId]: brief });
  write('model', modelId);
  write('mode', mode);
}

/**
 * Where the first run got to. Zero means it has not started, a number means that step is next, and
 * `done` means it was finished or left. Resumable, because a walkthrough that restarts every visit
 * is worse than none.
 */
export type WalkthroughState = { step: number } | 'done';

const isWalkthrough = (v: unknown): v is WalkthroughState =>
  v === 'done' ||
  (typeof v === 'object' && v !== null && typeof (v as { step?: unknown }).step === 'number');

export function useWalkthrough(): [WalkthroughState, (next: WalkthroughState) => void] {
  return usePersisted<WalkthroughState>('walkthrough', START, isWalkthrough);
}

const START: WalkthroughState = { step: 0 };

/** Whether the invitation to the Doctor has been dismissed. */
export function useInvite(): [boolean, (next: boolean) => void] {
  return usePersisted<boolean>('invite-dismissed', false, isBool);
}

const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
