import type { Model } from '../../types';
import { has, opts, or, rows } from '../shared';

export const midjourney: Model = {
  id: 'midjourney',
  name: 'Midjourney',
  version: 'V8.2',
  maker: 'Midjourney',
  category: 'image',
  blurb:
    'Aesthetic-first diffusion. Write like you are briefing a cinematographer, not tagging a booru.',
  tags: ['Prose prompt', ': weighting', '--no negatives', '2048px HD'],
  grammar: 'prose',
  length: [40, 150],
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
  aspects: opts(['1:1', '4:5', '3:2', '2:3', '16:9', '9:16', '21:9', '139:100'], 'field.aspect'),
  negative: {
    mode: 'flag',
    label: '--no',
    note: '--no x is exactly equivalent to a x::-0.5 weight',
  },
  best: 'Aesthetic and painterly quality, cinematic lighting, style consistency across a set via --sref and --p, fashion, concept art.',
  worst:
    'Literal instruction following, long in-image text, infographics, UI mockups, exact brand hex, counting objects.',
  notes: [
    'V8 parses the prompt as language, so the sentence order is the emphasis order. The first clause gets the most weight.',
    'One lighting description and one lens do more than five stacked adjectives. Midjourney reads extra style words as noise.',
    '--sref locks the look across a whole set. Get one image you like, then reuse its style code for everything else in the campaign.',
  ],
  warnings: [
    'Adjective spam (masterpiece, 8k, hyper detailed) is a V5-era habit that actively hurts V7/V8. Forge strips it.',
    '--stylize and --exp fight each other. If you are using --sref or a personalization profile, keep --exp at or below 25.',
    'Omni Reference (--oref) is documented against V7 and can silently downgrade a V8.2 render. Check the version stamp before batching.',
  ],
  settings: (b) =>
    rows([
      ['--ar', or(b.aspect, '1:1'), 'Aspect ratio. No decimals: use 139:100, not 1.39:1'],
      [
        '--stylize',
        b.medium && /photo/i.test(b.medium) ? '100' : '250',
        '0–1000, default 100. Higher gives Midjourney more artistic licence',
      ],
      [
        '--chaos',
        '0',
        '0–100. Raise to 15–25 only when you want four genuinely different directions',
      ],
      ['--v', '8.2', 'Current default model'],
      [
        '--raw',
        b.medium && /photo/i.test(b.medium) ? 'on' : 'off',
        "Removes Midjourney's house styling. Use it for documentary and product work",
      ],
      ['--q', '1', '1, 2 or 4. Only go to 2 on the final render: it costs 2x GPU time'],
      ['--hd', 'on for finals', '2048px at 1:1. Draft at SD, master at HD'],
    ]),
  promptSuffix: (b) => {
    let s =
      ' --ar ' +
      or(b.aspect, '1:1') +
      ' --v 8.2 --stylize ' +
      (b.medium !== undefined && /photo/i.test(b.medium) ? '100' : '250');
    if (b.medium !== undefined && /photo|cinematic/i.test(b.medium)) s += ' --raw';
    return s;
  },
  pairsWith: [
    {
      model: 'mjvideo',
      why: 'Midjourney Video inherits the Midjourney look frame by frame, so a still you like becomes the first frame of the clip.',
    },
  ],
  betterFor: [
    {
      when: (b) => has(b.imgtext),
      model: 'ideogram',
      why: 'Ideogram renders text at 0.97 OCR accuracy. Midjourney is the weakest major model at in-image text.',
    },
  ],
  strengthTags: [
    { tag: 'photoreal', weight: 2 },
    { tag: 'character-consistency', weight: 2 },
  ],
  policy:
    "Midjourney's community guidelines require PG-13 content: no gore, which their page defines down to detached body parts and blood, no adult content, no imagery of real people that could harass, defame or harm, and nothing visually shocking. Some text and image inputs are blocked automatically, and violations can mean a time-out or a block.",
  sources: [
    {
      url: 'https://docs.midjourney.com/hc/en-us/articles/32013696484109-Community-Guidelines',
      title: 'Community Guidelines',
      publisher: 'Midjourney',
    },
    {
      url: 'https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List',
      title: 'Parameter List',
      publisher: 'Midjourney',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
