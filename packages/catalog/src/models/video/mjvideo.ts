import type { Model } from '../../types';
import { opts, rows } from '../shared';

export const mjvideo: Model = {
  id: 'mjvideo',
  name: 'Midjourney Video',
  version: 'V1',
  maker: 'Midjourney',
  category: 'video',
  blurb:
    'Inherits the Midjourney look frame by frame. Motion-only prompts, five to twenty-one seconds, no audio at all.',
  tags: ['5–25 word prompts', '--motion high', '480p / 720p', 'No audio'],
  grammar: 'prose',
  length: [5, 25],
  core: ['subject', 'action'],
  craft: ['camMove', 'motion', 'mood'],
  tech: ['aspect'],
  aspects: opts(
    ['16:9 (832x464 / 1280x720)', '9:16', '1:1 (624x624 / 960x960)', '4:3', '2:3'],
    'field.aspect',
  ),
  negative: { mode: 'none', note: 'no negative prompt on video' },
  best: 'Per-frame aesthetic quality, stylisation, looping motion graphics.',
  worst: 'Resolution, duration, physics, and anything involving dialogue or audio: there is none.',
  notes: [
    'This is not a cinematic-paragraph model. Describe only the motion, in a handful of words, and let the still carry the look.',
    'Extend x4 at about four seconds each gets you to twenty-one seconds total.',
  ],
  warnings: [
    '--motion low is the default and produces near-still results. If nothing moves, that is why.',
    "--raw disables the house styling. Use it when you want the video to obey the prompt rather than Midjourney's taste.",
    'HD 720p is plan-gated and Fast-Mode-gated. Free and Basic silently get 480p.',
  ],
  settings: () =>
    rows([
      ['--motion', 'high', 'low is the default and barely moves'],
      ['--raw', 'on', 'Turns off aesthetic auto-styling'],
      ['--loop', 'off', 'On for motion-graphic loops'],
      ['--end', 'optional', 'Custom end frame'],
      ['Resolution', 'HD 720p', 'Requires Pro or Mega in Fast Mode'],
    ]),
  promptSuffix: () => ' --motion high --raw',
  pairsWith: [],
  betterFor: [],
  strengthTags: [{ tag: 'long-clip', weight: 1 }],
  sources: [
    {
      url: 'https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video',
      title: 'Video',
      publisher: 'Midjourney',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
