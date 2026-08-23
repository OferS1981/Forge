import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const genericVideo: Model = {
  id: 'generic-video',
  name: 'Any other video model',
  version: 'category wildcard',
  category: 'video',
  wildcard: true,
  blurb:
    'Writes a portable cinematic prompt with every layer a video model can use, and flags which parts to delete if your model does not support them.',
  tags: ['Model-agnostic', 'Portable', 'Layer-flagged'],
  grammar: 'prose',
  length: [50, 150],
  core: ['subject', 'action', 'setting', 'purpose'],
  craft: ['camMove', 'shot', 'lens', 'light', 'motion', 'pacing', 'grade', 'mood', 'ref', 'avoid'],
  tech: ['aspect', 'duration', 'vaudio'],
  aspects: opts(['16:9', '9:16', '1:1', '21:9', '4:3'], 'field.aspect'),
  durations: opts(['5s', '10s', '15s', '20s'], 'field.duration'),
  negative: {
    mode: 'field',
    label: 'Negative prompt',
    note: 'delete this block if your model has no negative field',
  },
  best: 'Any video model. The five rules Forge applies hold across every model tested.',
  worst: 'Nothing model-specific.',
  notes: [
    'Describe motion over time, not a photograph. This is the number one failure mode on every model.',
    'One camera move per shot. Stacking dolly, orbit and tilt produces mush everywhere.',
    'Cinematic is a null token in 2026. Name the shot instead.',
  ],
  warnings: [
    'If your model is image-to-video, delete everything that re-describes the source still and keep only what changes.',
  ],
  settings: (b) =>
    rows([
      ['Duration', or(b.duration, '5s'), ''],
      ['Aspect', or(b.aspect, '16:9'), ''],
      ['Resolution', 'highest your plan allows', ''],
      ['Motion strength', 'medium', 'If exposed'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://ai.google.dev/gemini-api/docs/video',
      title: 'Generate video with Veo',
      publisher: 'Google',
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
