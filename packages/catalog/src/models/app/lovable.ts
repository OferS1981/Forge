import type { ModelSpec } from '../../types';
import { rows } from '../shared';

export const lovable: ModelSpec = {
  id: 'lovable',
  name: 'Lovable',
  version: 'current',
  maker: 'Lovable',
  category: 'app',
  blurb:
    'Their own words: the most common mistake is not a bad prompt, it is prompting too early. Plan, then build one slice at a time.',
  tags: ['Plan mode', 'One slice at a time', 'Say what to leave alone', 'Visual Edits'],
  grammar: 'app',
  length: [0, 0],
  core: ['aApp', 'aScreens', 'aData'],
  craft: ['aStyle', 'cScope', 'rules'],
  tech: [],
  negative: {
    mode: 'field',
    label: 'Leave alone',
    note: 'the single highest-value instruction in this tool',
  },
  best: 'Full-stack apps built incrementally with a clear plan.',
  worst: 'Whole-app-in-one-prompt. It will refactor working code you did not mention.',
  notes: [
    'Three modes: Plan for concepts, Agent for development, Visual Edits for cosmetic refinement.',
    'Visual Edits is cheaper than re-prompting for anything cosmetic.',
  ],
  warnings: [
    'Always include the leave-alone clause. Omit it and it will rewrite parts that already worked.',
  ],
  settings: () =>
    rows([
      ['Mode', 'Plan first, then Agent', ''],
      ['Scope', 'one screen per prompt', ''],
      ['Cosmetics', 'Visual Edits, not re-prompting', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://docs.lovable.dev/tips-tricks/prompting-one',
      title: 'Prompting',
      publisher: 'Lovable',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
