import type { ModelSpec } from '../../types';
import { opts, or, rows, wantsVertical } from '../shared';

export const runway: ModelSpec = {
  id: 'runway',
  name: 'Runway',
  version: 'Gen-4.5',
  maker: 'Runway',
  category: 'video',
  blurb:
    'Best-in-class prompt adherence on sequenced instructions and facial nuance, held back by a 720p, ten-second ceiling.',
  tags: ['Camera-first template', '2–10s', '720p', 'T2V is 16:9 only'],
  grammar: 'prose',
  // Its own note, below: the vendor's template is [camera] shot of [subject] [action] in
  // [environment], then supporting description. The shared order was ignoring that.
  videoOrder: 'action-in-environment',
  length: [30, 90],
  core: ['subject', 'action', 'setting', 'purpose'],
  craft: ['camMove', 'shot', 'lens', 'light', 'motion', 'pacing', 'grade', 'mood', 'ref', 'avoid'],
  tech: ['aspect', 'duration'],
  aspects: opts(
    [
      '16:9 (1280x720)',
      '9:16 (720x1280), image-to-video only',
      '1:1 (960x960), I2V only',
      '21:9 (1584x672), I2V only',
    ],
    'field.aspect',
  ),
  durations: opts(['5s', '10s'], 'field.duration'),
  negative: { mode: 'prose', label: 'Constraints', note: 'no dedicated field' },
  best: 'Prompt adherence on complex sequenced instructions, character emotion and facial nuance, photoreal and stylised range.',
  worst:
    '720p ceiling and ten-second cap. Runway itself has conceded model leadership and now routes to other models.',
  notes: [
    "Runway's own template for text-to-video is: [camera] shot of [subject] [action] in [environment], then supporting description.",
    'For image-to-video, describe only what changes. Re-describing what is already in the image creates conflict and burns credits.',
    'Runway states element order does not matter and there is no ideal length. Clarity beats word count.',
  ],
  warnings: [
    'Text-to-video is locked to 16:9. For vertical you must generate a still first and go image-to-video.',
    'Prompting motion that contradicts implied motion in the source image massively increases iteration count.',
  ],
  settings: (b) =>
    rows([
      ['Model', 'gen4.5', 'aleph2 for video-to-video, act_two for performance capture'],
      ['Duration', or(b.duration, '5s'), '2–10 seconds'],
      ['Ratio', or(b.aspect, '16:9 (1280x720)'), 'T2V is 16:9 only'],
      ['fps', '24', '24 or 25'],
    ]),
  vertical: 'weak',
  pairsWith: [],
  betterFor: [
    {
      when: (b) => wantsVertical(b),
      model: 'kling',
      why: 'Runway text-to-video is locked to 16:9. Kling takes 9:16 directly.',
    },
  ],
  strengthTags: [],
  sources: [
    {
      url: 'https://docs.dev.runwayml.com/',
      title: 'Runway API documentation',
      publisher: 'Runway',
    },
    {
      url: 'https://help.runwayml.com/hc/en-us/articles/39789879051923-Gen-4-Video-Prompting-Guide',
      title: 'Gen-4 Video Prompting Guide',
      publisher: 'Runway',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
