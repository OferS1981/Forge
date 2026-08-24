import type { ModelSpec } from '../../types';
import { opts, or, rows } from '../shared';

export const gptimage: ModelSpec = {
  id: 'gptimage',
  name: 'GPT Image',
  version: '2',
  maker: 'OpenAI',
  category: 'image',
  blurb:
    'The instruction follower. Best in class for words inside the picture, in almost any script.',
  tags: ['Labelled brief', 'No weighting', 'Text: excellent', '3840x2160'],
  grammar: 'brief',
  length: [60, 300],
  core: ['subject', 'setting', 'medium', 'purpose'],
  craft: [
    'shot',
    'lens',
    'aperture',
    'light',
    'film',
    'grade',
    'comp',
    'mood',
    'palette',
    'imgtext',
    'ref',
    'avoid',
  ],
  tech: ['aspect'],
  aspects: opts(
    ['1024x1024', '1536x1024', '1024x1536', '1920x1080', '1080x1920', '3840x2160', 'auto'],
    'field.aspect',
  ),
  negative: {
    mode: 'prose',
    label: 'Constraints',
    note: 'no negative field: exclusions go in the brief as an explicit Constraints line',
  },
  best: 'In-image text, multilingual scripts, editorial and magazine layouts, infographics, instruction following, identity-preserving edits.',
  worst:
    'Unforced photorealism: a slightly over-lit plasticky look persists. Fine-art texture. Hitting a specific film-stock aesthetic.',
  notes: [
    'It reads a structured brief better than a paragraph, which is why Forge labels the sections.',
    'Put literal on-image copy inside quotes and state placement and contrast separately.',
    'Iterate in small layout nudges. A full re-prompt rerolls the whole composition.',
  ],
  warnings: [
    'Every custom edge must be a multiple of 16, ceiling 3840x2160, or the call fails.',
    'Draft at quality: low. A dense-text render at high quality is the single biggest latency sink.',
  ],
  settings: (b) =>
    rows([
      ['model', 'gpt-image-2', 'Current snapshot: gpt-image-2-2026-04-21'],
      ['size', or(b.aspect, '1024x1024'), 'Custom sizes must divide by 16, up to 3840x2160'],
      [
        'quality',
        b.imgtext ? 'high' : 'medium',
        'low for layout exploration, high only for the text-dense final',
      ],
      ['background', 'opaque', 'transparent needs png or webp output'],
      ['output_format', 'png', 'jpeg if you need the file small'],
      ['n', '1', 'Up to 10 per call'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'in-image-text', weight: 3 },
    { tag: 'speed-cost', weight: 1 },
    { tag: 'non-english-text', weight: 2 },
  ],
  sources: [
    {
      url: 'https://platform.openai.com/docs/guides/image-generation',
      title: 'Image generation guide',
      publisher: 'OpenAI',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
