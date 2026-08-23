import type { Model } from '../../types';
import { THINKING_LEVEL, or, rows } from '../shared';

export const gemini: Model = {
  id: 'gemini',
  name: 'Gemini',
  version: '3.7 Flash / 3.1 Pro',
  maker: 'Google',
  category: 'text',
  blurb:
    "Direct and terse by default. Google's own advice is to stop tuning sampling parameters and to be concise.",
  tags: ['Concise instructions', 'thinking_level', 'One delimiter system', 'Context first'],
  grammar: 'llm',
  length: [0, 0],
  core: ['goal', 'context', 'format'],
  craft: ['role', 'length', 'rules', 'examples', 'avoid'],
  tech: ['effort'],
  negative: { mode: 'prose', label: 'Constraints', note: 'positive framing' },
  best: 'Price and performance on coding and agents, document comprehension, enterprise automation, huge multimodal context.',
  worst: 'No stable Pro-class GA offering. Terse and unconversational unless you ask otherwise.',
  notes: [
    'Pick one delimiter system, XML tags or markdown headings, and stay on it. Mixing them costs quality.',
    'Large data blocks at the top, the specific ask at the very end.',
    'Default output is terse. If you want it conversational or detailed you must say so explicitly.',
  ],
  warnings: [
    'Do not set temperature, top_p or top_k. Google strongly recommend the defaults, and low temperature specifically causes looping.',
    'Thought signatures must round-trip across calls or multi-turn reasoning continuity breaks.',
    'For grounded work, add: rely only on facts directly mentioned in the provided context.',
  ],
  settings: (b) =>
    rows([
      ['model', 'gemini-3.7-flash', '3.1 Pro (preview) for the Pro tier'],
      [
        'thinking_level',
        THINKING_LEVEL[or(b.effort, 'Medium')] ?? 'medium',
        'minimal, low, medium, high',
      ],
      ['temperature', 'do not set', 'Google advise against changing it'],
      ['system_instruction', 'state the year and cutoff', ''],
      ['media_resolution', 'medium', 'low, medium, high, ultra_high'],
    ]),
  delimiters: 'markdown',
  pairsWith: [],
  betterFor: [],
  strengthTags: [{ tag: 'speed-cost', weight: 2 }],
  sources: [
    {
      url: 'https://ai.google.dev/gemini-api/docs/prompting-strategies',
      title: 'Prompt design strategies',
      publisher: 'Google',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
