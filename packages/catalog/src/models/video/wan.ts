import type { ModelSpec } from '../../types';
import { opts, or, rows } from '../shared';

export const wan: ModelSpec = {
  id: 'wan',
  name: 'Wan',
  version: '2.6 / 2.7',
  maker: 'Alibaba',
  category: 'video',
  blurb:
    'Two very different models under one name. 2.6 is open-weight and rewards keyword density; 2.7 is closed and rewards intent.',
  tags: ['2.6 open weights', '2.7 Thinking Mode', '12 languages', 'Slow'],
  grammar: 'prose',
  // Its own note, below: 2.7's Thinking Mode rewards intent-level narrative prompts. The entry
  // targets 2.7; the 2.6 note stays for anyone pinned there.
  prose: 'narrative',
  length: [40, 140],
  core: ['subject', 'action', 'setting', 'purpose'],
  craft: ['camMove', 'shot', 'lens', 'light', 'motion', 'pacing', 'grade', 'mood', 'ref', 'avoid'],
  tech: ['aspect', 'duration'],
  aspects: opts(['16:9', '9:16', '1:1', '4:3', '3:4'], 'field.aspect'),
  durations: opts(['5s', '10s', '15s'], 'field.duration'),
  negative: { mode: 'field', label: 'Negative prompt', note: 'supported' },
  best: 'Open-weight local deployment on 2.6, stylised and experimental output, multilingual audio.',
  worst: 'Speed. Around four minutes for a five-second clip on 2.7.',
  notes: [
    "2.7's Thinking Mode builds a compositional blueprint before generating, so it rewards intent-level narrative prompts: state what the scene means.",
    '2.6 is a classic diffusion model and rewards the opposite: dense, keyword-stacked description.',
  ],
  warnings: [
    'Wan is no longer simply open source. 2.7 is closed-weights and API-only. Pin to 2.6 if you need local.',
    'Four-minute generations will time out synchronous request patterns. Use polling or webhooks.',
  ],
  settings: (b) =>
    rows([
      ['Version', '2.7', '2.6 if you need open weights'],
      ['Thinking Mode', 'on', '2.7 only'],
      ['duration', or(b.duration, '5s'), '2–15s'],
      ['resolution', '1080p', ''],
      ['aspect', or(b.aspect, '16:9'), ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [{ tag: 'open-weights', weight: 2 }],
  sources: [
    {
      url: 'https://www.alibabacloud.com/help/en/model-studio/video-generation',
      title: 'Video generation (Wan)',
      publisher: 'Alibaba Cloud',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
