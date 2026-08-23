import { has } from '../compose/text';
import { FIELDS } from '../fields';
import { modelById } from '../models/registry';
import type {
  Brief,
  FieldId,
  ForgeResult,
  Lost,
  Mode,
  Model,
  Recommendation,
  TranslateResult,
} from '../types';
import { forge } from './forge';

/**
 * Two kinds of recommendation, both from data. A better fit for what the brief now says, and the
 * model that usually comes next. Never more than one better-fit at a time.
 */
export function recommend(brief: Brief, current: Model): Recommendation[] {
  const out: Recommendation[] = [];
  const better = current.betterFor.find((r) => r.when(brief));
  if (better) out.push({ kind: 'better', model: modelById(better.model), why: better.why });
  for (const p of current.pairsWith)
    out.push({ kind: 'pairs', model: modelById(p.model), why: p.why });
  return out;
}

function usesField(m: Model, id: FieldId): boolean {
  return m.core.includes(id) || m.craft.includes(id) || m.tech.includes(id);
}

function reasonFor(to: Model, id: FieldId): string {
  return (
    to.name + (to.sub ? ' ' + to.sub : '') + ' has no ' + FIELDS[id].label.toLowerCase() + ' field.'
  );
}

/** Re-express one brief in another model's grammar, and say what could not carry over. */
export function translate(
  brief: Brief,
  from: Model,
  to: Model,
  mode: Mode = 'advanced',
): TranslateResult {
  const lost: Lost[] = [];
  for (const [key, value] of Object.entries(brief)) {
    const id = key as FieldId;
    if (!has(value)) continue;
    if (usesField(from, id) && !usesField(to, id))
      lost.push({ field: id, reason: reasonFor(to, id) });
  }
  const fromResult: ForgeResult = forge(brief, from, mode);
  const toResult: ForgeResult = forge(brief, to, mode);
  return { from: fromResult, to: toResult, brief, lost };
}
