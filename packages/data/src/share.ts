import type { Brief, Mode } from '@forge/catalog';

/**
 * A share link.
 *
 * Section 13 writes shares as a row and a path. A static export has no server to resolve an
 * arbitrary path, and a signed-out visitor has no row to make, so a share carries its brief in the
 * URL fragment instead. A fragment is never sent to a host, the link needs no database, and it
 * works for everyone, which is what "anonymous users get everything except cloud sync" requires.
 *
 * An account can additionally mint a short slug and share that instead, which is the `s=` form.
 *
 * What travels is the brief, never the rendered prompt, so the reader's copy is forged on their
 * machine against today's catalogue rather than being a copy of what the model wanted last year.
 */

export interface SharePayload {
  /** Bumped if the shape ever changes, so an old link can be read or refused honestly. */
  v: 1;
  title: string;
  modelId: string;
  brief: Brief;
  mode: Mode;
}

export type Shared = { kind: 'inline'; payload: SharePayload } | { kind: 'slug'; slug: string };

const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const SLUG_LENGTH = 22;

/** Matches the check constraint on `shares.slug`, so a rejected slug is rejected here first. */
export const SLUG_PATTERN = /^[a-z0-9]{22}$/;

/**
 * Twenty-two characters out of thirty-six is a hundred and thirteen bits. The modulo is very
 * slightly biased towards the first four letters, which costs a fraction of one bit and is not
 * worth a rejection loop at this size.
 */
export function mintSlug(random: (n: number) => Uint8Array): string {
  const bytes = random(SLUG_LENGTH);
  let out = '';
  for (let i = 0; i < SLUG_LENGTH; i++) {
    out += SLUG_ALPHABET.charAt((bytes[i] ?? 0) % SLUG_ALPHABET.length);
  }
  return out;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeShare(payload: SharePayload): string {
  return toBase64Url(JSON.stringify(payload));
}

function isBrief(value: unknown): value is Brief {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.values(value).every(
    (v) => typeof v === 'string' || (Array.isArray(v) && v.every((x) => typeof x === 'string')),
  );
}

function asPayload(value: unknown): SharePayload | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.v !== 1) return null;
  if (typeof v.title !== 'string' || typeof v.modelId !== 'string') return null;
  if (v.mode !== 'simple' && v.mode !== 'advanced' && v.mode !== 'pro') return null;
  if (!isBrief(v.brief)) return null;
  return { v: 1, title: v.title, modelId: v.modelId, brief: v.brief, mode: v.mode };
}

export function decodeShare(encoded: string): SharePayload | null {
  try {
    return asPayload(JSON.parse(fromBase64Url(encoded)));
  } catch {
    // Someone edited the link, or a mail client wrapped it. Not an error, just not a share.
    return null;
  }
}

/** What a `/p` page was opened with. Null when the fragment is missing or is not a share. */
export function readFragment(hash: string): Shared | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (raw.length === 0) return null;
  if (raw.startsWith('s=')) {
    const slug = raw.slice(2);
    return SLUG_PATTERN.test(slug) ? { kind: 'slug', slug } : null;
  }
  const payload = decodeShare(raw);
  return payload === null ? null : { kind: 'inline', payload };
}

export function shareUrl(origin: string, shared: Shared): string {
  const fragment = shared.kind === 'slug' ? `s=${shared.slug}` : encodeShare(shared.payload);
  return `${origin.replace(/\/$/, '')}/p#${fragment}`;
}
