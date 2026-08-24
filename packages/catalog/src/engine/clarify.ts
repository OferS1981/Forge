import { FIELDS } from '../fields';
import { has } from '../compose/text';
import type { Brief, FieldId, Model } from '../types';

/**
 * The questions a senior asks before starting, worked out from what the brief leaves open.
 *
 * Not a chat: Forge is a catalogue and a form, and these are deterministic questions with a field
 * behind each one, shown before the strike so the answer lands in the brief. The rule for what
 * earns a question is strict, because a wall of questions is a form with extra steps: only the
 * gaps that change the work materially, at most three, most important first.
 */

export interface Question {
  field: FieldId;
  /** The question itself, in the words a person would ask it. */
  ask: string;
  /** Why it matters, one sentence, so answering feels worth it. */
  why: string;
}

interface Rule {
  field: FieldId;
  ask: string;
  why: string;
  when?: (b: Brief) => boolean;
}

const RULES: Partial<Record<Model['category'], Rule[]>> = {
  code: [
    {
      field: 'cCheck',
      ask: 'How will we know it worked?',
      why: 'Without a stated check the agent decides for itself what done means, and it is generous to itself.',
    },
    {
      field: 'cScope',
      ask: 'What must this change leave alone?',
      why: 'A scope fence is the difference between a fix and a surprise refactor.',
    },
    {
      field: 'cStack',
      ask: 'What is it built on?',
      why: 'An agent that has to guess the stack guesses the idioms too.',
    },
  ],
  app: [
    {
      field: 'aScreens',
      ask: 'What is in this pass, and only this pass?',
      why: 'App builders fill silence with screens you did not ask for.',
    },
    {
      field: 'aData',
      ask: 'What are the three or four things this app keeps records of?',
      why: 'The data model decides everything downstream, so it is better said than inferred.',
    },
  ],
  research: [
    {
      field: 'rScope',
      ask: 'What counts, and what is out: which places, which years, which sources?',
      why: 'An unscoped question comes back as a survey of everything and an answer to nothing.',
    },
    {
      field: 'rDecision',
      ask: 'What decision does this feed?',
      why: 'Knowing the decision lets the research prioritise evidence that could change it.',
    },
  ],
  text: [
    {
      field: 'context',
      ask: 'What does the model need to know that it cannot guess?',
      why: 'The context is the difference between a plausible answer and yours.',
    },
    {
      field: 'format',
      ask: 'What shape should the answer take?',
      why: 'A stated format saves the rewrite where the right answer arrived in the wrong shape.',
    },
  ],
  video: [
    {
      field: 'action',
      ask: 'What happens during the clip?',
      why: 'A video prompt without an action is a photograph that lasts eight seconds.',
    },
  ],
  image: [
    {
      field: 'purpose',
      ask: 'Where will this image be used?',
      why: 'The purpose sets the crop, the margins and the negative space, so it changes the frame.',
    },
  ],
  voice: [
    {
      field: 'voiceChar',
      ask: 'Whose voice is this: age, place, temperament?',
      why: 'A script without a voice character gets the vendor default, which sounds like everyone.',
    },
  ],
};

/**
 * The questions worth asking for this brief, most important first, at most three. A question is
 * only asked when its field is empty, the model actually reads that field, and the brief is not
 * itself empty: an empty brief needs the form, not an interview.
 */
export function clarify(brief: Brief, model: Model): Question[] {
  const anything = Object.values(brief).some((v) =>
    Array.isArray(v) ? v.length > 0 : v.trim().length > 0,
  );
  if (!anything) return [];
  const reads = new Set<FieldId>([...model.core, ...model.craft, ...model.tech]);
  const rules = RULES[model.category] ?? [];
  return rules
    .filter(
      (rule) =>
        reads.has(rule.field) &&
        rule.field in FIELDS &&
        !has(brief[rule.field]) &&
        (rule.when === undefined || rule.when(brief)),
    )
    .slice(0, 3)
    .map(({ field, ask, why }) => ({ field, ask, why }));
}
