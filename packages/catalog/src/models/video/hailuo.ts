import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const hailuo: Model = {
  id: 'hailuo',
  name: 'Hailuo',
  version: 'MiniMax H3',
  maker: 'MiniMax',
  category: 'video',
  blurb:
    'Facial micro-expression and natural physics, with inline bracketed camera instructions and joint stereo audio.',
  tags: ['7000-char prompts', '[pan] [zoom] syntax', '2K', 'V2V motion transfer'],
  grammar: 'prose',
  length: [60, 180],
  core: ['subject', 'action', 'setting', 'purpose'],
  craft: ['camMove', 'shot', 'lens', 'light', 'motion', 'pacing', 'grade', 'mood', 'ref', 'avoid'],
  tech: ['aspect', 'duration', 'vaudio'],
  aspects: opts(['16:9', '9:16', '1:1', '4:3'], 'field.aspect'),
  durations: opts(['4s', '6s', '10s', '15s'], 'field.duration'),
  negative: { mode: 'prose', label: 'Constraints', note: 'not a documented field' },
  best: 'Facial emotion and micro-expression, natural physics, text and brand rendering, motion transfer, 2K output.',
  worst: 'Aspect ratios bounded between 2:5 and 5:2. No 4K. You cannot get a clean dialogue stem.',
  notes: [
    'H3 accepts inline bracketed camera instructions: [pan], [zoom], [static]. Forge only emits those for this model.',
    'Voice, SFX and music are jointly modelled, so the audio is cohesive but inseparable. Generate silent and dub if you need stems.',
  ],
  warnings: [
    'Duration must be an integer. Sending 7.5 fails.',
    'The bracket syntax is model-specific. Do not paste a Hailuo prompt into another model: the brackets become literal noise.',
  ],
  settings: (b) =>
    rows([
      ['model', 'MiniMax-H3', ''],
      ['duration', or(b.duration, '6s').replace('s', ''), 'Integers only, 4–15'],
      ['resolution', '2K', '768P or 2K'],
      ['aspect', or(b.aspect, '16:9'), 'Bounded 2:5 to 5:2'],
      ['prompt_optimizer', 'off', 'H3-Context-IR rewrites your prompt when on'],
    ]),
  inlineCameraTokens: true,
  pairsWith: [],
  betterFor: [],
  strengthTags: [{ tag: 'native-audio', weight: 2 }],
  sources: [
    {
      url: 'https://platform.minimax.io/docs/api-reference/video-generation',
      title: 'Video generation API',
      publisher: 'MiniMax',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
