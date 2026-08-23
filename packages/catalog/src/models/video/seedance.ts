import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const seedance: Model = {
  id: 'seedance',
  name: 'Seedance',
  version: '2.5',
  maker: 'ByteDance',
  category: 'video',
  blurb:
    'Thirty seconds in one take, the longest of any major model. Which means you have to write the whole timeline, not a tableau.',
  tags: ['Up to 30s', 'Omni reference', 'Native edit & extend', '4K on 2.0'],
  grammar: 'prose',
  length: [80, 200],
  core: ['subject', 'action', 'setting', 'purpose'],
  craft: ['camMove', 'shot', 'lens', 'light', 'motion', 'pacing', 'grade', 'mood', 'ref', 'avoid'],
  tech: ['aspect', 'duration', 'vaudio'],
  aspects: opts(['auto', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'], 'field.aspect'),
  durations: opts(['5s', '10s', '15s', '20s', '30s'], 'field.duration'),
  negative: {
    mode: 'prose',
    label: 'Constraints',
    note: 'not documented as a field: express exclusions in the prompt',
  },
  best: 'Long single takes, identity consistency across many references, product and multi-SKU e-commerce, native editing and extension.',
  worst: 'Prompt discipline. Thirty seconds of unspecified time invites drift.',
  notes: [
    'Budget the prompt across the timeline. A 30-second prompt describing only the opening image gives you five seconds of intent and twenty-five of hallucination.',
    'Structure: subject, performance across the full duration, ambience, camera, then audio and continuity cues.',
  ],
  warnings: [
    'In video_edit mode duration and aspect_ratio are ignored and you are billed by source length. Passing them is a silent no-op.',
    '4K and 1080p need mode std. Fast mode caps at 720p.',
    'generate_audio is independent of audio_references. Set both deliberately.',
  ],
  settings: (b) =>
    rows([
      ['mode', 't2v', 't2v, omni_reference, video_edit, video_extension'],
      ['duration', or(b.duration, '10s'), '4–30 seconds'],
      ['aspect_ratio', or(b.aspect, '16:9'), ''],
      ['resolution', '1080p', 'Requires mode std. Fast caps at 720p'],
      ['generate_audio', b.vaudio ? 'true' : 'false', ''],
      ['bitrate_mode', 'high', ''],
    ]),
  vertical: 'strong',
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'photoreal', weight: 2 },
    { tag: 'long-clip', weight: 3 },
    { tag: 'native-audio', weight: 2 },
    { tag: 'character-consistency', weight: 2 },
  ],
  sources: [
    {
      url: 'https://docs.byteplus.com/en/docs/ModelArk/1520757',
      title: 'Seedance model documentation',
      publisher: 'BytePlus',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
