import type { Model } from '../../types';
import { rows } from '../shared';

export const cartesia: Model = {
  id: 'cartesia',
  name: 'Cartesia Sonic',
  version: '3.6',
  maker: 'Cartesia',
  category: 'voice',
  blurb:
    'Sub-90ms first audio and currently top of both Artificial Analysis speech boards. Built for realtime agents.',
  tags: ['<90ms TTFA', 'Inline expression tags', '10s cloning', 'IPA dictionaries'],
  grammar: 'tts',
  length: [0, 0],
  core: ['script', 'useCase', 'voiceChar'],
  craft: ['vTone', 'vTexture', 'lang'],
  tech: [],
  negative: { mode: 'none', note: 'none' },
  best: 'Realtime voice agents, telephony, code-switching, alphanumerics like order and phone numbers.',
  worst: 'Beta API, no open weights, smaller voice library than ElevenLabs.',
  notes: [
    'Cartesia documents concrete transcript rules: end every transcript with punctuation, insert a dash or a break tag where you need a pause, write dates as MM/DD/YYYY, and put a space between a time and AM or PM.',
    'Emotion, speed and volume are API parameters here rather than prompt text, which makes them deterministic.',
    'Custom pronunciation dictionaries with IPA overrides are the reliable fix for brand names.',
  ],
  warnings: ['Sonic-2, Sonic-turbo and older snapshots sunset after 20 October 2026. Pin to 3.6.'],
  settings: () =>
    rows([
      ['model', 'sonic-3.6', ''],
      ['emotion', 'match the tone chips', 'API parameter, not prompt text'],
      ['speed', 'normal', ''],
      ['sample_rate', '44100', '8k–44.8k supported'],
      ['Pronunciation dictionary', 'add brand names', 'IPA overrides'],
    ]),
  audioTags: 'always',
  lengthWarningBelow: 250,
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://docs.cartesia.ai/build-with-cartesia/formatting-text-for-sonic-2/best-practices',
      title: 'Formatting text for Sonic',
      publisher: 'Cartesia',
    },
    { url: 'https://docs.cartesia.ai/', title: 'Cartesia documentation', publisher: 'Cartesia' },
  ],
  verifiedOn: '2026-08-24',
  unverified: true,
};
