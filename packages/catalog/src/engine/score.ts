import { has, stripBanned, wordCount } from '../compose/text';
import type { Axes, AxisId, Brief, ForgeResult, Model, Score } from '../types';

export interface Axis {
  id: AxisId;
  name: string;
  weight: number;
}

/** How much of the prompt is actually steering the model. Weights ported verbatim. */
export const AXES: readonly Axis[] = [
  { id: 'specificity', name: 'Specificity', weight: 18 },
  { id: 'technical', name: 'Craft layer', weight: 18 },
  { id: 'structure', name: 'Structure', weight: 14 },
  { id: 'constraints', name: 'Constraints', weight: 12 },
  { id: 'format', name: 'Output shape', weight: 12 },
  { id: 'context', name: 'Context', weight: 10 },
  { id: 'modelfit', name: 'Model fit', weight: 10 },
  { id: 'noise', name: 'Signal purity', weight: 6 },
];

export function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function weigh(axes: Axes): number {
  let total = 0;
  for (const a of AXES) total += (axes[a.id] || 0) * a.weight * 0.01;
  return Math.round(clamp(total));
}

export function score(b: Brief, m: Model, res: Pick<ForgeResult, 'flat' | 'blocks'>): Score {
  const words = wordCount(res.flat);
  const entries = Object.entries(b) as [keyof Brief, Brief[keyof Brief]][];
  const filled = entries.filter(([k, v]) => has(v) && k !== 'aspect' && k !== 'duration').length;

  const hasSeed =
    has(b.subject) ||
    has(b.goal) ||
    has(b.cTask) ||
    has(b.aApp) ||
    has(b.rQuestion) ||
    has(b.script) ||
    has(b.sound) ||
    has(b.mGenre);

  const craft = m.craft.filter((f) => has(b[f])).length;
  const bannedWords = stripBanned(
    Object.values(b)
      .flat()
      .filter((v): v is string => typeof v === 'string')
      .join(' '),
  ).removed.length;

  const axes: Axes = {
    specificity: clamp(
      (hasSeed ? 55 : 0) +
        Math.min(45, words * (m.category === 'image' || m.category === 'video' ? 0.55 : 0.28)),
    ),
    technical: clamp((craft / Math.max(1, m.craft.length)) * 100),
    structure: clamp(res.blocks.length * 15),
    constraints: clamp(
      has(b.avoid) || has(b.cScope) || has(b.mExclude) || has(b.rules) || has(b.rGaps) ? 85 : 20,
    ),
    format: clamp(
      has(b.format) ||
        has(b.rFormat) ||
        has(b.aspect) ||
        has(b.duration) ||
        has(b.sfxLen) ||
        m.category === 'image'
        ? 80
        : 35,
    ),
    context: clamp(
      has(b.purpose) ||
        has(b.context) ||
        has(b.cStack) ||
        has(b.rDecision) ||
        has(b.setting) ||
        has(b.useCase)
        ? 85
        : 30,
    ),
    modelfit: clamp(50 + Math.min(50, craft * 12)),
    noise: clamp(100 - bannedWords * 25),
  };

  return { axes, total: weigh(axes), filled };
}
