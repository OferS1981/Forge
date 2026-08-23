import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const veo: Model = {
  id: 'veo',
  name: 'Veo',
  version: '3.1',
  maker: 'Google DeepMind',
  category: 'video',
  blurb:
    'Synced dialogue and native audio in one pass. Google publishes an exact prompt formula and it works.',
  tags: ['Cinematography-first', 'Native audio', '4 / 6 / 8s', '16:9 & 9:16 only'],
  grammar: 'prose',
  length: [40, 120],
  core: ['subject', 'action', 'setting', 'purpose'],
  craft: ['camMove', 'shot', 'lens', 'light', 'motion', 'pacing', 'grade', 'mood', 'ref', 'avoid'],
  tech: ['aspect', 'duration', 'vaudio'],
  aspects: opts(['16:9', '9:16'], 'field.aspect'),
  durations: opts(['4s', '6s', '8s'], 'field.duration'),
  negative: {
    mode: 'none',
    note: "not a first-class API parameter. Google's guidance is to phrase exclusions positively: 'a desolate landscape with no buildings' rather than 'no man-made structures'",
  },
  best: 'Dialogue and audio in sync, physical plausibility, prompt adherence, clean 1080p and 4K delivery.',
  worst:
    'Eight seconds maximum. Only two aspect ratios. No true camera-parameter control: camera is language-driven.',
  notes: [
    "Google's official order is cinematography, subject, action, context, style and ambiance. Forge writes exactly that order.",
    'Dialogue goes in quotes. SFX and ambience get their own labelled lines: that is the documented syntax.',
  ],
  warnings: [
    '1080p and 4K are eight-second-only. Requesting them at 4s or 6s fails or silently downgrades. Extending drops you to 720p.',
    'The prompt rewriter is on by default and will silently rewrite engineered wording. Turn it off for deterministic work.',
    'Keep dialogue under about fifteen words per eight-second clip or lip-sync drifts.',
  ],
  settings: (b) =>
    rows([
      ['model', 'veo-3.1-generate-preview', 'fast and lite variants exist for drafts'],
      ['aspectRatio', or(b.aspect, '16:9'), '16:9 or 9:16, nothing else'],
      ['durationSeconds', or(b.duration, '8s').replace('s', ''), '4, 6 or 8'],
      [
        'resolution',
        or(b.duration, '8s') === '8s' ? '1080p' : '720p',
        '1080p and 4K require 8 seconds',
      ],
      ['Prompt rewriter', 'off', 'Silently rewrites your prompt when left on'],
      ['referenceImages', 'up to 3', ''],
    ]),
  vertical: 'strong',
  pairsWith: [
    {
      model: 'el-tts',
      why: 'A cleaner voice track than the native audio. Generate the clip, then dub the dialogue.',
    },
  ],
  betterFor: [],
  strengthTags: [
    { tag: 'photoreal', weight: 2 },
    { tag: 'native-audio', weight: 3 },
  ],
  sources: [
    {
      url: 'https://ai.google.dev/gemini-api/docs/video',
      title: 'Generate video with Veo',
      publisher: 'Google',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
