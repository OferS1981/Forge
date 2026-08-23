import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const ideogram: Model = {
  id: 'ideogram',
  name: 'Ideogram',
  version: '4.0',
  maker: 'Ideogram',
  category: 'image',
  blurb:
    'Trained on structured JSON captions, so a JSON prompt goes straight to the engine. Best text rendering measured anywhere.',
  tags: ['JSON prompt', '0.97 OCR accuracy', 'Negative field', 'Open weights'],
  grammar: 'json',
  length: [40, 160],
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
    ['1x1', '16x9', '9x16', '4x3', '3x4', '3x2', '2x3', '10x16', '16x10'],
    'field.aspect',
  ),
  negative: {
    mode: 'field',
    label: 'negative_prompt',
    note: 'the positive prompt always wins: you cannot negative away a part of something you asked for',
  },
  best: 'In-image text, posters, logos, packaging, typographic design. Highest OCR accuracy of any model tested.',
  worst:
    'Photorealistic skin and portraits. Alpha channels and editable text layers are still roadmap.',
  notes: [
    'Prose prompts get rewritten by Magic Prompt before generation, which is a train/inference gap. JSON does not.',
    'Bounding boxes are normalised [y_min, x_min, y_max, x_max] on a 0–1000 canvas.',
  ],
  warnings: [
    'Set magic_prompt to OFF once you are sending engineered JSON, or it rewrites your work.',
    'style_codes and style_reference_images are mutually exclusive: sending both errors.',
  ],
  settings: (b) =>
    rows([
      ['resolution', or(b.aspect, '1x1'), '1K and 2K enums'],
      ['rendering_speed', 'DEFAULT', 'TURBO for drafts, QUALITY for finals'],
      ['magic_prompt', 'OFF', 'Leave ON only for one-line prompts'],
      ['style_type', b.imgtext ? 'DESIGN' : 'AUTO', 'AUTO, GENERAL, REALISTIC, DESIGN, FICTION'],
      ['num_images', '4', '1–8'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'in-image-text', weight: 3 },
    { tag: 'editable-vectors', weight: 1 },
  ],
  sources: [
    {
      url: 'https://developer.ideogram.ai/api-reference/api-reference/generate-v3',
      title: 'Ideogram API reference',
      publisher: 'Ideogram',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
