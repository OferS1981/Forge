import type { Brief } from '@forge/catalog';

/**
 * The five-step first run, as data. Section 10 asks for it to be built from a file rather than
 * from strings scattered through components, so the words can be rewritten without touching code.
 *
 * `anchor` names an element on the Build workspace. Nothing here names a model: the example brief
 * is written for whichever model the visitor lands on, and the copy talks about "this model".
 */
export interface Step {
  id: string;
  /** The element the mark points at, by data attribute. */
  anchor: string;
  title: string;
  body: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  /** Run before the step is shown: fill the brief, strike, and so on. */
  does?: 'fill' | 'strike';
  nextLabel?: string;
}

export const EXAMPLE_BRIEF: Brief = {
  subject: 'A retired boxer taping his hands',
  setting: 'Basement gym at 6am, condensation on the windows',
  medium: 'photograph',
  purpose: 'Instagram carousel, first slide',
};

export const STEPS: readonly Step[] = [
  {
    id: 'rack',
    anchor: 'rail',
    title: 'This is the rack',
    side: 'bottom',
    body: 'Fifty-seven models, grouped by what they make. Type to filter by name, maker or what a model is good at, and pin the ones you come back to so they sit at the top.',
  },
  {
    id: 'brief',
    anchor: 'brief',
    title: 'This is the brief',
    side: 'right',
    does: 'fill',
    body: 'Answer these and Forge does the rest. It changes with the model: an image model asks about the frame, a speech model asks for a script and a voice. An example is filled in for you.',
  },
  {
    id: 'strike',
    anchor: 'strike',
    title: 'Strike',
    side: 'top',
    does: 'strike',
    nextLabel: 'See the prompt',
    body: 'Forge composes the prompt in that model’s own grammar. No model is called and nothing leaves this page: the knowledge is in the catalogue.',
  },
  {
    id: 'prompt',
    anchor: 'prompt',
    title: 'This is your prompt',
    side: 'left',
    body: 'Written the way this model reads best, in named sections, with a flat version to copy. Underneath, Forge lists what it chose for you and why, and every one of those is a link that opens that single field.',
  },
  {
    id: 'settings',
    anchor: 'settings',
    title: 'These are the settings to match it',
    side: 'left',
    nextLabel: 'Start forging',
    body: 'The real parameter names, the values to use, and why each one. Any setting name is a link: press it to find out exactly what that dial does.',
  },
];

export const TOTAL = STEPS.length;
