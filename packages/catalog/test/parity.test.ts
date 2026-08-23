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
 */
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
          const mine = forge(brief, m, 'advanced');
          const theirs = PROTOTYPE.forge({ ...brief }, p);

          expect(mine.flat).toBe(theirs.flat);
          expect(mine.blocks.map((b) => [b.label, b.body])).toEqual(theirs.blocks);
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
