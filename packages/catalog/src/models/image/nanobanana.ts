import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const nanobanana: Model = {
  id: 'nanobanana',
  name: 'Nano Banana Pro',
  version: 'gemini-3-pro-image',
  maker: 'Google',
  category: 'image',
  blurb:
    'Reasons about the picture before it renders it. The one to use when the image has to be factually right.',
  tags: ['Narrative paragraph', 'No negative prompt', 'Native 4K', 'Search-grounded'],
  grammar: 'prose',
  length: [50, 180],
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
    ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    'field.aspect',
  ),
  negative: {
    mode: 'none',
    note: "no negative parameter exists. Google's guidance is to describe the desired state positively",
  },
  best: 'Legible multilingual in-image text, factually grounded infographics, native 4K, character consistency across many references, conversational multi-turn editing.',
  worst:
    'No negative lever at all. Conservative default aesthetic. Heavy restriction around real people. SynthID on every output.',
  notes: [
    "Google's own docs ask for narrative descriptive paragraphs, not keyword lists. Forge writes it that way.",
    "Because it reasons first, giving it something to reason about pays: 'make the ratios in this chart mathematically correct' measurably improves output.",
    'Holds likeness for up to five people across references: the strongest option for a cast that has to stay consistent.',
  ],
  warnings: [
    'image_size must be written with a capital K: 1K, 2K, 4K. Lowercase 4k is ignored.',
    'Do not port Imagen calls forward. negativePrompt, sampleCount and personGeneration do not exist here: Imagen shut down 17 Aug 2026.',
  ],
  settings: (b) =>
    rows([
      ['aspect_ratio', or(b.aspect, '1:1'), 'Ten presets, 21:9 through 9:16'],
      ['image_size', '2K', 'Capital K is mandatory. 4K for print'],
      [
        'thinking_level',
        'high',
        'Cannot be disabled on Gemini 3. Use high when the image carries information',
      ],
      ['mime_type', 'image/png', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'photoreal', weight: 1 },
    { tag: 'character-consistency', weight: 3 },
    { tag: 'commercial-safety', weight: 1 },
  ],
  sources: [
    {
      url: 'https://ai.google.dev/gemini-api/docs/image-generation',
      title: 'Image generation with Gemini',
      publisher: 'Google',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
