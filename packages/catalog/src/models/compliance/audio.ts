import type { Compliance } from '../../types';
import { CHECKED, src, unresearched, wildcard } from './shared';
import { googleImage, stability } from './image';

/** Manual sections 6.7 and 6.8. */

const EL_CLONING = src(
  'https://elevenlabs.io/docs/product-guides/voices/voice-cloning',
  'Voice cloning',
  'ElevenLabs',
);
const EL_MUSIC_TERMS = src('https://elevenlabs.io/music-terms', 'Music terms', 'ElevenLabs');

/** The ElevenLabs voice sheet, shared by speech, design, dubbing and effects. */
const elevenlabsVoice: Compliance = {
  policy: {
    policyUrl: 'https://elevenlabs.io/docs/product-guides/voices/voice-cloning',
    tripLines: [
      "Cloned voices may only be of yourself: even with consent you cannot clone someone else's voice, and professional clones are verified by reading lines aloud (the Voice Captcha).",
      'You may not impersonate "political candidates or elected government officials, regardless of whether authorization was obtained". Consent does not cure this one.',
      'No-Go Voices blocks specific high-risk clones outright, and deceased people have their own rules.',
    ],
    artistNames: 'unpublished',
    publicFigures: 'blocked',
    optOutRegistry: false,
    minors: 'Not separately published; the consent regime applies to every real voice.',
    politicalContent:
      'Absolute: no impersonating political candidates or elected officials, with or without authorisation.',
    regionalLimits: [],
    sources: [EL_CLONING],
    verifiedOn: CHECKED,
  },
  rights: {
    outputOwner: 'user',
    commercialUse:
      'Yes on paid tiers. Voice Library voices carry their own consent terms, revenue share and a withdrawal path.',
    indemnity: null,
    sources: [EL_CLONING],
    verifiedOn: CHECKED,
    unverified: true,
  },
  provenance: {
    invisible: ['An AI audio classifier for detection'],
    c2pa: true,
    visible: 'none',
    removalProhibited: false,
    euArticle50Ready: true,
    sources: [EL_CLONING],
    verifiedOn: CHECKED,
  },
  refusal: {
    diagnostics: 'A failed Voice Captcha names itself; content refusals carry no codes.',
    appealPath:
      'Support escalation: retry a failed Voice Captcha with the same equipment, tone and delivery as the samples, then escalate. Wrongful bans are disputed through support.',
    vendorGuidance:
      'For a real voice, the only clean path is your own or documented consent. For a character, describe an invented voice instead: that is the compliant route and the better prompt.',
    sources: [EL_CLONING],
    verifiedOn: CHECKED,
  },
};

/** The music model adds the contractual prohibited-input list, which is the hardest rule in the catalogue. */
const elevenlabsMusic: Compliance = {
  ...elevenlabsVoice,
  policy: {
    ...elevenlabsVoice.policy,
    policyUrl: 'https://elevenlabs.io/music-terms',
    tripLines: [
      "The terms enumerate what you may not submit as input: any artist's or songwriter's real or stage name, living or deceased; any song title; any album title; any music publisher's or label's name; and lyrics substantial enough that a reasonable person would read the prompt as referencing a particular song.",
      'You may not prompt it to "replicate or mimic the voice, likeness, or identifiable characteristics of any recording artist".',
      'Licensed at launch through Merlin and Kobalt; no major-label suit.',
    ],
    artistNames: 'refused',
    sources: [EL_MUSIC_TERMS],
    verifiedOn: CHECKED,
  },
  rights: {
    ...elevenlabsVoice.rights,
    sources: [EL_MUSIC_TERMS],
  },
};

