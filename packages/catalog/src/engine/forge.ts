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
export function applyAutoFill(
  b: Brief,
  m: Model,
  mode: Mode,
): { brief: Brief; autoFilled: AutoFilled[] } {
  if (mode !== 'simple') return { brief: b, autoFilled: [] };
  const brief: Brief = { ...b };
  const autoFilled: AutoFilled[] = [];
  for (const id of m.craft) {
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

/** The strike. Deterministic, no I/O, same input gives the same prompt every time. */
export function forge(brief: Brief, model: Model, mode: Mode = 'advanced'): ForgeResult {
  const { brief: b, autoFilled } = applyAutoFill(brief, model, mode);
  const composer = COMPOSERS[model.grammar];
  const composed = composer(b, model);
  const clean = stripBanned(composed.flat);
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
