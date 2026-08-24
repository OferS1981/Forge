import type { ModelSpec } from '../../types';
import { or, rows } from '../shared';

export const genericSfx: ModelSpec = {
  id: 'generic-sfx',
  name: 'Any other sound model',
  version: 'category wildcard',
  category: 'sfx',
  wildcard: true,
  blurb:
    'A portable sound-design brief with the source, the space, the capture and the shape of the envelope.',
  tags: ['Model-agnostic', 'Foley vocabulary'],
  grammar: 'sfx',
  length: [0, 0],
  core: ['sound', 'sfxKind'],
  craft: ['room', 'mic', 'mood'],
  tech: ['sfxLen', 'sfxLoop'],
  negative: { mode: 'none', note: 'none' },
  best: 'Any text-to-audio model.',
  worst: 'Nothing model-specific.',
  notes: [
    'Name the source, the material it hits, the space it happens in, and how the tail behaves. That is the whole craft.',
  ],
  warnings: ['One event per generation, everywhere. Layer in a DAW.'],
  settings: (b) =>
    rows([
      ['Duration', or(b.sfxLen, '3s'), ''],
      ['Prompt adherence', 'high', ''],
      ['Sample rate', '48kHz', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://elevenlabs.io/docs/capabilities/sound-effects',
      title: 'Sound effects',
      publisher: 'ElevenLabs',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
