import { describe, expect, it } from 'vitest';
import { forge } from '../src/engine';
import { MODELS } from '../src/models/registry';
import { briefsFor } from './fixtures/briefs';
import { PROTOTYPE, protoModel } from './fixtures/prototype';

/**
 * The deliberate deviations from the prototype, every one recorded in PORT-NOTES.md. Nothing else
 * may differ, and the tests below prove these are the only ones.
 *
 * 1. An em dash is not allowed in user-facing copy, so a settings row whose value was "—" reads
 *    "none".
 * 2. The prototype's Claude entry predates Fable 5. The catalogue names the current family, so the
 *    `why` on that row differs from the prototype's.
 * 3. Two models document that they want descriptive paragraphs rather than keyword lists, and say
 *    so in their own notes. The prototype wrote them as token lists anyway, which made the note a
 *    claim the product did not keep. Those two are excluded from the composed-output comparison
 *    and covered by narrative.test.ts instead. Every other model is still compared byte for byte.
 */
const NARRATIVE = new Set(['nanobanana', 'flux']);

/*
 * The prototype's `stripBanned` collapsed every run of whitespace to a single space, and a newline
 * is whitespace, so the blank line between two sections became a space and the next heading ran on
 * to the end of the previous sentence. It reached twenty-two of the fifty-seven models and only the
 * flat prompt, which is the one thing anybody pastes. See PORT-NOTES.md.
 *
 * The deviation is scoped rather than waived: the two must still be identical once whitespace is
 * normalised, so not one character of content may differ, and ours must have gained line breaks
 * rather than lost them.
 */
const LAYOUT_ONLY = new Set([
  'claude',
  'gpt',
  'gemini',
  'grok',
  'deepseek',
  'generic-text',
  'claudecode',
  'cursor',
  'copilot',
  'codex',
  'devin',
  'generic-code',
  'v0',
  'lovable',
  'bolt',
  'base44',
  'generic-app',
  'perplexity',
  'notebooklm',
  'deepresearch',
  'generic-research',
]);

/*
 * The shot-list grammar used the subject only as a fallback for a missing action, so a brief with
 * both lost the subject entirely, and it threw away every beat past the shot count. Ours says more
 * than the prototype did, so the deviation is scoped the other way: nothing the prototype said may
 * be missing from ours.
 */
const SHOTLIST_FIXED = new Set(['kling', 'ltx']);

/*
 * The JSON grammar worked its medium out twice with two different defaults, so a brief that named
 * no medium produced an object whose `style_description` said "photograph" and whose `art_style`
 * said "illustration", and it sent `palette` as an empty string. Ideogram reads that object
 * structurally, so the deviation is scoped to the object: it must still parse, still carry the same
 * description, and now name one medium instead of two.
 */
const JSON_FIXED = new Set(['ideogram']);

/** Only the parts of Ideogram's object these checks look at. */
interface JsonPrompt {
  high_level_description?: string;
  style_description?: string;
  compositional_deconstruction?: string;
  art_style?: { medium?: string; palette?: string };
  photo?: { lens?: string; lighting?: string };
}

const collapse = (text: string): string => text.replace(/\s+/g, ' ').trim();
const newlines = (text: string): number => (text.match(/\n/g) ?? []).length;
const words = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
const EM_DASH_ROWS: Record<string, string> = { recraft: 'substyle', suno: 'Exclude Styles' };

const REWRITTEN_WHY: Record<string, string> = { claude: 'model' };

function normaliseSettings(
  rows: [string, string, string][],
  modelId: string,
): [string, string, string][] {
  const emDash = EM_DASH_ROWS[modelId];
  const rewritten = REWRITTEN_WHY[modelId];
  return rows.map(([name, value, why]) => {
    if (name === emDash && value === '\u2014') return [name, 'none', why];
    // Only the explanation changed. The parameter and the value it emits must still match.
    if (name === rewritten) return [name, value, ''];
    return [name, value, why];
  });
}

