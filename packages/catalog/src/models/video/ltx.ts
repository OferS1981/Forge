import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const ltx: Model = {
  id: 'ltx',
  name: 'LTX-2',
  version: '2.3',
  maker: 'Lightricks',
  category: 'video',
  blurb:
    'Genuinely open weights, native 4K, and the only model here that exposes 48 and 50fps. Built as a shot-list platform.',
  tags: ['Open weights', '4K native', '24/25/48/50fps', 'Lip sync'],
  grammar: 'shotlist',
  length: [50, 160],
  core: ['subject', 'action', 'setting', 'purpose'],
  craft: ['camMove', 'shot', 'lens', 'light', 'motion', 'pacing', 'grade', 'mood', 'ref', 'avoid'],
  tech: ['aspect', 'duration', 'shots', 'vaudio'],
  aspects: opts(['16:9', '9:16', '1:1', '2.39:1'], 'field.aspect'),
  durations: opts(['5s', '10s', '20s'], 'field.duration'),
  negative: { mode: 'field', label: 'Negative prompt', note: 'supported' },
  best: 'End-to-end narrative production, local and self-hosted work, true frame-rate control, lip sync, cost-free at scale.',
  worst: 'Raw per-shot fidelity trails Seedance and Kling.',
  notes: [
    'LTX Studio is built around a shot list and @Element references, so Forge writes per-shot rather than one paragraph.',
    'Retake regenerates a 2–16 second segment without a full reshoot. It is the correct fix for one bad beat.',
    'The 48 and 50fps options are a real differentiator for sports and for PAL broadcast conform.',
  ],
  warnings: [
    '@Element tags only resolve inside LTX Studio projects. They are meaningless in a raw LTX-2 API call.',
    'Free use is capped by a revenue threshold, not by feature. Check it before commercial deployment.',
  ],
  settings: (b) =>
    rows([
      ['Model', 'LTX-2.3', ''],
      ['Resolution', '4K', 'Native, not upscaled'],
      ['Frame rate', '24', '48 or 50 for high motion and PAL'],
      ['Duration', or(b.duration, '10s'), 'Up to 20s'],
      ['Audio', '24kHz stereo, single pass', 'Generated with the video, not dubbed after'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'long-clip', weight: 2 },
    { tag: 'native-audio', weight: 2 },
    { tag: 'open-weights', weight: 3 },
  ],
  sources: [
    { url: 'https://docs.ltx.studio/', title: 'LTX Studio documentation', publisher: 'Lightricks' },
    {
      url: 'https://github.com/Lightricks/LTX-2',
      title: 'LTX-2 repository',
      publisher: 'Lightricks',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
