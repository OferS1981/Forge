import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const leonardo: Model = {
  id: 'leonardo',
  name: 'Leonardo',
  version: 'Lucid Origin',
  maker: 'Leonardo AI / Canva',
  category: 'image',
  blurb:
    'A platform as much as a model. Trainable personal models and character LoRAs are the reason to be here.',
  tags: ['Custom model training', 'Realtime canvas', 'Style guidance levels', 'Volume-friendly'],
  grammar: 'prose',
  length: [30, 120],
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
    ['1024x1024', '1440x1440', '1536x864', '864x1536', '1360x768', '2048x1152'],
    'field.aspect',
  ),
  negative: {
    mode: 'field',
    label: 'Negative prompt',
    note: 'supported historically on Phoenix; not confirmed in current Lucid docs: verify in your account',
  },
  best: 'Trainable character models, sketch-to-image on Realtime Canvas, game and concept-art asset pipelines, cost-efficient volume.',
  worst:
    'Raw fidelity trails frontier models. Quality is really a function of which hosted model you selected.',
  notes: [
    'Keep the prompt simple, then add targeted aesthetic cues: lighting, lens and mood for photoreal, medium and palette for illustration.',
    "Leonardo's own recommended sweet spot is Fast mode, 1440x1440, 15 steps or fewer.",
  ],
  warnings: [
    'Dimensions must be multiples of 8 and cap at 2496px.',
    'Lucid Realism is tuned as a video input frame generator. For stills, Lucid Origin is the correct default.',
  ],
  settings: (b) =>
    rows([
      ['Model', 'Lucid Origin', 'Lucid Realism only if the still feeds a video model'],
      ['Generation mode', 'FAST', 'ULTRA for finals'],
      ['Dimensions', or(b.aspect, '1440x1440'), 'Multiples of 8, max 2496'],
      ['Style guidance', 'MID', 'LOW, MID, HIGH, ULTRA, MAX'],
      ['Prompt enhancement', 'OFF', 'Leave off once the prompt is engineered'],
      ['num_images', '4', '1–8'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'photoreal', weight: 1 },
    { tag: 'character-consistency', weight: 2 },
    { tag: 'speed-cost', weight: 2 },
  ],
  sources: [
    {
      url: 'https://docs.leonardo.ai/docs/getting-started',
      title: 'Leonardo API documentation',
      publisher: 'Leonardo AI',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
