import type { Model } from '../../types';
import { rows } from '../shared';

export const genericVoice: Model = {
  id: 'generic-voice',
  name: 'Any other voice model',
  version: 'category wildcard',
  category: 'voice',
  wildcard: true,
  blurb:
    'A portable TTS brief: the script marked up for prosody, a voice description, and the settings almost every engine exposes.',
  tags: ['Model-agnostic', 'Prosody markup', 'Portable'],
  grammar: 'tts',
  length: [0, 0],
  core: ['script', 'useCase', 'voiceChar'],
  craft: ['vTone', 'vTexture', 'vArch', 'lang'],
  tech: [],
  negative: { mode: 'none', note: 'none' },
  best: 'Any TTS engine.',
  worst: 'Nothing model-specific.',
  notes: [
    'Punctuation is prosody on every modern engine. Ellipses hesitate, dashes clip, capitals stress.',
  ],
  warnings: [
    'Bracketed audio tags are an ElevenLabs v3 convention. Strip them if your engine does not document them.',
  ],
  settings: () =>
    rows([
      ['Stability / temperature', 'mid', ''],
      ['Speed', '1.0', ''],
      ['Similarity', 'high', ''],
      ['Sample rate', '44.1kHz', ''],
    ]),
  audioTags: 'always',
  lengthWarningBelow: 250,
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://elevenlabs.io/docs/best-practices/prompting',
      title: 'Prompting best practices',
      publisher: 'ElevenLabs',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