const cartesiaCompliance: Compliance = {
  policy: {
    policyUrl: '',
    tripLines: [
      'An absolute rule on political figures, like ElevenLabs: impersonation is barred regardless of authorisation.',
    ],
    artistNames: 'unpublished',
    publicFigures: 'blocked',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent:
      'Absolute: no impersonating political candidates or officials, consent or not.',
    regionalLimits: [],
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  rights: {
    outputOwner: 'user',
    commercialUse:
      'You own the output on paid tiers; the full terms were partly behind a login during research.',
    indemnity: null,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  provenance: {
    invisible: [],
    c2pa: false,
    visible: 'none',
    removalProhibited: false,
    euArticle50Ready: false,
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
  refusal: {
    appealPath: null,
    vendorGuidance: 'Not published. Sonic-2 and older snapshots sunset on 20 October 2026.',
    sources: [],
    verifiedOn: CHECKED,
    unverified: true,
  },
};

/** Manual section 6.8: Suno after the Warner settlement and the GEMA loss. */
const SUNO_RESPONSIBLE = src(
  'https://suno.com/blog/building-the-future-of-music-responsibly',
  'Building the future of music responsibly',
  'Suno',
);

const sunoCompliance: Compliance = {
  policy: {
    policyUrl: 'https://suno.com/blog/building-the-future-of-music-responsibly',
    tripLines: [
      'An artist name is not a block here, it is a silently deleted token: "the system removes the artist name and redirects toward musical descriptors instead". Your prompt quietly becomes worse and you never find out why.',
      'Suno "has never permitted prompts requesting specific artists or copyrighted songs"; artist names were deliberately excluded from training metadata.',
      'Screening runs through Audible Magic for audio and Musixmatch for lyrics.',
    ],
    artistNames: 'stripped',
    publicFigures: 'unpublished',
    optOutRegistry: false,
    minors: 'Not published.',
    politicalContent: 'Deceptive audio is barred; no specific political rule is published.',
    regionalLimits: [],
    sources: [SUNO_RESPONSIBLE],
    verifiedOn: CHECKED,
  },
  rights: {
    outputOwner: 'tier-dependent',
    ownershipNote:
      'Pro and Premier get an assignment of Suno\'s rights in output "generated during your paid subscription", with an express disclaimer that no copyright is warranted to vest. Free and Basic is lawful, personal, non-commercial use only, with attribution. Remixes are jointly owned. The ownership language shifted after the Warner settlement and is live ambiguity: the terms of service assignment clause is controlling.',
    commercialUse: 'Paid tiers only, and only for output generated during the paid term.',
    exportEntitlement:
      'The trap is retroactive: from 3 September 2026, downloads are capped at 7 lifetime on free and non-commercial, 20 a month on Pro, 60 on Premier, and the caps apply to songs created before that date. Music stays playable on Suno on every plan; getting the file out is what is gated, and entitlements are plan-current, not vintage-based.',
    indemnity: null,
    sources: [SUNO_RESPONSIBLE],
    verifiedOn: CHECKED,
    unverified: true,
  },
  provenance: {
    invisible: ['Audio watermarking rolling out'],
    c2pa: true,
    visible: 'none',
    removalProhibited: false,
    euArticle50Ready: true,
    sources: [SUNO_RESPONSIBLE],
    verifiedOn: CHECKED,
  },
  refusal: {
    appealPath: null,
    vendorGuidance:
      'If the output ignores your style, check for a stripped name first: describe genre, era, instrumentation, tempo, vocal timbre and production instead. The compliant prompt and the better prompt are the same prompt here.',
    sources: [SUNO_RESPONSIBLE],
    verifiedOn: CHECKED,
  },
};

/** Lyria rides the Google sheet; the one audio difference is C2PA, which Lyria audio does not carry. */
const lyriaCompliance: Compliance = {
  ...googleImage,
  provenance: {
    ...googleImage.provenance,
    invisible: ['SynthID on everything'],
    c2pa: false,
    verifiedOn: CHECKED,
  },
};

export const AUDIO_COMPLIANCE = {
  'el-tts': elevenlabsVoice,
  'el-voicedesign': elevenlabsVoice,
  'el-dubbing': elevenlabsVoice,
  cartesia: cartesiaCompliance,
  hume: unresearched('Hume AI'),
  'generic-voice': wildcard('voice'),
  'el-sfx': elevenlabsVoice,
  'generic-sfx': wildcard('sound-effects'),
  'el-music': elevenlabsMusic,
  suno: sunoCompliance,
  lyria: lyriaCompliance,
  stableaudio: stability,
  'generic-music': wildcard('music'),
} as const;
