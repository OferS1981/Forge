import { has } from '../compose/text';
import type { Brief, FieldId, Model } from '../types';
import type { Question } from './clarify';

/**
 * Plan mode: the full interview, for the person who wants to think it through.
 *
 * Where clarify() taps you on the shoulder with at most three questions, plan() sits down with
 * you and walks the whole brief in the order a professional would ask it: what it is, then the
 * context that shapes it, then the craft that finishes it. Still not a chat, still deterministic,
 * still a field behind every question. Answered fields never get asked; the interview shrinks as
 * the brief grows, and when it reaches zero the plan is complete.
 */

interface Step {
  field: FieldId;
  ask: string;
  why: string;
}

const SCRIPTS: Record<Model['category'], Step[]> = {
  image: [
    {
      field: 'subject',
      ask: 'What is the one thing this image is about?',
      why: 'The first clause carries the most weight on every model.',
    },
    {
      field: 'medium',
      ask: 'What is it made of: a photograph, a painting, line art?',
      why: 'The medium decides which craft questions even apply.',
    },
    {
      field: 'setting',
      ask: 'Where and when is this happening?',
      why: 'A place and a time of day are half the lighting brief.',
    },
    {
      field: 'purpose',
      ask: 'What is the image for?',
      why: 'A hero image and an editorial spread want different compositions, and naming the register helps a classifier read you right.',
    },
    {
      field: 'mood',
      ask: 'What should it feel like?',
      why: 'One named mood beats three adjectives doing severity work.',
    },
    {
      field: 'ref',
      ask: 'Is there a look you are steering toward: an era, a movement, a technique?',
      why: 'Attributes travel between models; names of living artists get refused or stripped.',
    },
    {
      field: 'avoid',
      ask: 'Anything that must not appear?',
      why: 'On models with a real negative field this steers; on the rest Forge phrases it positively for you.',
    },
  ],
  video: [
    {
      field: 'subject',
      ask: 'Who or what is this shot about?',
      why: 'The subject anchors every frame of the clip.',
    },
    {
      field: 'action',
      ask: 'What happens, from first frame to last?',
      why: 'Video models follow written action beats more than adjectives.',
    },
    {
      field: 'setting',
      ask: 'Where and when does it happen?',
      why: 'A place and a time of day are half the lighting brief.',
    },
    {
      field: 'duration',
      ask: 'How long is the clip?',
      why: 'The action has to fit the seconds, and pacing is written against them.',
    },
    {
      field: 'purpose',
      ask: 'Where will this be seen?',
      why: 'A vertical story and a hero loop are framed differently from the first shot.',
    },
    {
      field: 'camMove',
      ask: 'Does the camera move, and how?',
      why: 'One deliberate move reads as intent; an unspecified camera drifts.',
    },
    {
      field: 'avoid',
      ask: 'Anything that must not appear?',
      why: 'Cheaper to say now than to regenerate later.',
    },
  ],
  voice: [
    {
      field: 'script',
      ask: 'What exactly should be said, word for word?',
      why: 'The script is the prompt: it is carried verbatim, never edited.',
    },
    {
      field: 'voiceChar',
      ask: 'Who is speaking: describe the voice like a casting note.',
      why: 'Age, texture and register cast the voice; a name cannot be used, a description can.',
    },
    {
      field: 'useCase',
      ask: 'What is this recording for?',
      why: 'Narration, ads and IVR sit at different energies before a word is read.',
    },
    {
      field: 'vTone',
      ask: 'How should it be delivered?',
      why: 'Tone words steer delivery on every voice model.',
    },
  ],
  sfx: [
    {
      field: 'sound',
      ask: 'What does it sound like, described as an event?',
      why: 'A sound described as a moment beats a sound described as a category.',
    },
    {
      field: 'sfxKind',
      ask: 'What kind of sound is this: foley, ambience, an interface cue?',
      why: 'The kind sets length, layering and loudness expectations.',
    },
    {
      field: 'room',
      ask: 'What space is it in?',
      why: 'The acoustic is half the sound: a booth is dry, a cathedral answers back.',
    },
    {
      field: 'sfxLen',
      ask: 'How long, and does it loop?',
      why: 'Loops need seamless ends; one-shots need a clean tail.',
    },
  ],
  music: [
    {
      field: 'mGenre',
      ask: 'What tradition does this sit in, or between?',
      why: 'Genre is the strongest single steer on every music model.',
    },
    {
      field: 'mMood',
      ask: 'What should it feel like?',
      why: 'Mood plus genre does more than either alone.',
    },
    {
      field: 'mInst',
      ask: 'What instruments carry it?',
      why: 'Naming the instrumentation is how you keep the kitchen sink out.',
    },
    {
      field: 'mVocal',
      ask: 'Vocals or instrumental, and what kind of voice?',
      why: 'The vocal decision changes the whole arrangement.',
    },
    {
      field: 'mBpm',
      ask: 'How fast: a BPM, or a feel?',
      why: 'Tempo anchors the energy before any adjective does.',
    },
    {
      field: 'mStruct',
      ask: 'How is it built: intro, verses, a drop, an outro?',
      why: 'Models that support sections follow a written arrangement.',
    },
  ],
  text: [
    {
      field: 'goal',
      ask: 'What should exist when this is done?',
      why: 'A deliverable, not a topic: the difference between an essay and an answer.',
    },
    {
      field: 'context',
      ask: 'What does the writer need to know first?',
      why: 'Context is the difference between generic and yours.',
    },
    {
      field: 'format',
      ask: 'What shape should the answer take?',
      why: 'A named format saves a rewrite: memo, table, thread, brief.',
    },
    {
      field: 'length',
      ask: 'How long should it be?',
      why: 'Length is a constraint models actually respect when told.',
    },
    {
      field: 'role',
      ask: 'Who should the model be while writing?',
      why: 'A role sets vocabulary, caution and taste in one line.',
    },
  ],
  code: [
    {
      field: 'cTask',
      ask: 'What exactly needs to change or exist?',
      why: 'One task, stated as an outcome, keeps the agent off side quests.',
    },
    {
      field: 'cCheck',
      ask: 'How will we know it worked?',
      why: 'Without a stated check the agent decides for itself what done means, and it is generous to itself.',
    },
    {
      field: 'cStack',
      ask: 'What is it built on?',
      why: 'An agent that has to guess the stack guesses the idioms too.',
    },
    {
      field: 'cScope',
      ask: 'What must this change leave alone?',
      why: 'A scope fence is the difference between a fix and a surprise refactor.',
    },
    {
      field: 'cPattern',
      ask: 'Is there existing code it should imitate?',
      why: 'Pointing at a pattern beats describing a style.',
    },
  ],
  app: [
    {
      field: 'aApp',
      ask: 'What is the app, in one sentence?',
      why: 'The first line decides what the builder thinks it is making.',
    },
    {
      field: 'aScreens',
      ask: 'What is in this pass, and only this pass?',
      why: 'Builders that are not fenced build the whole company.',
    },
    {
      field: 'aData',
      ask: 'What are the things it stores, and how do they relate?',
      why: 'A named data model is the difference between an app and a demo.',
    },
    {
      field: 'aStyle',
      ask: 'What should it look and feel like?',
      why: 'Use design vocabulary: weight, spacing, radius, not vibes.',
    },
  ],
  research: [
    {
      field: 'rQuestion',
      ask: 'What is the question, asked as a question?',
      why: 'A question gets an answer; a topic gets an essay.',
    },
    {
      field: 'rScope',
      ask: 'What is in scope, and what is explicitly out?',
      why: 'Scope is what keeps a report from being about everything.',
    },
    {
      field: 'rDecision',
      ask: 'What decision does this feed?',
      why: 'Research aimed at a decision knows what matters; research aimed at a topic does not.',
    },
    {
      field: 'rFormat',
      ask: 'What shape should the answer arrive in?',
      why: 'A cited brief and a comparison table are different jobs.',
    },
    {
      field: 'rGaps',
      ask: 'What should it do when it cannot find something?',
      why: 'Saying so beats estimating, but only if you ask for that.',
    },
  ],
};

/**
 * The interview for this model and brief: every unanswered step, in asking order, filtered to
 * fields the model actually has. An empty result means the plan is complete.
 */
export function plan(brief: Brief, model: Model): Question[] {
  const script = SCRIPTS[model.category];
  const known = new Set<FieldId>([...model.core, ...model.craft, ...model.tech]);
  return script
    .filter((step) => known.has(step.field))
    .filter((step) => !has(brief[step.field]))
    .map(({ field, ask, why }) => ({ field, ask, why }));
}
