import type { ModelSpec } from '../../types';
import { rows } from '../shared';

export const elVoicedesign: ModelSpec = {
  id: 'el-voicedesign',
  name: 'ElevenLabs',
  sub: 'Voice Design',
  version: 'eleven_ttv_v3',
  maker: 'ElevenLabs',
  category: 'voice',
  blurb:
    'Invents a voice from a description. The description has a documented shape, and following it is most of the quality.',
  tags: ['Locale first', 'Quality ladder', 'No FX words', 'Preview text matters'],
  grammar: 'voicedesign',
  length: [0, 0],
  core: ['voiceChar', 'vArch', 'lang'],
  craft: ['vTone', 'vTexture', 'script'],
  tech: [],
  negative: { mode: 'none', note: 'none' },
  best: 'Original characters, brand voices, narrators that must not sound like a stock voice.',
  worst:
    'It models the voice, not the space. Anything about the room belongs in the mix, not the prompt.',
  notes: [
    'The documented shape is: native language, then gender and age, then audio quality, then persona in a few words, then emotion, then a sentence on timbre and pacing. Forge writes that order.',
    'Order that works: native language and locale, gender and age, quality descriptor, persona in two to five words, two or three emotion adjectives, then timbre and pacing.',
    'The official quality ladder is Ok, Good, Very good, Excellent, Studio, Broadcast. Naming a rung genuinely changes the output.',
    'Longer preview text gives more stable and expressive results, and it must agree with the description.',
  ],
  warnings: [
    'Never use audio-FX words like reverb, echo or delay here. Voice Design models the voice, not the acoustics. This is the opposite of Sound Effects and Music.',
    "Do not write 'accent' when you mean intonation. Name the actual dialect.",
  ],
  settings: () =>
    rows([
      ['model_id', 'eleven_ttv_v3', 'eleven_multilingual_ttv_v2 for the 29-language v2 path'],
      ['guidance_scale', 'higher for adherence', 'Lower gives the model more creative freedom'],
      ['loudness', 'default', ''],
      ['Preview text', 'use the script field', 'Longer previews are more stable'],
      ['seed', 'fix once you like one', 'The only way to get the same voice twice'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://elevenlabs.io/docs/product-guides/voices/voice-cloning',
      title: 'Voice cloning',
      publisher: 'ElevenLabs',
    },
    {
      url: 'https://elevenlabs.io/docs/eleven-creative/voices/voice-design',
      title: 'Voice design',
      publisher: 'ElevenLabs',
    },
    {
      url: 'https://elevenlabs.io/docs/capabilities/voice-design',
      title: 'Voice design',
      publisher: 'ElevenLabs',
    },
  ],
  verifiedOn: '2026-08-24',
};
