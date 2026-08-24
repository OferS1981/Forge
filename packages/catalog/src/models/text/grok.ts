import type { ModelSpec } from '../../types';
import { or, rows } from '../shared';

export const grok: ModelSpec = {
  id: 'grok',
  name: 'Grok',
  version: '4.6',
  maker: 'xAI',
  category: 'text',
  blurb:
    'Cheap frontier-adjacent tool calling with a 500k window, and a cache key you must remember to set.',
  tags: ['500k context', 'reasoning_effort', 'Context compaction', 'Feb 2026 cutoff'],
  grammar: 'llm',
  length: [0, 0],
  core: ['goal', 'context', 'format'],
  craft: ['role', 'length', 'rules', 'examples', 'avoid'],
  tech: ['effort'],
  negative: { mode: 'prose', label: 'Constraints', note: '' },
  best: 'Agentic tool calling, cheap coding, low hallucination on its own positioning.',
  worst: 'Smaller context than peers. xAI publish almost no prompting guidance.',
  notes: [
    'Above 200k prompt tokens the price doubles. Keep prompts under that line where you can.',
  ],
  warnings: [
    'Set prompt_cache_key on the Responses API. Without it your requests land on cache-cold servers and you pay full input price.',
    'The knowledge cutoff is February 2026, so enable server-side search for anything current.',
  ],
  settings: (b) =>
    rows([
      ['model', 'grok-4-6', ''],
      ['reasoning_effort', or(b.effort, 'High').toLowerCase(), 'low, medium, high, xhigh'],
      ['prompt_cache_key', 'set it', 'Otherwise you pay full input price'],
      ['service_tier', 'priority for agents', ''],
      ['Context compaction', 'on for long tool loops', ''],
    ]),
  delimiters: 'markdown',
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [{ url: 'https://docs.x.ai/docs', title: 'xAI documentation', publisher: 'xAI' }],
  verifiedOn: '2026-08-23',
  unverified: true,
};
