import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const firefly: Model = {
  id: 'firefly',
  name: 'Adobe Firefly',
  version: 'Image 5',
  maker: 'Adobe',
  category: 'image',
  blurb:
    'The commercially safe one. Content Credentials on every output and indemnified training data.',
  tags: ['8-slot structure', 'Exclude field', '4MP native', 'C2PA provenance'],
  grammar: 'brief',
  length: [40, 140],
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
    [
      'Square 1:1',
      'Landscape 4:3',
      'Portrait 3:4',
      'Widescreen 16:9',
      'Vertical 9:16 (Image 4 only)',
    ],
    'field.aspect',
  ),
  negative: { mode: 'field', label: 'Exclude', note: 'a real negative field, rare at this tier' },
  best: 'Client-facing work where provenance matters, brand-consistent stock-like imagery, Photoshop and Illustrator round-trips, in-image text.',
  worst:
    'Aggressive safety filters that block benign creative requests. Less abstract than Midjourney.',
  notes: [
    "Adobe's own recommended order is image type, subject, action, angle, lighting, background, palette, style. Forge writes that order.",
    'Firefly is the right default when the deliverable is for a client and Content Credentials are part of the deliverable.',
  ],
  warnings: [
    '9:16 is not available on Image 5. If you need vertical social you must fall back to Image 4 or 4 Ultra.',
    'A prose style description that contradicts a chosen Effect preset produces mush. Pick one or the other.',
  ],
  settings: (b) =>
    rows([
      ['Model', 'Firefly Image 5', 'Image 4 Ultra if you need 9:16'],
      ['Aspect ratio', or(b.aspect, 'Square 1:1'), ''],
      ['Content type', b.medium && /photo/i.test(b.medium) ? 'Photo' : 'Art', ''],
      ['Visual intensity', 'Medium', "Firefly's substitute for a stylize dial"],
      ['Effects', 'none', 'Only if it agrees with the prose style'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'in-image-text', weight: 1 },
    { tag: 'commercial-safety', weight: 3 },
  ],
  sources: [
    {
      url: 'https://helpx.adobe.com/firefly/using/write-effective-text-prompts.html',
      title: 'Write effective text prompts',
      publisher: 'Adobe',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
