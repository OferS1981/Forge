import type { ModelSpec } from '../../types';
import { has, opts, or, rows } from '../shared';

export const sdxl: ModelSpec = {
  id: 'sdxl',
  name: 'Stable Diffusion',
  version: 'SDXL / 3.5',
  maker: 'Stability AI',
  category: 'image',
  blurb:
    'The control rig. Tag syntax, real weighting, a true negative field, and the deepest LoRA and ControlNet ecosystem.',
  tags: ['Comma tags', '(word:1.2) weights', 'True negative field', 'Local'],
  grammar: 'tags',
  length: [20, 75],
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
    ['1024x1024', '1152x896', '1216x832', '1344x768', '896x1152', '832x1216', '768x1344'],
    'field.aspect',
  ),
  negative: {
    mode: 'field',
    label: 'Negative prompt',
    note: "first-class separate field: the family's defining advantage",
  },
  best: 'Total control, LoRA and ControlNet composability, offline work, character training, style fine-tunes.',
  worst:
    'In-image text, hands, prompt adherence on complex multi-subject scenes, out-of-box aesthetics.',
  notes: [
    'This is the one major family where comma-separated tags are correct rather than lazy. Forge writes tags here and prose everywhere else.',
    'Weight syntax: (word) is x1.1, (word:1.4) is explicit, BREAK forces a new 75-token chunk.',
    'Stack two (word:1.2) terms rather than one (word:1.8). Above about 1.5 you stop strengthening a concept and start frying the image.',
  ],
  warnings: [
    'Respect the resolution buckets. Generating SDXL at 1920x1080 directly is the number one amateur mistake: render at 1344x768 and upscale.',
    'Boilerplate negatives help SDXL and genuinely hurt SD 3.5 and the Flux family. Forge only emits them for SDXL.',
  ],
  settings: (b) =>
    rows([
      ['Resolution', or(b.aspect, '1344x768'), 'Stay on the native bucket, then upscale'],
      ['Sampler', 'DPM++ 2M Karras', 'The workhorse. DPM++ SDE Karras for more texture'],
      ['CFG scale', '7', 'SDXL 5–8. SD 3.5 around 4–5. Turbo and Lightning 1–2'],
      ['Steps', '28', '20–30 typical, 8–12 on Lightning LoRAs'],
      ['Clip skip', '2', 'Standard for most SDXL fine-tunes'],
      ['Hires fix', '1.5x, denoise 0.4', 'How you get to 2K without duplicated limbs'],
    ]),
  pairsWith: [],
  betterFor: [
    {
      when: (b) => has(b.imgtext),
      model: 'flux',
      why: 'FLUX.2 lists typography among its strengths. In-image text is one of the things SDXL is worst at.',
    },
  ],
  strengthTags: [
    { tag: 'speed-cost', weight: 2 },
    { tag: 'open-weights', weight: 3 },
  ],
  sources: [
    {
      url: 'https://platform.stability.ai/docs/api-reference',
      title: 'Stability AI API reference',
      publisher: 'Stability AI',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
