import type { Model } from '../../types';
import { rows } from '../shared';

export const hume: Model = {
  id: 'hume',
  name: 'Hume Octave',
  version: '2',
  maker: 'Hume AI',
  category: 'voice',
  blurb:
    'Acting instructions as a first-class input, with a documented rule that shorter direction beats longer.',
  tags: ['Acting instructions', '~100ms', '5000 char limit', '11 languages'],
  grammar: 'tts',
  length: [0, 0],
  core: ['script', 'voiceChar'],
  craft: ['vTone', 'vArch', 'lang'],
  tech: [],
  negative: { mode: 'none', note: 'none' },
  best: 'Emotionally precise delivery, character work, direction that changes mid-line.',
  worst: 'The description field is Octave 1 only at time of writing. Verify before relying on it.',
  notes: [
    "Hume's own guidance: keep acting instructions under about 100 characters. 'Frightened, rushed' beats a paragraph.",
    'Precise emotions beat generic ones: melancholy and frustrated, not sad.',
    "Audience context shapes delivery: 'speaking to a child', 'addressing a large crowd'.",
  ],
  warnings: [
    'Speed runs 0.5 to 2.0 and is non-linear. 2.0 does not double the rate.',
    'Limits are 5000 characters of text and 1000 characters of description per utterance.',
  ],
  settings: () =>
    rows([
      ['model', 'octave-2', ''],
      ['speed', '1.0', '0.5–2.0, non-linear'],
      ['trailing_silence', '0.3s', ''],
      ['num_generations', '3', 'Up to 5, then pick'],
      ['instant_mode', 'on for preset voices', ''],
    ]),
  audioTags: 'always',
  actingInstruction: true,
  lengthWarningBelow: 250,
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://dev.hume.ai/docs/text-to-speech-tts/overview',
      title: 'Text-to-speech overview',
      publisher: 'Hume AI',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
