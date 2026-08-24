import { describe, expect, it } from 'vitest';
import { MODELS } from '../src/models';
import { forge } from '../src/engine';
import { stripBanned } from '../src/compose/text';
import { splitBeats } from '../src/compose/shared';
import type { Brief, Model } from '../src/types';

/**
 * The shape of the thing you paste.
 *
 * `flat` is the product: it is what the big button copies, what the command line prints and what
 * the MCP server hands another agent. The blocks underneath it are the explanation. A prompt whose
 * sections have been run together is broken even when every word in it is right, and nothing else
 * in this suite was looking at that: the golden files record whatever `flat` was, so they lock a
 * malformed prompt in as correct just as happily as a good one.
 */

const BRIEFS: Partial<Record<string, Brief>> = {
  image: {
    subject: 'a retired boxer taping his hands',
    setting: 'a basement gym at 6am',
    medium: 'photograph',
    purpose: 'editorial',
  },
  video: {
    subject: 'a retired boxer taping his hands',
    setting: 'a basement gym at 6am',
    action: 'he wraps one hand, then looks up at the camera',
    purpose: 'social',
  },
  voice: {
    script: 'You have three minutes. Use them.',
    useCase: 'Corporate narration',
    voiceChar: 'a weathered man in his sixties',
    lang: 'en-GB',
  },
  sfx: { sound: 'a heavy steel door closing in a concrete stairwell', sfxKind: 'impact' },
  music: { mGenre: ['shoegaze'], mMood: ['melancholic'], mInst: ['analog poly synth'], mBpm: '92' },
  text: {
    goal: 'Summarise a tenancy agreement',
    context: 'The reader has no legal background',
    format: 'Markdown with headings',
  },
  code: {
    cTask: 'Add rate limiting to an Express API',
    cStack: 'Node, Express, Redis',
    cCheck: 'The integration tests pass',
  },
  app: {
    aApp: 'a pass-tracking tool for a reception desk',
    aScreens: 'the desk view and an unreturned list',
    aData: 'Visitor, Pass, CheckIn',
  },
  research: {
    rQuestion: 'Which UK councils use AI planning triage?',
    rScope: 'England and Wales, 2023 onwards',
    rFormat: 'Cited brief, 1 page',
  },
};

function briefFor(model: Model): Brief {
  const wanted = BRIEFS[model.category] ?? {};
  const reads = new Set<string>([...model.core, ...model.craft, ...model.tech]);
  return Object.fromEntries(Object.entries(wanted).filter(([id]) => reads.has(id)));
}

describe('cleaning a prompt', () => {
  it('collapses runs of spaces, which is what it is for', () => {
    expect(stripBanned('a    b').text).toBe('a b');
  });

  /*
   * The bug this file was written for. `\s` matches a newline, so collapsing `\s{2,}` turned every
   * blank line between two sections into a single space and ran the next heading onto the end of
   * the previous sentence. It reached about thirty of the fifty-seven models.
   */
  it('keeps the blank line between two sections', () => {
    expect(stripBanned('## Task\nDo the thing\n\n## Output\nAs a list').text).toBe(
      '## Task\nDo the thing\n\n## Output\nAs a list',
    );
  });

  it('keeps a single newline inside a section', () => {
    expect(stripBanned('<context>\nsomething\n</context>').text).toBe(
      '<context>\nsomething\n</context>',
    );
  });

  it('tidies trailing spaces but keeps indentation, which is structure in JSON', () => {
    expect(stripBanned('one   \n   two').text).toBe('one\n   two');
    expect(stripBanned('{\n  "a": 1\n}').text).toBe('{\n  "a": 1\n}');
  });

  it('does not let blank lines pile up', () => {
    expect(stripBanned('one\n\n\n\n\ntwo').text).toBe('one\n\ntwo');
  });

  it('still removes a banned word that sits on its own line', () => {
    const out = stripBanned('a robot\n8k\nin a city');
    expect(out.removed).toContain('8k');
    expect(out.text).not.toContain('8k');
  });
});

