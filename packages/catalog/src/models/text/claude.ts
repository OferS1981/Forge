import type { Model } from '../../types';
import { or, rows } from '../shared';

export const claude: Model = {
  id: 'claude',
  name: 'Claude',
  version: 'Opus 5 / Sonnet 5',
  maker: 'Anthropic',
  category: 'text',
  blurb:
    'Wants XML tags, examples, and long material at the top with the question at the end. Anthropic measure up to 30% quality gain from that last one alone.',
  tags: ['XML tags', '3–5 examples', 'Long data first', '1M context'],
  grammar: 'llm',
  length: [0, 0],
  core: ['goal', 'context', 'format'],
  craft: ['role', 'length', 'rules', 'examples', 'avoid'],
  tech: ['effort'],
  negative: {
    mode: 'prose',
    label: 'Constraints',
    note: 'Anthropic explicitly recommend positive framing over negative',
  },
  best: 'Agentic coding, long-horizon autonomy, multi-file refactors, code review precision, 1M-context consistency, documents and decks.',
  worst:
    'Brevity by default: it is verbose unless told otherwise. Sampling parameters are blocked on the 5-series.',
  notes: [
    'XML tags are the documented structure: <instructions>, <context>, <document>, <example>. Forge writes them.',
    'Put long context at the top and the question at the end. Anthropic measure up to a 30% improvement on complex multi-document inputs.',
    "Tell it what to do, not what not to do. 'Do not use markdown' works worse than 'compose flowing prose paragraphs'.",
    'Three to five examples wrapped in <example> tags, diverse and including an edge case.',
  ],
  warnings: [
    'Effort does not shorten the visible answer. If you want it short, say so in words.',
    "Remove legacy 'verify your work' instructions on Opus 5: they cause over-verification with no quality gain.",
    'Assistant prefill is gone on the 5-series and returns a 400. Use a structured output format instead.',
  ],
  settings: (b) =>
    rows([
      ['model', 'claude-opus-5', 'Sonnet 5 for volume, Opus 5 for hard work'],
      ['output_config.effort', or(b.effort, 'High').toLowerCase(), 'low, medium, high, xhigh, max'],
      ['thinking', 'adaptive', 'On by default on the 5-series'],
      ['temperature', 'leave default', 'Non-default values return a 400 on Sonnet 5'],
      ['max_tokens', 'generous', 'Thinking is on by default and eats budget'],
    ]),
  delimiters: 'xml',
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',
      title: 'Prompt engineering overview',
      publisher: 'Anthropic',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
