import type { ModelSpec } from '../../types';
import { opts, or, rows } from '../shared';

export const flux: ModelSpec = {
  id: 'flux',
  name: 'FLUX.2',
  version: '[pro] / [flex]',
  maker: 'Black Forest Labs',
  category: 'image',
  blurb:
    'Photorealism and material texture. Long, dense, specific prompts are productive here in a way they are not on Midjourney.',
  tags: ['Dense prose', 'Long prompts pay', 'No negative on API', 'Up to 10 refs'],
  grammar: 'prose',
  length: [100, 300],
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
    ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'],
    'field.aspect',
  ),
  negative: {
    mode: 'none',
    note: 'no negative prompt on the pro API. Open-weight [dev]/[klein] run true CFG locally and do support one',
  },
  best: 'Photorealism, skin and material texture, typography, multi-reference consistency, product visualisation, spatial logic.',
  worst:
    'No negative prompt on the API. Narrower stylistic range than Midjourney. [dev] weights are non-commercial.',
  notes: [
    'The text encoder is a Mistral-3 VLM, so it follows structured multi-part instructions well. Detail is rewarded, not diluted.',
    '[klein] at 4B is Apache 2.0 and runs in about 8GB of VRAM: the right free local recommendation now, ahead of SDXL.',
  ],
  warnings: [
    '[pro] and [max] deliberately expose no steps and no guidance. If you need those dials you must switch to [flex].',
    'prompt_upsampling rewrites your prompt with an LLM. Leave it off once the prompt is engineered.',
  ],
  settings: (b) =>
    rows([
      [
        'endpoint',
        'flux-2/flex',
        '[pro] for default quality, [flex] when you need steps and guidance',
      ],
      ['image_size', or(b.aspect, 'landscape_16_9'), ''],
      ['num_inference_steps', '28', '[flex] only. Default 28'],
      ['guidance_scale', '3.5', '[flex] only. 3.0–4.0 is the usable band'],
      ['safety_tolerance', '2', '1–5, default 2'],
      ['output_format', 'png', ''],
    ]),
  // Its own notes, above, ask for descriptive paragraphs rather than keyword lists.
  prose: 'narrative',
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'photoreal', weight: 3 },
    { tag: 'character-consistency', weight: 2 },
    { tag: 'open-weights', weight: 2 },
  ],
  sources: [
    { url: 'https://docs.bfl.ai/', title: 'BFL API documentation', publisher: 'Black Forest Labs' },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
