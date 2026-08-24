'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * The local profile: a few facts about you that prompts can use, kept in this browser and
 * nowhere else. Nothing here is uploaded, nothing is required, and the facts reach a prompt
 * only when the person turns the switch on and can see exactly where they landed. Deleting the
 * fields deletes the data; there is no copy anywhere to chase.
 */

export interface Profile {
  name: string;
  /** A birthday, if you want age-appropriate tone; free text, never validated, never required. */
  birthday: string;
  /** What you make or do, in a sentence. */
  work: string;
  /** The words your brand or voice should carry. */
  voice: string;
}

const KEY = 'forge.profile';
const EMPTY: Profile = { name: '', birthday: '', work: '', voice: '' };

let cached: Profile = EMPTY;
let cachedRaw: string | null = null;
const listeners = new Set<() => void>();

function read(): Profile {
  if (typeof window === 'undefined') return EMPTY;
  const raw = localStorage.getItem(KEY);
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  if (raw === null) {
    cached = EMPTY;
    return cached;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      const p = parsed as Record<string, unknown>;
      cached = {
        name: typeof p.name === 'string' ? p.name : '',
        birthday: typeof p.birthday === 'string' ? p.birthday : '',
        work: typeof p.work === 'string' ? p.work : '',
        voice: typeof p.voice === 'string' ? p.voice : '',
      };
    } else cached = EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useProfile(): [Profile, (next: Profile) => void] {
  const profile = useSyncExternalStore(subscribe, read, () => EMPTY);
  const set = useCallback((next: Profile) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage full or blocked: the form still works for this page view.
    }
    cachedRaw = null;
    for (const l of listeners) l();
  }, []);
  return [profile, set];
}

export function hasProfile(p: Profile): boolean {
  return [p.name, p.birthday, p.work, p.voice].some((v) => v.trim() !== '');
}

/** The one line a prompt carries when the switch is on. Only filled fields appear. */
export function profileClause(p: Profile): string {
  const parts: string[] = [];
  if (p.name.trim() !== '') parts.push(`I am ${p.name.trim()}`);
  if (p.birthday.trim() !== '') parts.push(`born ${p.birthday.trim()}`);
  if (p.work.trim() !== '') parts.push(p.work.trim());
  if (p.voice.trim() !== '') parts.push(`my voice: ${p.voice.trim()}`);
  return parts.length === 0 ? '' : `About me: ${parts.join('. ')}.`;
}

/** The downloadable user.md, so the same facts can travel to any other tool. */
export function profileMarkdown(p: Profile): string {
  const lines = ['# user.md', '', 'Facts about me, for tools that write on my behalf.', ''];
  if (p.name.trim() !== '') lines.push(`- **Name**: ${p.name.trim()}`);
  if (p.birthday.trim() !== '') lines.push(`- **Birthday**: ${p.birthday.trim()}`);
  if (p.work.trim() !== '') lines.push(`- **What I do**: ${p.work.trim()}`);
  if (p.voice.trim() !== '') lines.push(`- **Voice**: ${p.voice.trim()}`);
  return lines.join('\n') + '\n';
}
