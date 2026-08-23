import { describe, expect, it } from 'vitest';
import { diagnose, forge, rebuild } from '../src/engine';
import { MODELS, modelById } from '../src/models/registry';
import { PROTOTYPE, protoModel } from './fixtures/prototype';

/** Deliberately bad prompts, one per shape of failure. */
export const BAD_PROMPTS: { name: string; model: Parameters<typeof modelById>[0]; text: string }[] =
  [
    { name: 'too short', model: 'midjourney', text: 'a cool dog' },
    {
      name: 'adjective spam',
      model: 'midjourney',
      text: 'masterpiece, best quality, 8k, ultra detailed, a dog, trending on artstation, hyper realistic',
    },
    {
      name: 'tag soup on a language model',
      model: 'nanobanana',
      text: 'dog, park, sunny, grass, trees, blue sky, happy, running, fur, detailed, wide, morning, warm, bright',
    },
    {
      name: 'prose on a tag model',
      model: 'sdxl',
      text: 'A golden retriever running through a park on a bright summer morning while the light comes through the trees',
    },
    {
      name: 'no format or delimiters',
      model: 'claude',
      text: 'summarise this document for me and tell me what you think about it',
    },
    {
      name: 'a good image prompt',
      model: 'midjourney',
      text: 'Photograph of a retired boxer taping his hands, basement gym at 6am. 85mm portrait, f/2.8. Softbox key camera-left. Desaturated earth tones, rule of thirds. For an Instagram carousel. --no logos',
    },
    { name: 'empty', model: 'veo', text: '' },
  ];

describe('the Doctor', () => {
  for (const c of BAD_PROMPTS) {
    const m = modelById(c.model);

    it(`${c.name}: diagnosis matches the prototype`, () => {
      const mine = diagnose(c.text, m);
      const theirs = PROTOTYPE.diagnose(c.text, protoModel(c.model)) as {
        score: number;
        find: string[];
        good: string[];
        words: number;
        stripped: string[];
        cleaned: string;
        axes: Record<string, number>;
      };
      expect(mine.score).toBe(theirs.score);
      expect(mine.findings).toEqual(theirs.find);
      expect(mine.working).toEqual(theirs.good);
      expect(mine.words).toBe(theirs.words);
      expect(mine.stripped).toEqual(theirs.stripped);
      expect(mine.cleaned).toBe(theirs.cleaned);
      expect(mine.axes).toEqual(theirs.axes);
    });

    it(`${c.name}: rebuild matches the prototype`, () => {
      expect(rebuild(c.text, m)).toEqual(PROTOTYPE.rebuild(c.text, protoModel(c.model)));
    });

    it(`${c.name}: diagnosis is stable`, () => {
      expect(diagnose(c.text, m)).toMatchSnapshot();
    });
  }

  it('rebuilding a bad prompt raises its score', () => {
    for (const c of BAD_PROMPTS) {
      if (c.name === 'empty' || c.name === 'a good image prompt') continue;
      const m = modelById(c.model);
      const before = diagnose(c.text, m).score;
      const after = forge(rebuild(c.text, m), m, 'advanced').score;
      expect(after, `${c.name} did not improve`).toBeGreaterThan(before);
    }
  });

  it('rebuilds into a brief every model can forge', () => {
    for (const m of MODELS) {
      const b = rebuild('A brass key on a workbench, shot in the morning', m);
      const res = forge(b, m, 'advanced');
      expect(res.flat.length).toBeGreaterThan(0);
    }
  });
});
