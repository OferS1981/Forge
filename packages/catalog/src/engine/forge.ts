import { COMPOSERS } from '../compose';
import { has, stripBanned } from '../compose/text';
import { FIELDS } from '../fields';
import type { AutoFilled, Brief, FieldId, ForgeResult, Mode, Model } from '../types';
import { score } from './score';
import { variations } from './variations';

/**
 * Simple mode fills the craft layer itself and reports every choice. Advanced mode leaves the
 * brief exactly as the user wrote it.
 */
/** The one field per category Forge never fills: the thing the prompt is about. */
const SEEDS = new Set<FieldId>([
  'subject',
  'script',
  'goal',
  'cTask',
  'aApp',
  'rQuestion',
  'sound',
  'mGenre',
]);

export function applyAutoFill(
  b: Brief,
  m: Model,
  mode: Mode,
): { brief: Brief; autoFilled: AutoFilled[] } {
  if (mode !== 'simple') return { brief: b, autoFilled: [] };
  const brief: Brief = { ...b };
  const autoFilled: AutoFilled[] = [];
  /*
   * Craft, the tech fields that carry an auto-fill of their own, and any core field that is not
   * the category's seed. The seed (the subject, the script, the task) is the one thing Forge
   * will never write for anyone; a core mood or sound-kind is still craft wearing a core badge,
   * and phase 13 let it fill like the rest.
   */
  for (const id of [...m.core.filter((f) => !SEEDS.has(f)), ...m.craft, ...m.tech]) {
    const field = FIELDS[id];
    if (!field.autoFill || has(brief[id])) continue;
    const picked = field.autoFill(brief, m);
    if (!picked) continue;
    Object.assign(brief, { [id]: picked.value });
    autoFilled.push({
      field: id,
      value: Array.isArray(picked.value) ? picked.value.join(', ') : picked.value,
      why: picked.why,
    });
  }
  return { brief, autoFilled };
}

/**
 * True when nothing has been filled in. Every workspace that works from a saved brief needs this,
 * and each writing its own version is how they drift apart.
 */
export function isBriefEmpty(brief: Brief): boolean {
  return Object.values(brief).every((v) => !has(v));
}

/** The fields a brief actually carries a value for. */
export function filledFields(brief: Brief): FieldId[] {
  return Object.entries(brief)
    .filter(([, v]) => has(v))
    .map(([k]) => k as FieldId);
}

const STRIPPED_WARNING =
  'These are SD1.5-era booru tags. On every 2026 model they consume tokens without steering, and on Midjourney they add style noise.';

/**
 * Fields whose text is someone's words to be performed, not a description to be tightened. A
 * script saying "what a beautiful morning" means those words; stripping them is not editing, it
 * is misquoting. Dead weight is removed from every descriptive field and never from these.
 */
const VERBATIM_FIELDS = new Set<FieldId>(['script', 'mLyrics']);

/** Strip the dead-weight vocabulary from every descriptive field, before any grammar sees it. */
function stripBrief(b: Brief): { brief: Brief; removed: string[] } {
  const out: Brief = {};
  const removed: string[] = [];
  for (const [key, value] of Object.entries(b) as [FieldId, string | string[]][]) {
    if (VERBATIM_FIELDS.has(key) || typeof value !== 'string') {
      out[key] = value as never;
      if (Array.isArray(value)) out[key] = value as never;
      continue;
    }
    const clean = stripBanned(value);
    out[key] = clean.text as never;
    for (const w of clean.removed) if (!removed.includes(w)) removed.push(w);
  }
  return { brief: out, removed };
}

/** The strike. Deterministic, no I/O, same input gives the same prompt every time. */
export function forge(brief: Brief, model: Model, mode: Mode = 'advanced'): ForgeResult {
  const { brief: filled, autoFilled } = applyAutoFill(brief, model, mode);
  const { brief: b, removed } = stripBrief(filled);
  const composer = COMPOSERS[model.grammar];
  const composed = composer(b, model);
  const clean = { text: composed.flat, removed };
  const warnings = [...model.warnings];
  if (clean.removed.length)
    warnings.unshift(
      'Removed from your text: ' + clean.removed.join(', ') + '. ' + STRIPPED_WARNING,
    );

  const negative =
    composed.negOverride ??
    (has(b.avoid) ? (Array.isArray(b.avoid) ? b.avoid.join(', ') : (b.avoid ?? '')) : '');

  const partial = { flat: clean.text, blocks: composed.blocks };
  const sc = score(b, model, partial);

  const result: ForgeResult = {
    blocks: composed.blocks,
    flat: clean.text,
    negative,
    settings: model.settings(b, mode).filter((r) => mode === 'advanced' || r.tier === 'simple'),
    notes: model.notes,
    warnings,
    variations: variations(model),
    stripped: clean.removed,
    autoFilled,
    score: sc.total,
    axes: sc.axes,
  };
  if (composed.mono) result.mono = true;
  return result;
}
