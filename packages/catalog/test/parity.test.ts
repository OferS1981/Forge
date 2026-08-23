import { describe, expect, it } from 'vitest';
import { forge } from '../src/engine';
import { MODELS } from '../src/models/registry';
import { briefsFor } from './fixtures/briefs';
import { PROTOTYPE, protoModel } from './fixtures/prototype';

/**
 * The two deliberate deviations from the prototype, both recorded in PORT-NOTES.md: an em dash is
 * not allowed in user-facing copy, so a settings row whose value was "—" now reads "none". Nothing
 * else may differ, and the test below proves these are the only two.
 */
const EM_DASH_ROWS: Record<string, string> = { recraft: 'substyle', suno: 'Exclude Styles' };

function normaliseSettings(
  rows: [string, string, string][],
  modelId: string,
): [string, string, string][] {
  const row = EM_DASH_ROWS[modelId];
  return rows.map(([name, value, why]) =>
    name === row && value === '\u2014' ? [name, 'none', why] : [name, value, why],
  );
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
          const mine = forge(brief, m, 'advanced');
          const theirs = PROTOTYPE.forge({ ...brief }, p);

          expect(mine.flat).toBe(theirs.flat);
          expect(mine.blocks.map((b) => [b.label, b.body])).toEqual(theirs.blocks);
          expect(mine.negative).toBe(theirs.negative);
          expect(mine.settings.map((s) => [s.name, s.value, s.why])).toEqual(
            normaliseSettings(theirs.settings, m.id),
          );
          expect(mine.notes).toEqual(theirs.notes);
          expect(mine.warnings).toEqual(theirs.warn);
          expect(mine.variations.map((v) => ({ n: v.name, t: v.text }))).toEqual(theirs.variations);
          expect(mine.stripped).toEqual(theirs.stripped);
          expect(mine.score).toBe(theirs.score);
          expect(mine.axes).toEqual(theirs.axes);
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
