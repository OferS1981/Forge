import type { ModelSpec } from '../../types';
import { or, rows } from '../shared';

/** Preset table by use case: model, stability, similarity, style, speed. */
const TTS_PRESETS: Record<string, readonly [string, string, string, string, string]> = {
  'Corporate narration': ['eleven_multilingual_v2', '0.55', '0.75', '0.05', '1.00'],
  Audiobook: ['eleven_multilingual_v2', '0.65', '0.80', '0.00', '0.98'],
  'Ad / commercial read': ['eleven_multilingual_v2', '0.42', '0.80', '0.25', '1.05'],
  'Trailer / hype VO': ['eleven_v3 (Creative)', 'Creative', '0.80', '0.50', '0.92'],
  'Character acting': ['eleven_v3 (Creative)', 'Creative', '0.68', '0.55', '1.00'],
  'Conversational agent': ['eleven_flash_v2_5', '0.50', '0.75', '0.00', '1.00'],
  'E-learning / IVR': ['eleven_flash_v2_5', '0.72', '0.75', '0.00', '0.98'],
  'Meditation / ASMR': ['eleven_multilingual_v2', '0.68', '0.85', '0.00', '0.80'],
};

export const elTts: ModelSpec = {
  id: 'el-tts',
  name: 'ElevenLabs',
  sub: 'Speech',
  version: 'v3 / multilingual v2 / flash v2.5',
  maker: 'ElevenLabs',
  category: 'voice',
  blurb:
    'Three different models under one product. Forge picks the right one for the job and writes the delivery direction into the script itself.',
  tags: [
    'Audio tags in-text',
    'Stability & style sliders',
    'Break tags on v2 only',
    '70+ languages',
  ],
  grammar: 'tts',
  length: [0, 0],
  core: ['script', 'useCase', 'voiceChar'],
  craft: ['vTone', 'vTexture', 'vArch', 'lang', 'avoid'],
  tech: [],
  negative: {
    mode: 'none',
    note: 'there is no negative prompt. Delivery is controlled by tags, punctuation and the sliders',
  },
  best: 'Expressive long-form narration, character acting, audiobooks, seventy-plus languages, multi-speaker dialogue in a single pass.',
  worst:
    'Very short inputs are unstable. It is not a general SSML engine: only break, phoneme and lexeme tags exist.',
  notes: [
    'v3 documents that ellipses add pauses and weight, capitalisation increases emphasis, and standard punctuation gives natural rhythm. Punctuate the script like the read you want.',
    'v3 takes inline audio tags like [whispers], [sighs], [sarcastic], and interprets natural-language direction inside brackets.',
    'Ellipses add hesitation and weight, dashes make short pauses, CAPITALS carry stress. That is the real prosody control.',
    'Under 250 characters gets inconsistent output. Give it a full paragraph even if you only need one line.',
  ],
  warnings: [
    'v3 does not support break tags. Use tags, punctuation and line structure instead.',
    'The phoneme tag only works on eleven_flash_v2: not on multilingual v2, not on v3. On v3 use inline IPA between forward slashes.',
    "Flash mangles currency and numbers. Write out '£1,000,000' as words before sending it to Flash.",
    'Turbo no longer exists. Any legacy eleven_turbo preset maps to eleven_flash_v2_5.',
  ],
  settings: (b) => {
    const u = or(b.useCase, 'Corporate narration');
    const P = TTS_PRESETS[u] ??
      TTS_PRESETS['Corporate narration'] ?? [
        'eleven_multilingual_v2',
        '0.55',
        '0.75',
        '0.05',
        '1.00',
      ];
    return rows([
      [
        'model_id',
        P[0],
        'v3 for expression, multilingual v2 for long-form stability, flash v2.5 for latency',
      ],
      ['Stability', P[1], 'Lower widens emotional range. v3 is a three-way enum, not a slider'],
      ['Similarity boost', P[2], 'Too high on a noisy clone reproduces the noise'],
      ['Style exaggeration', P[3], 'Any value above 0 adds latency and compute'],
      ['Speed', P[4], '0.7–1.2. Extremes degrade quality'],
      ['Speaker boost', 'on', ''],
      [
        'apply_text_normalization',
        P[0].includes('flash') ? 'on' : 'auto',
        'Force it on for Flash: it misreads currency',
      ],
      [
        'previous_text / next_text',
        'stitch adjacent chunks',
        'How you stop drift across a long piece',
      ],
    ]);
  },
  audioTags: 'creative-only',
  lengthWarningBelow: 250,
  pairsWith: [],
  betterFor: [],
  strengthTags: [
    { tag: 'native-audio', weight: 2 },
    { tag: 'speed-cost', weight: 1 },
    { tag: 'non-english-text', weight: 2 },
  ],
  sources: [
    {
      url: 'https://elevenlabs.io/docs/product-guides/voices/voice-cloning',
      title: 'Voice cloning',
      publisher: 'ElevenLabs',
    },
    {
      url: 'https://elevenlabs.io/docs/best-practices/prompting/eleven-v3',
      title: 'Prompting Eleven v3',
      publisher: 'ElevenLabs',
    },
    {
      url: 'https://elevenlabs.io/docs/capabilities/text-to-speech',
      title: 'Text to speech',
      publisher: 'ElevenLabs',
    },
    {
      url: 'https://elevenlabs.io/docs/best-practices/prompting',
      title: 'Prompting best practices',
      publisher: 'ElevenLabs',
    },
  ],
  verifiedOn: '2026-08-24',
};
