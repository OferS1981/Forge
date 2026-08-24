import type { ModelSpec } from '../../types';
import { or, rows } from '../shared';

export const deepseek: ModelSpec = {
  id: 'deepseek',
  name: 'DeepSeek',
  version: 'V4 Pro / Flash',
  maker: 'DeepSeek',
  category: 'text',
  blurb:
    'An order of magnitude cheaper than peers, MIT-licensed weights, 384k output, and one of the last APIs that still supports prefilling.',
  tags: ['Open weights', '384k output', 'Prefill supported', 'Off-peak half price'],
  grammar: 'llm',
  length: [0, 0],
  core: ['goal', 'context', 'format'],
  craft: ['role', 'length', 'rules', 'examples', 'avoid'],
  tech: ['effort'],
  negative: { mode: 'prose', label: 'Constraints', note: '' },
  best: 'Cost per token, coding, very long outputs, self-hosting.',
  worst: 'Multimodal. Almost no official prompting guidance.',
  notes: [
    'Prefilling still works here and nowhere else at the frontier: hit the beta base URL and send the last message as an assistant turn with prefix true.',
  ],
  warnings: [
    "The vision variant's vision is incompatible with thinking mode. Pick one.",
    'Off-peak is half price at 01:00–04:00 and 06:00–10:00 UTC. Batch scheduling is a real 50% lever.',
  ],
  settings: (b) =>
    rows([
      ['model', 'deepseek-v4-pro', 'flash for volume'],
      ['thinking', 'enabled', 'On by default'],
      ['reasoning_effort', or(b.effort, 'High').toLowerCase(), ''],
      ['max_tokens', 'up to 384000', ''],
      ['Schedule', 'off-peak if batchable', 'Half price'],
    ]),
  delimiters: 'markdown',
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'speed-cost', weight: 3 },
    { tag: 'open-weights', weight: 3 },
  ],
  sources: [
    {
      url: 'https://api-docs.deepseek.com/',
      title: 'DeepSeek API documentation',
      publisher: 'DeepSeek',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
