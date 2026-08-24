import type { ModelSpec } from '../../types';
import { opts, or, rows } from '../shared';

export const recraft: ModelSpec = {
  id: 'recraft',
  name: 'Recraft',
  version: 'V4',
  maker: 'Recraft',
  category: 'image',
  blurb:
    'The only model producing genuine editable SVG: real paths that open in Figma and Illustrator.',
  tags: ['1000-byte cap', 'True SVG out', 'RGB colour control', 'Global to local'],
  grammar: 'brief',
  length: [25, 100],
  core: ['subject', 'setting', 'medium', 'purpose'],
  craft: ['comp', 'mood', 'palette', 'imgtext', 'ref', 'avoid'],
  tech: ['aspect'],
  aspects: opts(
    ['1024x1024', '1365x1024', '1024x1365', '1536x1024', '1024x1536', '2048x2048'],
    'field.aspect',
  ),
  negative: {
    mode: 'field',
    label: 'negative_prompt',
    note: 'max 1000 bytes, same as the positive',
  },
  best: 'Logos, icon sets, brand kits, vector illustration, structured text hierarchy, utility and product shots.',
  worst:
    'Cinematic drama and frontier-level human photorealism. V4 dropped style creation and prompt-based editing that V3 had.',
  notes: [
    "Recraft's own framing: short prompts mean the model designs with you, long prompts mean it executes your architecture.",
    'Order matters and runs global to local: core concept, background, subject framing, attributes, spatial relations, lighting, camera, mood.',
    'controls.colors with explicit RGB is far more accurate for brand colours than naming them in prose.',
  ],
  warnings: [
    'The prompt cap is 1000 bytes, not characters. Accented and CJK text eats it fast.',
    'V4 is not a strict superset of V3. Route style-creation jobs back to V3.',
  ],
  settings: (b) =>
    rows([
      [
        'style',
        b.medium && /vector|flat/i.test(b.medium) ? 'vector_illustration' : 'realistic_image',
        'realistic_image, digital_illustration, vector_illustration, icon, logo_raster',
      ],
      [
        'substyle',
        'none',
        'natural_light, studio_portrait, hdr, line_art, flat, engraving, pictogram…',
      ],
      ['size', or(b.aspect, '1024x1024'), '2048x2048 on Pro'],
      ['controls.artistic_level', '2', '0–5'],
      [
        'controls.no_text',
        b.imgtext ? 'false' : 'true',
        'Set true when text must not appear anywhere',
      ],
      ['response_format', 'url', 'SVG, PNG, JPG, PDF, TIFF and Lottie all available'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'in-image-text', weight: 2 },
    { tag: 'editable-vectors', weight: 3 },
  ],
  sources: [
    {
      url: 'https://www.recraft.ai/docs',
      title: 'Recraft API documentation',
      publisher: 'Recraft',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
