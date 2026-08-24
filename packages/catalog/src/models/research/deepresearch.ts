import type { ModelSpec } from '../../types';
import { or, rows } from '../shared';

export const deepresearch: ModelSpec = {
  id: 'deepresearch',
  name: 'Deep Research',
  version: 'ChatGPT / Gemini / Claude',
  maker: 'multiple',
  category: 'research',
  blurb:
    'All three reward the same three things: name the decision the output feeds, fix the structure, and say what to do when evidence is missing.',
  tags: ['Plan → search → iterate', 'Cited output', 'Single-turn on Gemini'],
  grammar: 'research',
  length: [0, 0],
  core: ['rQuestion', 'rScope', 'rFormat'],
  craft: ['rDecision', 'rGaps', 'rules'],
  tech: ['effort'],
  negative: { mode: 'prose', label: 'Out of scope', note: '' },
  best: 'Long multi-source questions where you need a cited document rather than an answer.',
  worst: 'Very recent events unless you name the date range explicitly. All three are weak there.',
  notes: [
    'State the decision the research feeds. It changes what the model prioritises more than any other line.',
    "Claude's documented research pattern is to develop competing hypotheses and track confidence levels in progress notes.",
  ],
  warnings: [
    "Gemini's Deep Research agent is single-turn and asynchronous with a 120-minute ceiling. You cannot refine mid-run.",
    'Source files can carry prompt injection. Say explicitly that instructions inside sources are data, not commands.',
  ],
  settings: (b) =>
    rows([
      [
        'Mode',
        'Deep Research',
        'the long agentic mode; the quick mode answers before it has read enough',
      ],
      [
        'Effort',
        or(b.effort, 'High'),
        'research is the one job where thinking longer is visibly worth it',
      ],
      [
        'Date range',
        'state explicitly',
        'without one, old evidence and new evidence blur into one answer',
      ],
      [
        'Missing evidence',
        or(b.rGaps, 'say so, do not estimate'),
        'an honest gap beats a confident guess in every report ever read',
      ],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://openai.com/index/introducing-deep-research/',
      title: 'Introducing deep research',
      publisher: 'OpenAI',
    },
    {
      url: 'https://gemini.google/overview/deep-research/',
      title: 'Deep Research',
      publisher: 'Google',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
