import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const qwenimage: Model = {
  id: 'qwenimage',
  name: 'Qwen-Image',
  version: '3.0 Pro',
  maker: 'Alibaba',
  category: 'image',
  blurb:
    'Built for one-pass dense layouts. Renders text as small as ten pixels legibly, across twelve languages.',
  tags: ['Up to 4500 tokens', 'Negative field', '10px legible text', 'LaTeX'],
  grammar: 'brief',
  length: [150, 600],
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
    ['1024*1024', '1328*1328', '1664*928', '928*1664', '1472*1140', '2048*2048'],
    'field.aspect',
  ),
  negative: { mode: 'field', label: 'negative_prompt', note: 'dedicated field' },
  best: 'Infographic grids, newspaper pages, academic-paper mockups, nested UI designs, multi-line maths notation, Chinese typography.',
  worst:
    'Portrait photorealism. Heavily rate-limited at five requests a minute. No open weights at the 3.0 tier.',
  notes: [
    'This is the model where a very long, layout-explicit prompt is the point. Describe every region and its contents.',
    'Twelve languages natively, and it is the strongest option for dense Chinese text.',
  ],
  warnings: [
    'size uses an asterisk: 1024*1024, not 1024x1024. Silent-failure class bug.',
    'prompt_extend defaults to true and will rewrite an engineered prompt. Turn it off.',
    'prompt_extend_mode agent hard-fails with a 400 on image-to-image.',
  ],
  settings: (b) =>
    rows([
      ['model', 'qwen-image-3.0-pro', ''],
      ['size', or(b.aspect, '1328*1328'), 'Asterisk, not x. 512 to 2048 per side'],
      ['prompt_extend', 'false', 'Defaults true: turn it off for engineered prompts'],
      ['enable_thinking', 'true', ''],
      ['n', '1', '1–6, but the Pro tier allows only 5 requests per minute'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'in-image-text', weight: 3 },
    { tag: 'non-english-text', weight: 3 },
  ],
  sources: [
    {
      url: 'https://www.alibabacloud.com/help/en/model-studio/qwen-image-api',
      title: 'Qwen-Image API',
      publisher: 'Alibaba Cloud',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
