import { has } from '../compose/text';
import type { Brief, Option, SettingRow, TermId } from '../types';

export { has };

/** Core and craft lists shared by a category. */
export const IMG_CORE = ['subject', 'setting', 'medium', 'purpose'] as const;

/** Turn a list of values into typed options, all simple tier, pointing at one glossary term. */
export function opts(values: readonly string[], term: TermId): Option[] {
  return values.map((value) => ({ value, label: value, term, tier: 'simple' }));
}

/**
 * The prototype's `value || fallback`: an empty string counts as unset, exactly as it did there.
 * Written as a function so the intent is explicit rather than a lint exception.
 */
export function or(value: string | undefined, fallback: string): string {
  return value !== undefined && value.trim().length > 0 ? value : fallback;
}

/** Glossary id for a settings row, derived from the real parameter name. */
export function settingTerm(name: string): TermId {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `setting.${slug}`;
}

/**
 * Build settings rows from the prototype's [name, value, why] tuples. The first three rows are the
 * ones Simple mode shows; the rest are advanced.
 */
export function rows(list: readonly (readonly [string, string, string])[]): SettingRow[] {
  return list.map(([name, value, why], i) => ({
    name,
    value,
    why,
    term: settingTerm(name),
    tier: i < 3 ? 'simple' : 'advanced',
  }));
}

/** Gemini maps the brief's reasoning depth onto its own thinking_level enum. */
export const THINKING_LEVEL: Record<string, string> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Max: 'high',
};

const VERTICAL = /vertical|9:16|tiktok|reel|short/i;

/** The brief is heading for a vertical format. */
export function wantsVertical(b: Brief): boolean {
  return (
    (b.aspect?.includes('9:16') ?? false) || (b.purpose !== undefined && VERTICAL.test(b.purpose))
  );
}