describe('every model in the catalogue', () => {
  for (const model of MODELS) {
    it(`${model.id}: its sections stay apart in the prompt you paste`, () => {
      const result = forge(briefFor(model), model, 'simple');
      const flat = result.flat;

      /*
       * A section label that is not at the start of a line is a run-together. This is the exact
       * shape the bug produced: "...filling the gap. ## Context" and "Add rate limiting CONTEXT".
       */
      for (const block of result.blocks) {
        const label = block.label;
        // Prose grammars do not label their sections in the flat prompt at all, so there is
        // nothing to run together and nothing to check.
        if (!flat.includes(label)) continue;
        const index = flat.indexOf(label);
        // A label may be dressed for its grammar: "## Task" in markdown, "<context>" in XML. What
        // it may not do is begin part-way through a line that already has a sentence on it.
        const lineStart = flat.lastIndexOf('\n', index) + 1;
        const prefix = flat.slice(lineStart, index);
        expect(
          /^(#{1,6} |<)?$/.test(prefix),
          `${model.id}: "${label}" runs on from "...${flat.slice(Math.max(0, index - 40), index)}"`,
        ).toBe(true);
      }
    });

    /*
     * The other half of the same worry. A prompt can be beautifully laid out and still have thrown
     * away the one thing the person actually typed, which is what the shot-list grammar was doing:
     * it used the subject only as a fallback for a missing action, so a brief with both lost the
     * subject entirely and described a gym with nobody in it.
     */
    it(`${model.id}: keeps the thing the person actually typed`, () => {
      const brief = briefFor(model);
      const result = forge(brief, model, 'simple');
      /*
       * The whole result, not only the flat prompt. Some models deliberately paste one field of
       * several: Suno's flat is the Style line alone, and Voice Design's is the voice description,
       * because the preview text belongs in a different box on the site. Those are correct, and the
       * blocks carry the rest. What is never correct is the value vanishing from all of it.
       */
      const said = [result.flat, ...result.blocks.map((b) => b.body)].join(' \n ').toLowerCase();
      for (const field of [
        'subject',
        'action',
        'script',
        'sound',
        'goal',
        'cTask',
        'aApp',
        'rQuestion',
      ] as const) {
        const value = brief[field];
        if (typeof value !== 'string' || value.length === 0) continue;
        /*
         * Compared by content words rather than by the whole string, because a composer is allowed
         * to re-case it, split it across sentences or drop a joining word. It is not allowed to
         * lose it.
         */
        const words = value
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((w) => w.length > 3);
        for (const word of words) {
          expect(said, `${model.id}: "${word}" from ${field} is not in the prompt`).toContain(word);
        }
      }
    });

    it(`${model.id}: says nothing it was not given`, () => {
      const result = forge(briefFor(model), model, 'simple');
      // A template placeholder shipped as a finished prompt is worse than an empty one.
      expect(result.flat).not.toMatch(/State the task here|your text here|describe the/i);
      expect(result.flat).not.toContain('undefined');
      expect(result.flat).not.toContain('[object Object]');
    });
  }
});

describe('splitting an action into shots', () => {
  it('keeps every beat when there are fewer shots than beats', () => {
    // The bug: asking for one shot threw away everything after the first comma-then.
    expect(splitBeats('he wraps one hand, then looks up at the camera', 1)).toEqual([
      'he wraps one hand, then looks up at the camera',
    ]);
  });

  it('gives the last shot everything still unspoken', () => {
    expect(splitBeats('one. two. three. four', 2)).toEqual(['one', 'two, then three, then four']);
  });

  it('repeats the last beat when there are more shots than beats', () => {
    expect(splitBeats('one. two', 4)).toEqual(['one', 'two', 'two', 'two']);
  });

  it('has something to say when it was given nothing', () => {
    expect(splitBeats('', 2)).toEqual(['the action continues', 'the action continues']);
  });
});

/** Only the parts of Ideogram's object these checks look at. */
interface JsonPrompt {
  high_level_description?: string;
  style_description?: string;
  compositional_deconstruction?: string;
  art_style?: { medium?: string; palette?: string };
  photo?: { lens?: string; lighting?: string };
}

describe('the JSON grammar', () => {
  const ideogram = MODELS.find((m) => m.id === 'ideogram');
  if (ideogram === undefined) throw new Error('ideogram is missing from the catalogue');

  const parse = (brief: Brief): JsonPrompt =>
    JSON.parse(forge(brief, ideogram, 'advanced').flat) as JsonPrompt;

  it('is valid JSON, which is the whole point of the grammar', () => {
    expect(() => parse({ subject: 'a boxer' })).not.toThrow();
  });

  /*
   * The bug: with no medium given, `style_description` defaulted to "photograph" and `art_style`
   * defaulted to "illustration", so one prompt named two different media. Ideogram reads that
   * object structurally, so it is not a wording slip, it is contradictory instruction.
   */
  it('names one medium, not two', () => {
    const out = parse({ subject: 'a boxer', setting: 'a gym' });
    const style = (out.style_description ?? '').toLowerCase();
    const medium = out.art_style?.medium;
    if (medium !== undefined) {
      expect(style, 'style_description and art_style disagree').toContain(medium.toLowerCase());
    }
    // A photographic medium gets the photo block, and then there is no art_style to disagree with.
    if (/photo|cinematic/.test(style)) expect(out.art_style).toBeUndefined();
  });

  it('leaves a key out rather than sending an empty one', () => {
    const walk = (value: unknown, path: string): void => {
      if (typeof value === 'string') {
        expect(value.length, `${path} is an empty string`).toBeGreaterThan(0);
        return;
      }
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        for (const [key, inner] of Object.entries(value)) walk(inner, `${path}.${key}`);
      }
    };
    walk(parse({ subject: 'a boxer', setting: 'a gym' }), 'root');
    walk(parse({ subject: 'a boxer', medium: 'oil painting' }), 'root');
    // Including the empty brief, which is where the last empty string was hiding.
    walk(parse({}), 'root');
  });
});
