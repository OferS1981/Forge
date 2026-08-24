import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const kling: Model = {
  id: 'kling',
  name: 'Kling',
  version: '3.0 / O1',
  maker: 'Kuaishou',
  category: 'video',
  blurb:
    'The shot-list model. It will genuinely plan several shots in one generation, and its element binding is the strongest identity lock available.',
  tags: ['Shot list', 'Up to 15s', '4K', 'Element binding'],
  grammar: 'shotlist',
  length: [60, 150],
  core: ['subject', 'action', 'setting', 'purpose'],
  craft: ['camMove', 'shot', 'lens', 'light', 'motion', 'pacing', 'grade', 'mood', 'ref', 'avoid'],
  tech: ['aspect', 'duration', 'shots', 'vaudio'],
  aspects: opts(['16:9', '9:16', '1:1'], 'field.aspect'),
  durations: opts(['5s', '10s', '15s'], 'field.duration'),
  negative: { mode: 'field', label: 'Negative prompt', note: 'supported' },
  best: 'Multi-shot narrative in a single generation, character and element consistency, motion transfer, 4K, non-English dialogue.',
  worst:
    'Prompt sensitivity. It over-reads long prompts and will invent shot changes you did not ask for.',
  notes: [
    'The official formula is subject and its description, then subject movement, then scene, then camera language, lighting and atmosphere, in that order. Keep each movement straightforward enough for a five-second beat.',
    "Kling's own formula is shot type, movement direction, duration or speed descriptor, then style elements. Forge writes one block per shot in that order.",
    'Master Shots camera presets are more stable than prompted camera language. When the move matters, use the preset.',
    'Bind elements. Without them, identity drifts badly past about eight seconds.',
  ],
  warnings: [
    'Multi-shot auto-planning is on by default in some modes. If you want one continuous take you must say so explicitly.',
    'Audio is billed per second and on by default. Turn it off for silent b-roll or you burn about a third extra.',
  ],
  settings: (b) =>
    rows([
      ['Model', 'Kling 3.0', 'O1 for unified generate-and-edit, Turbo for drafts'],
      ['Mode', 'pro', 'std, pro or 4k'],
      ['Duration', or(b.duration, '5s'), '3–15 seconds'],
      ['Aspect', or(b.aspect, '16:9'), ''],
      ['Sound', b.vaudio ? 'on' : 'off', 'On by default and billed per second'],
      ['Elements', 'bind the subject', '5–30s of reference for voice binding'],
    ]),
  vertical: 'strong',
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'photoreal', weight: 2 },
    { tag: 'long-clip', weight: 2 },
    { tag: 'native-audio', weight: 2 },
    { tag: 'character-consistency', weight: 3 },
    { tag: 'non-english-text', weight: 2 },
  ],
  sources: [
    {
      url: 'https://app.klingai.com/global/quickstart/text-to-video-prompt-guide',
      title: 'Text to Video Prompt Guide',
      publisher: 'Kling',
    },
    {
      url: 'https://app.klingai.com/global/dev/document-api/apiReference/model/videoGeneration',
      title: 'Video generation API',
      publisher: 'Kuaishou',
    },
  ],
  verifiedOn: '2026-08-24',
  unverified: true,
};
