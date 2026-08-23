import type { ScoreLabel } from './types';

/**
 * The score scale. The labels are real colour temperatures a smith reads off steel.
 * The UI calls the number Score; the labels stay because they are useful and distinctive.
 */
export const SCORE_LABELS: readonly ScoreLabel[] = [
  { min: 0, name: 'Cold iron', meaning: 'nothing here is steering the model' },
  { min: 30, name: 'Black heat', meaning: 'workable, but most of the prompt is filler' },
  { min: 45, name: 'Dull cherry', meaning: 'the subject is clear, the craft is not' },
  { min: 60, name: 'Cherry red', meaning: 'solid. add the technical layer to lift it' },
  { min: 74, name: 'Orange heat', meaning: 'professional. specific enough to reproduce' },
  { min: 86, name: 'Yellow heat', meaning: 'tight. every clause is doing work' },
  { min: 94, name: 'Welding heat', meaning: "as far as this model's grammar goes" },
];

export function scoreLabel(score: number): ScoreLabel {
  let r = SCORE_LABELS[0] ?? { min: 0, name: 'Cold iron', meaning: '' };
  for (const h of SCORE_LABELS) {
    if (score >= h.min) r = h;
  }
  return r;
}
