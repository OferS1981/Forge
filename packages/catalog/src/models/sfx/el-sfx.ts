import type { ModelSpec } from '../../types';
import { or, rows } from '../shared';

export const elSfx: ModelSpec = {
  id: 'el-sfx',
  name: 'ElevenLabs',
  sub: 'Sound Effects',
  version: 'eleven_text_to_sound_v2',
  maker: 'ElevenLabs',
  category: 'sfx',
  blurb:
    'One effect per generation, then layer them in an editor. That is the documented workflow, not a limitation.',
  tags: ['0.5–30s', 'prompt_influence 0–1', 'Seamless loop', '48kHz WAV'],
  grammar: 'sfx',
  length: [0, 0],
  core: ['sound', 'sfxKind'],
  craft: ['room', 'mic', 'mood'],
  tech: ['sfxLen', 'sfxLoop'],
  negative: { mode: 'none', note: 'none' },
  best: 'Foley, impacts, ambience beds, UI sounds, musical one-shots and loops.',
  worst:
    'Sequential multi-event prompts. The docs themselves recommend generating each element and layering.',
  notes: [
    "Production language earns its place here: 'high-quality, professionally recorded footsteps on grass, sound effects foley'.",
    'The terms the model knows are impact, whoosh, ambience, braam, glitch, drone, one-shot, loop, stem, foley.',
    "Musical one-shots work well: '90s hip-hop drum loop, 90 BPM', 'vintage brass stabs in F minor'.",
  ],
  warnings: [
    'prompt_influence defaults to 0.3, which is deliberately loose. Raise it toward 0.8 when you need literal.',
    'Loop only works on eleven_text_to_sound_v2, and WAV at 48kHz is non-looping only.',
  ],
  settings: (b) =>
    rows([
      ['model_id', 'eleven_text_to_sound_v2', ''],
      ['duration_seconds', or(b.sfxLen, 'leave unset'), '0.5–30. Unset lets the model infer it'],
      ['prompt_influence', '0.45', '0.3 is default and loose. Higher is literal'],
      ['loop', b.sfxLoop === 'Yes' ? 'true' : 'false', 'v2 only'],
      ['output_format', b.sfxLoop === 'Yes' ? 'mp3' : 'wav 48kHz', 'WAV is non-looping only'],
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
