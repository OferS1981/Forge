import type { BriefValue } from '../types';
import { BANNED } from '../vocab';

/** String helpers ported line for line from the prototype. The exact behaviour is load-bearing. */

type Loose = BriefValue | null | undefined;

export function has(v: Loose): boolean {
  return v !== undefined && v !== null && String(v).trim().length > 0;
}

export function arr(v: Loose): string[] {
  if (Array.isArray(v)) return v.filter(has);
  return has(v) ? [String(v)] : [];
}

export function join(a: Loose, s?: string): string {
  return arr(a).join(s ?? ', ');
}

export function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function stripDot(s: Loose): string {
  return String(s ?? '')
    .trim()
    .replace(/[.\s]+$/, '');
}

export function artic(w: string): string {
  return /^(a|e|i|o|u|8|11|18)/i.test(w.trim()) ? 'an' : 'a';
}

export function sentences(a: readonly string[]): string {
  return arr([...a])
    .map((x) => cap(x.trim()))
    .join('. ');
}

const DET =
  /^(a|an|the|this|that|these|those|his|her|their|its|my|our|your|one|two|three|some|several)\b/i;

/** Lower-case a leading word unless it looks like a proper noun or "I". */
export function lc(input: Loose): string {
  const s = String(input ?? '');
  if (/^(I|AI|A\.I)\b/.test(s)) return s;
  const looksProper = /^[A-Z][a-z]+ [A-Z]/.test(s);
  return DET.test(s) || (/^[A-Z][a-z]/.test(s) && !looksProper)
    ? s.charAt(0).toLowerCase() + s.slice(1)
    : s;
}

/** Drop "a photo of", "a cool picture of" and friends from the front of a subject. */
export function deMeta(s: Loose): string {
  return String(s ?? '')
    .replace(
      /^\s*(a|an|the)?\s*(cool|nice|good|great|amazing|awesome|beautiful|epic)?\s*(picture|photo|photograph|image|shot|render|drawing|painting|illustration)\s+of\s+/i,
      '',
    )
    .trim();
}

export function escapeRegExp(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export interface Stripped {
  text: string;
  removed: string[];
}

/** Remove the dead-weight vocabulary and report what went. */
export function stripBanned(t: string | null | undefined): Stripped {
  if (!t) return { text: t ?? '', removed: [] };
  let out = t;
  const removed: string[] = [];
  for (const w of BANNED) {
    const re = new RegExp('(^|[,;.\\s])' + escapeRegExp(w) + '(?=$|[,;.\\s])', 'gi');
    if (re.test(out)) {
      removed.push(w);
      out = out.replace(re, '$1');
    }
  }
  out = out
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s*,\s*/, '')
    .replace(/,\s*$/, '')
    .trim();
  return { text: out, removed: [...new Set(removed)] };
}

export function first(v: Loose): string {
  return arr(v)[0] ?? '';
}

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}
