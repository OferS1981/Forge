import type { ModelSpec } from '../../types';
import { rows } from '../shared';

export const notebooklm: ModelSpec = {
  id: 'notebooklm',
  name: 'NotebookLM',
  version: 'Gemini Notebook',
  maker: 'Google',
  category: 'research',
  blurb:
    'Source-grounded by construction. It will refuse to go beyond your sources, and that is the feature.',
  tags: ['Source-grounded', '50–600 sources', 'Query caps, not token caps'],
  grammar: 'research',
  length: [0, 0],
  core: ['rQuestion', 'rScope', 'rFormat'],
  craft: ['rDecision', 'rGaps', 'rules'],
  tech: [],
  negative: { mode: 'prose', label: 'Out of scope', note: '' },
  best: 'Synthesising a fixed corpus you control, with citations back to your own documents.',
  worst: 'Anything needing the open web. It will hedge rather than reach outside your sources.',
  notes: [
    'Ask it to quote the passage it is relying on before it answers. That converts a summary into something checkable.',
  ],
  warnings: ['The real ceiling is chat queries per day, not tokens. Plan long sessions around it.'],
  settings: () =>
    rows([
      [
        'Sources',
        'upload before asking',
        'it only knows what you gave it, which is the whole point of it',
      ],
      [
        'Grounding',
        'cite the source line',
        'a quote you can click beats a summary you have to trust',
      ],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    { url: 'https://support.google.com/notebooklm', title: 'NotebookLM help', publisher: 'Google' },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
