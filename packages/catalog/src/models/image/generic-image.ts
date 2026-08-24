import type { ModelSpec } from '../../types';
import { opts, or, rows } from '../shared';

export const genericImage: ModelSpec = {
  id: 'generic-image',
  name: 'Any other image model',
  version: 'category wildcard',
  category: 'image',
  wildcard: true,
  blurb:
    'Not in the rack? Forge writes a model-agnostic image prompt that carries every layer a diffusion or autoregressive image model can use, plus the settings any of them expose.',
  tags: ['Model-agnostic', 'Both grammars', 'Portable'],
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
  aspects: opts(['1:1', '4:5', '3:2', '2:3', '16:9', '9:16', '21:9'], 'field.aspect'),
  negative: {
    mode: 'field',
    label: 'Negative prompt',
    note: 'included in case your model has one: delete the block if it does not',
  },
  best: 'Any image model. Forge emits a prose version and a tag version so you can paste whichever one your tool prefers.',
  worst: 'Nothing model-specific. If your model is in the rack, use it instead.',
  notes: [
    'Two grammars are produced: prose for modern language-encoder models, comma tags for older CLIP-based ones.',
    'Every 2026 model rewards a lens, a light and a grade. Almost none of them reward the word masterpiece.',
  ],
  warnings: [
    'Check whether your model has a negative field before pasting the negative block into the main prompt.',
  ],
  settings: (b) =>
    rows([
      ['Aspect', or(b.aspect, '1:1'), ''],
      ['Guidance / CFG', '5–7', 'Lower for distilled and turbo models, 1–2'],
      ['Steps', '28', '8–12 on turbo variants'],
      ['Seed', 'fix it once you like a result', 'The only way to iterate on one composition'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [{ tag: 'speed-cost', weight: 1 }],
  sources: [
    {
      url: 'https://docs.midjourney.com/hc/en-us/articles/32023408776589-Prompt-Basics',
      title: 'Prompt Basics',
      publisher: 'Midjourney',
    },
    { url: 'https://docs.bfl.ai/', title: 'BFL API documentation', publisher: 'Black Forest Labs' },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
