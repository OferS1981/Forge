import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const luma: Model = {
  id: 'luma',
  name: 'Luma Ray',
  version: '3.2',
  maker: 'Luma AI',
  category: 'video',
  blurb:
    'Sixteen keyframes per clip and native 16-bit HDR with EXR export. The only model that drops into a colour-managed post pipeline.',
  tags: ['16 keyframes', 'HDR / ACES EXR', '20s at 1080p', 'Reasoning mode'],
  grammar: 'prose',
  // Its own note, below: Ray3's reasoning mode favours narrative prose, X happens then Y, over
  // dense keyword stacks.
  prose: 'narrative',
  length: [40, 100],
  core: ['subject', 'action', 'setting', 'purpose'],
  craft: ['camMove', 'shot', 'lens', 'light', 'motion', 'pacing', 'grade', 'mood', 'ref', 'avoid'],
  tech: ['aspect', 'duration'],
  aspects: opts(['16:9', '9:16', '1:1', '21:9', '4:3'], 'field.aspect'),
  durations: opts(['5s', '10s', '20s'], 'field.duration'),
  negative: { mode: 'prose', label: 'Constraints', note: 'no documented field' },
  best: 'Professional post pipelines, precise pacing via keyframes, performance preservation, colour-critical work.',
  worst: 'Not the cheapest or fastest. Audio is not its story.',
  notes: [
    'Ray3 has a reasoning mode that plans event sequences, so it favours narrative prose (X happens, then Y) over dense keyword stacks.',
    'Sixteen keyframes is a pacing tool, not just a start-and-end tool. Place them on beat changes to lock timing.',
  ],
  warnings: [
    'Always iterate in Draft mode and only then master. Mastering every take at 4K HDR is the biggest credit waste on the platform.',
    'Dream Machine is deprecated branding. The model is Ray3.2.',
  ],
  settings: (b) =>
    rows([
      ['model', 'ray3.2', ''],
      ['Draft mode', 'on while iterating', '5x faster, then master'],
      ['duration', or(b.duration, '10s'), 'Up to 20s at 1080p'],
      ['resolution', '1080p', '4K HDR at master'],
      ['Keyframes', 'place on beat changes', 'Up to 16 per clip'],
      ['loop', 'false', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [{ tag: 'long-clip', weight: 2 }],
  sources: [
    {
      url: 'https://docs.lumalabs.ai/docs/video-generation',
      title: 'Video generation',
      publisher: 'Luma AI',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
