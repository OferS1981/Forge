import type { Brief, ModelId } from '@forge/catalog';
import deadweight from '../lessons/deadweight.md';
import lens from '../lessons/lens.md';
import lighting from '../lessons/lighting.md';
import motion from '../lessons/motion.md';
import negatives from '../lessons/negatives.md';
import punctuation from '../lessons/punctuation.md';
import blocked from '../lessons/blocked.md';
import styleWithoutNaming from '../lessons/style-without-naming.md';

/**
 * Eight short lessons, each built from what the glossary already explains plus a live demo brief.
 * The lesson ends with a button that loads that brief into the Build workspace, so the reader does
 * the thing rather than only reading about it.
 */
export interface Lesson {
  slug: string;
  title: string;
  /** One line, for the index. */
  standfirst: string;
  source: string;
  /** What the try-it button loads, and where. */
  demo: { model: ModelId; brief: Brief; what: string };
}

export const LESSONS: readonly Lesson[] = [
  {
    slug: 'lens',
    title: 'What a lens actually changes',
    standfirst:
      'A focal length decides the geometry of the picture before anything else in the prompt gets a say.',
    source: lens,
    demo: {
      model: 'midjourney',
      what: 'a portrait brief with an 85mm lens and a wide aperture already chosen',
      brief: {
        subject: 'A retired boxer taping his hands',
        setting: 'Basement gym at 6am',
        medium: 'photograph',
        lens: '85mm portrait',
        aperture: 'f/2.8',
      },
    },
  },
  {
    slug: 'lighting',
    title: 'Why lighting is the highest-yield thing in an image prompt',
    standfirst:
      'If you can only add one clause to a prompt, add the light. Nothing else moves the result as far for as few words.',
    source: lighting,
    demo: {
      model: 'midjourney',
      what: 'the same subject with a named key light and a rim light',
      brief: {
        subject: 'A retired boxer taping his hands',
        setting: 'Basement gym at 6am',
        medium: 'photograph',
        light: ['softbox key camera-left', 'rim light separation'],
      },
    },
  },
  {
    slug: 'negatives',
    title: 'Why negative prompts work on some models and not others',
    standfirst:
      'Whether an exclusion does anything depends entirely on how the model was built. Getting it wrong wastes generations.',
    source: negatives,
    demo: {
      model: 'sdxl',
      what: 'a brief on a model with a real negative field, so you can see the block it produces',
      brief: {
        subject: 'A retired boxer taping his hands',
        setting: 'Basement gym at 6am',
        medium: 'photograph',
        avoid: 'watermarks, other people, text',
      },
    },
  },
  {
    slug: 'motion',
    title: 'How to write motion for a video model',
    standfirst:
      'The most common failure in video prompting produces a beautiful still that drifts for five seconds.',
    source: motion,
    demo: {
      model: 'veo',
      what: 'a video brief written as three beats over time, with one camera move',
      brief: {
        subject: 'A retired boxer taping his hands',
        action: 'He finishes taping, flexes the fist, then looks up at the camera',
        setting: 'Basement gym at 6am',
        camMove: 'slow dolly in',
        motion: ['steam rising'],
      },
    },
  },
  {
    slug: 'punctuation',
    title: 'How to direct a voice with punctuation',
    standfirst:
      'Speech models do not read stage directions. They read the text, and the punctuation is the real prosody control.',
    source: punctuation,
    demo: {
      model: 'el-tts',
      what: 'a script written with the pauses in it, on a speech model',
      brief: {
        script:
          'There is a moment... right before the bell... when the noise drops away. You can hear your own breathing. And then it starts.',
        useCase: 'Trailer / hype VO',
        voiceChar: 'British man, late fifties, gravelled and unhurried',
        vTone: ['weary', 'conspiratorial'],
      },
    },
  },
  {
    slug: 'deadweight',
    title: 'Why masterpiece, 8k stopped working',
    standfirst:
      'It genuinely helped in 2022. It does not now, and on some models it actively hurts.',
    source: deadweight,
    demo: {
      model: 'midjourney',
      what: 'a brief with the filler replaced by a lens, a light and a grade',
      brief: {
        subject: 'A retired boxer taping his hands',
        setting: 'Basement gym at 6am',
        medium: 'photograph',
        lens: '85mm portrait',
        light: ['softbox key camera-left'],
        grade: 'desaturated earth tones',
      },
    },
  },
  {
    slug: 'blocked',
    title: 'Why your prompt got blocked, and which of seven layers did it',
    standfirst:
      'Seven independent gates can refuse you, they fail differently, and applying the wrong fix is why people go in circles.',
    source: blocked,
    demo: {
      model: 'gptimage',
      what: 'a surgical scene with the register named, so the classifier reads it as the clinical work it is',
      brief: {
        subject: 'A surgeon closing a 4 cm incision with interrupted sutures',
        setting: 'A teaching-hospital operating theatre',
        medium: 'illustration',
        purpose: 'A clinical reference figure for a nursing textbook',
      },
    },
  },
  {
    slug: 'style-without-naming',
    title: 'How to get a look without naming an artist',
    standfirst:
      'A name gives you one dial you cannot turn. The decomposition gives you nine you can, and it is the safer prompt for free.',
    source: styleWithoutNaming,
    demo: {
      model: 'nanobanana',
      what: 'the fox from the worked example, fully decomposed into independent dials',
      brief: {
        subject: 'A fox mid-stride between birch trunks',
        medium: 'gouache and coloured pencil on cold-press paper, visible tooth in the flat areas',
        palette: 'limited palette of burnt sienna, sage and bone, one saturated vermilion accent',
        comp: 'cropped tight, generous negative space at the top of the frame',
        light: ['flat compressed space, no cast shadows, forms separated by outline weight'],
        mood: ['quiet', 'warm'],
      },
    },
  },
];

export function lessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}