/**
 * The definition of done for the port. Advanced mode, because Simple mode adds autoFill the
 * prototype never had. If any of these fail, the ported engine is not the prototype.
 */

describe('parity with the prototype', () => {
  it('loads the prototype engine', () => {
    expect(PROTOTYPE.MODELS).toHaveLength(57);
  });

  for (const m of MODELS) {
    describe(m.id, () => {
      const p = protoModel(m.id);

      for (const { name, brief } of briefsFor(m.category)) {
        it(`forges the ${name} brief identically`, () => {
          if (NARRATIVE.has(m.id)) {
            // Deliberately different. See the note above and narrative.test.ts.
            expect(m.prose).toBe('narrative');
            return;
          }
          const mine = forge(brief, m, 'advanced');
          const theirs = PROTOTYPE.forge({ ...brief }, p);

          if (LAYOUT_ONLY.has(m.id)) {
            // Same words, better laid out. Nothing else about this model may have moved.
            expect(collapse(mine.flat)).toBe(collapse(theirs.flat));
            expect(newlines(mine.flat)).toBeGreaterThan(newlines(theirs.flat));
            expect(mine.blocks.map((b) => [b.label, b.body])).toEqual(theirs.blocks);
          } else if (JSON_FIXED.has(m.id)) {
            const mineJson = JSON.parse(mine.flat) as JsonPrompt;
            const theirsJson = JSON.parse(theirs.flat) as JsonPrompt;
            // The description a person reads is untouched. Only the contradiction is gone.
            expect(mineJson.high_level_description).toEqual(theirsJson.high_level_description);
            expect(mineJson.style_description).toEqual(theirsJson.style_description);
            expect(mineJson.compositional_deconstruction).toEqual(
              theirsJson.compositional_deconstruction,
            );
            const medium = mineJson.art_style?.medium;
            const style = (mineJson.style_description ?? '').toLowerCase();
            if (medium !== undefined) expect(style).toContain(medium.toLowerCase());
          } else if (SHOTLIST_FIXED.has(m.id)) {
            // Everything the prototype said, and the subject it did not.
            for (const word of words(theirs.flat)) {
              expect(words(mine.flat), `${m.id} lost "${word}"`).toContain(word);
            }
            const subject = typeof brief.subject === 'string' ? brief.subject : '';
            if (subject.length > 0) {
              for (const word of words(subject)) expect(words(mine.flat)).toContain(word);
            }
          } else {
            expect(mine.flat).toBe(theirs.flat);
            expect(mine.blocks.map((b) => [b.label, b.body])).toEqual(theirs.blocks);
          }
          expect(mine.negative).toBe(theirs.negative);
          expect(
            normaliseSettings(
              mine.settings.map((s): [string, string, string] => [s.name, s.value, s.why]),
              m.id,
            ),
          ).toEqual(normaliseSettings(theirs.settings, m.id));
          expect(mine.notes).toEqual(theirs.notes);
          expect(mine.warnings).toEqual(theirs.warn);
          expect(mine.variations.map((v) => ({ n: v.name, t: v.text }))).toEqual(theirs.variations);
          expect(mine.stripped).toEqual(theirs.stripped);
          if (SHOTLIST_FIXED.has(m.id) || JSON_FIXED.has(m.id)) {
            /*
             * A prompt that names its subject, or that stops contradicting itself, is a better
             * prompt, so the score may move up. What a fix may never do is make one score worse,
             * which is the assertion worth having.
             */
            expect(mine.score).toBeGreaterThanOrEqual(theirs.score);
          } else {
            expect(mine.score).toBe(theirs.score);
            expect(mine.axes).toEqual(theirs.axes);
          }
        });
      }
    });
  }

  it('has no em dash anywhere in the composed output', () => {
    for (const m of MODELS) {
      for (const { brief } of briefsFor(m.category)) {
        const res = forge(brief, m, 'advanced');
        expect(res.flat).not.toContain('\u2014');
        for (const row of res.settings) expect(row.value).not.toContain('\u2014');
      }
    }
  });
});
