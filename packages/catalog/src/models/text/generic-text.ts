import type { ModelSpec } from '../../types';
import { or, rows } from '../shared';

export const genericText: ModelSpec = {
  id: 'generic-text',
  name: 'Any other chat model',
  version: 'category wildcard',
  category: 'text',
  wildcard: true,
  blurb:
    'A model-agnostic prompt built on the techniques with the strongest documented evidence, and nothing that only works on one vendor.',
  tags: ['Model-agnostic', 'Evidence-led', 'Portable'],
  grammar: 'llm',
  length: [0, 0],
  core: ['goal', 'context', 'format'],
  craft: ['role', 'length', 'rules', 'examples', 'avoid'],
  tech: ['effort'],
  negative: { mode: 'prose', label: 'Constraints', note: '' },
  best: 'Any chat or reasoning model, including local ones.',
  worst: 'Nothing vendor-specific.',
  notes: [
    'Output format specification is the single strongest lever across every vendor guide. Forge always emits it.',
    'Delimiters separating instructions from data reduce misattribution and prompt-injection surface everywhere.',
  ],
  warnings: [
    "Chain-of-thought instructions are largely obsolete on 2026 frontier models. Use the model's own reasoning control instead.",
  ],
  settings: (b) =>
    rows([
      ['Reasoning', or(b.effort, 'Medium'), ''],
      ['Temperature', 'leave default', ''],
      ['System prompt', 'use it for role and rules', ''],
    ]),
  delimiters: 'markdown',
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',
      title: 'Prompt engineering overview',
      publisher: 'Anthropic',
    },
    {
      url: 'https://platform.openai.com/docs/guides/prompt-engineering',
      title: 'Prompt engineering',
      publisher: 'OpenAI',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
