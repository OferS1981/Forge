import type { Model } from '../../types';
import { opts, or, rows } from '../shared';

export const higgsfield: Model = {
  id: 'higgsfield',
  name: 'Higgsfield',
  version: 'Cinema Studio 3.0',
  maker: 'Higgsfield',
  category: 'video',
  blurb: 'Sixty-three named camera presets and a prompt-adherence dial almost nobody else exposes.',
  tags: ['63 camera presets', 'cfg_scale 0–1', 'Speed ramps', 'Aggregator'],
  grammar: 'prose',
  length: [40, 140],
  core: ['subject', 'action', 'setting', 'purpose'],
  craft: ['camMove', 'shot', 'lens', 'light', 'motion', 'pacing', 'grade', 'mood', 'ref', 'avoid'],
  tech: ['aspect', 'duration', 'vaudio'],
  aspects: opts(['auto', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'], 'field.aspect'),
  durations: opts(['4s', '8s', '12s', '15s'], 'field.duration'),
  negative: { mode: 'field', label: 'Negative prompt', note: 'supported' },
  best: 'Named camera moves you can rely on, ad and marketing formats, motion transfer, access to many models behind one interface.',
  worst: 'Most presets are image-to-video only and require an uploaded still.',
  notes: [
    'The preset library is the reason to be here: Bullet Time, Crash Zoom In, Snorricam, Super Dolly In, Through Object In, 360 Orbit, Whip Pan, YoYo Zoom and more.',
    'cfg_scale is exposed here and almost nowhere else. Around 0.3 gives the model creative latitude, around 0.8 gives literal adherence and stiffer motion.',
  ],
  warnings: [
    'It is an aggregator. The same prompt hits a different underlying model depending on what you selected: branch your prompt on the real model.',
    'Camera presets generally need a start image.',
  ],
  settings: (b) =>
    rows([
      ['Model', 'Cinema Studio 3.0', ''],
      ['Aspect ratio', or(b.aspect, 'auto'), ''],
      /*
       * The named preset from the library its own note lists, chosen from the camera move, rather
       * than the shrug "nearest named preset" that told nobody which one to click.
       */
      [
        'Camera preset',
        /dolly|push/i.test(b.camMove ?? '')
          ? 'Super Dolly In'
          : /arc|orbit/i.test(b.camMove ?? '')
            ? '360 Orbit'
            : /whip/i.test(b.camMove ?? '')
              ? 'Whip Pan'
              : /zoom/i.test(b.camMove ?? '')
                ? 'Crash Zoom In'
                : 'General',
        '63 named moves',
      ],
      ['cfg_scale', '0.6', '0.3 creative, 0.8 literal'],
      ['duration', or(b.duration, '8s'), '4–15s'],
      ['genre', 'auto', 'action, horror, comedy, noir, drama, epic'],
      ['generate_audio', b.vaudio ? 'true' : 'false', ''],
    ]),
  vertical: 'strong',
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://docs.higgsfield.ai/',
      title: 'Higgsfield API documentation',
      publisher: 'Higgsfield',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
