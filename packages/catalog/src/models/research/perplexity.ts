import type { ModelSpec } from '../../types';
import { rows } from '../shared';

export const perplexity: ModelSpec = {
  id: 'perplexity',
  name: 'Perplexity',
  version: 'Sonar / Agent API',
  maker: 'Perplexity',
  category: 'research',
  blurb:
    'Search-grounded by construction, with a context-size dial that is a real cost and quality lever.',
  tags: ['Grounded', 'search_context_size', 'Per-tool pricing', 'Sonar sunsets Sept 2026'],
  grammar: 'research',
  length: [0, 0],
  core: ['rQuestion', 'rScope', 'rFormat'],
  craft: ['rDecision', 'rGaps', 'rules'],
  tech: [],
  negative: { mode: 'prose', label: 'Out of scope', note: '' },
  best: 'Current questions where citations matter and you want the answer, not a list of links.',
  worst:
    'Deep Research cost is four-dimensional. Model the budget, do not estimate it from token price.',
  notes: [
    'search_context_size is a genuine quality dial, not just a cost setting. Raise it for questions with a wide evidence base.',
  ],
  warnings: [
    'Sonar Chat Completions is now the Agent API and Sonar is only supported until 27 September 2026.',
  ],
  settings: () =>
    rows([
      ['Model', 'Sonar Pro', 'Sonar Deep Research for exhaustive reports'],
      ['search_context_size', 'high', ''],
      ['Date range', 'state it in the prompt', ''],
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
