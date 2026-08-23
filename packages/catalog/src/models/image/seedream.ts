import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const seedream: Model = {
  id: 'seedream',
  name: 'Seedream',
  version: '5.0 Pro',
  maker: 'ByteDance',
  category: 'image',
  blurb:
    'Ten-plus languages natively, with correct script direction and diacritics. The right routing for Arabic, Hebrew and Thai typography.',
  tags: ['Spatial + quoted text', 'RTL scripts', 'No seed', '1.5K free upgrade'],
  grammar: 'brief',
  length: [60, 200],
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
    ['auto', '1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '4:5', '5:4', '21:9'],
    'field.aspect',
  ),
  negative: {
    mode: 'prose',
    label: 'Constraints',
    note: 'no documented negative field on the 5.0 Pro endpoint',
  },
  best: 'Multilingual and right-to-left typography, complex information visualisation, pixel-level editing, photorealistic textures.',
  worst: 'Portrait photorealism trails Nano Banana Pro. No native 4K. No seed and no batch.',
  notes: [
    'Write the spatial arrangement explicitly and quote the exact on-image text, then state the reading order.',
    'The cap is 4000 tokens but ByteDance recommend staying under about 600 English words.',
  ],
  warnings: [
    '1.5K costs the same as 1K and looks better. There is no reason ever to request 1K.',
    'No seed and n locked to 1: reproducibility and cheap variation exploration are both unavailable.',
  ],
  settings: (b) =>
    rows([
      ['size', or(b.aspect, 'auto'), ''],
      ['quality', '1.5K', 'Same price as 1K. Always take it'],
      ['prompt_priority', 'standard', 'fast trades quality for latency'],
      ['output_format', 'png', 'jpeg is default'],
      ['watermark', 'false', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'photoreal', weight: 2 },
    { tag: 'in-image-text', weight: 2 },
    { tag: 'non-english-text', weight: 3 },
  ],
  sources: [
    {
      url: 'https://docs.byteplus.com/en/docs/ModelArk/1666946',
      title: 'Seedream model documentation',
      publisher: 'BytePlus',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
