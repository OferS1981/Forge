import type { Model, Variation } from '../types';

/** Three genuinely different directions, not paraphrases. Ported verbatim. */
export function variations(m: Model): Variation[] {
  if (m.category === 'image' || m.category === 'video')
    return [
      {
        name: 'Colder, more documentary',
        text: 'Swap the grade for desaturated earth tones, drop to available light only, and shoot it on a 35mm at f/2.8. Same subject, no styling.',
      },
      {
        name: 'Tighter and more graphic',
        text: 'Go to an extreme close-up on the single most telling detail. Hard directional light, deep shadow, generous negative space around it.',
      },
      {
        name: 'Wider, with context',
        text: 'Pull back to an establishing wide. Put the subject small in the frame and let the setting carry the story. Keep the same light and grade.',
      },
    ];
  if (m.category === 'voice')
    return [
      {
        name: 'Half a step slower',
        text: 'Drop speed to 0.92 and raise stability by 0.1. Read for an audience of one, not a room.',
      },
      {
        name: 'Warmer, less formal',
        text: 'Rewrite the script in contractions, add one ellipsis before the last clause, and lower stability to widen the range.',
      },
      {
        name: 'Cold read',
        text: 'Strip every tag and let punctuation alone carry the prosody. Useful as a control to hear what the tags are really doing.',
      },
    ];
  if (m.category === 'music')
    return [
      {
        name: 'Strip it back',
        text: 'Same genre and tempo, half the instrumentation. Name only two instruments and let the arrangement breathe.',
      },
      {
        name: 'Change the era',
        text: 'Keep everything, add one era marker: 80s gated reverb, or 90s tape saturation. Era markers do a lot of work.',
      },
      {
        name: 'Loop version',
        text: 'Ask for the negative space explicitly: no melody, just the rhythm section, eight bars, seamless.',
      },
    ];
  if (m.category === 'sfx')
    return [
      {
        name: 'Bigger space',
        text: 'Same source, change the room to a stairwell or warehouse and let the tail run longer.',
      },
      {
        name: 'Closer and drier',
        text: "Close-mic'd, bone-dry, no room at all. This is the version you layer under something else.",
      },
      {
        name: 'Just the tail',
        text: 'Ask only for the decay, not the impact. Layering the transient separately gives you control over both.',
      },
    ];
  return [
    {
      name: 'Add one example',
      text: 'Paste a short example of exactly the answer you want. One example outperforms a paragraph describing the format.',
    },
    {
      name: 'Name the reader',
      text: 'Add who reads this and what they will do with it. It changes what the model chooses to include more than any other line.',
    },
    {
      name: 'Ask for the objections',
      text: 'Add: end with the three strongest objections to your own answer, and say which one you find hardest to dismiss.',
    },
  ];
}
