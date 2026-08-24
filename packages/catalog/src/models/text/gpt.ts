import type { ModelSpec } from '../../types';
import { or, rows } from '../shared';

export const gpt: ModelSpec = {
  id: 'gpt',
  name: 'GPT',
  version: '5.6 Sol / Terra / Luna',
  maker: 'OpenAI',
  category: 'text',
  blurb:
    'Prune, do not stack. OpenAI measured a 10–15% score gain from simplifying system prompts while cutting tokens by 41–66%.',
  tags: [
    'Identity→Instructions→Examples→Context',
    'reasoning.effort',
    'verbosity',
    '1.05M context',
  ],
  grammar: 'llm',
  length: [0, 0],
  core: ['goal', 'context', 'format'],
  craft: ['role', 'length', 'rules', 'examples', 'avoid'],
  tech: ['effort'],
  negative: { mode: 'prose', label: 'Constraints', note: 'state each rule once' },
  best: 'Knowledge work with browsing, coding agents, cybersecurity, computer use, design judgment.',
  worst:
    'Bloated rule-wall prompts. Cheap ultra-long context: above 272k input tokens you pay a 2x surcharge.',
  notes: [
    'The documented section order is Identity, Instructions, Examples, Context. Put reused content first so it caches.',
    'State each instruction exactly once. Repetition measurably lowers scores.',
    'Reasoning models want goals, not steps. OpenAI frame it as briefing a senior co-worker rather than a junior one.',
  ],
  warnings: [
    'reasoning.context defaults to all_turns on 5.6, which silently re-renders prior reasoning and bills for it.',
    'Above 272k input tokens you pay 2x input and 1.5x output. The 1.05M window is not uniformly priced.',
    'When migrating, benchmark one effort level lower than your old baseline.',
  ],
  settings: (b) =>
    rows([
      ['model', 'gpt-5.6-sol', 'terra for everyday, luna for cheap repeatable work'],
      [
        'reasoning.effort',
        or(b.effort, 'Medium').toLowerCase(),
        'none, minimal, low, medium, high, xhigh, max',
      ],
      ['reasoning.mode', 'standard', 'pro for more model work at higher latency'],
      ['text.verbosity', b.length ? 'low' : 'medium', ''],
      ['reasoning.context', 'current_turn', 'Default all_turns is a hidden cost'],
      ['instructions', 'use the developer block', 'Outranks user messages'],
    ]),
  delimiters: 'markdown',
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://platform.openai.com/docs/guides/prompt-engineering',
      title: 'Prompt engineering',
      publisher: 'OpenAI',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
