import type { ModelSpec } from '../../types';
import { rows } from '../shared';

export const genericResearch: ModelSpec = {
  id: 'generic-research',
  name: 'Any other research tool',
  version: 'category wildcard',
  category: 'research',
  wildcard: true,
  blurb:
    'A portable research brief with the question, the decision, the scope, the structure and the missing-evidence rule.',
  tags: ['Model-agnostic', 'Cited by default'],
  grammar: 'research',
  length: [0, 0],
  core: ['rQuestion', 'rScope', 'rFormat'],
  craft: ['rDecision', 'rGaps', 'rules'],
  tech: [],
  negative: { mode: 'prose', label: 'Out of scope', note: '' },
  best: 'Any research or search-grounded tool.',
  worst: 'Nothing tool-specific.',
  notes: [
    'A research prompt without a named decision produces a summary. With one, it produces an argument.',
  ],
  warnings: [
    'Always specify the date range. Every tool is weak on very recent events unless you pin it.',
  ],
  settings: () =>
    rows([
      ['Citations', 'require inline', ''],
      ['Date range', 'state explicitly', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://docs.perplexity.ai/',
      title: 'Perplexity API documentation',
      publisher: 'Perplexity',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
