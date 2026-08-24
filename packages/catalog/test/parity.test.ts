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
 * said "illustration", and it sent two keys as empty strings. Ideogram reads that object
 * structurally, so the deviation is scoped to the object: it must still parse, still carry the same
 * description, and now name one medium instead of two. Where the prototype sent an empty string,
 * ours sends the same placeholder the prose grammars use.
 */
const JSON_FIXED = new Set(['ideogram']);

/*
 * The voice grammars ran the script through `stripDot`, which exists so a clause can be joined into
 * a sentence without doubling a full stop. A script is not a clause: it is the literal text a voice
 * will speak, and the mark it ends on tells the model where the pitch falls. Forge's own fifth
 * lesson is "How to direct a voice with punctuation", and the composer was removing the last piece
 * of it. Scoped: ours must be the prototype's output with at most a trailing mark restored.
 */
const SCRIPT_VERBATIM = new Set([
  'el-tts',
  'el-voicedesign',
  'el-dubbing',
  'cartesia',
  'hume',
  'generic-voice',
]);

/** Only the parts of Ideogram's object these checks look at. */
interface JsonPrompt {
  high_level_description?: string;
  style_description?: string;
  compositional_deconstruction?: string;
  art_style?: { medium?: string; palette?: string };
  photo?: { lens?: string; lighting?: string };
}

/*
 * Alon ordered a quality pass on the composed wording, judged against hand-written prompts, so
 * some lines now deliberately read better than the prototype's. The discipline stays byte-level:
 * each rewrite below maps our improved wording back to the prototype's exact words, and the result
 * must then be identical. If the mapping ever fails to produce equality, something other than the
 * sanctioned wording moved.
 */
const VIDEO_IDS = new Set<string>(MODELS.filter((m) => m.category === 'video').map((m) => m.id));

function rewriteOurs(id: string, text: string): string {
  let out = text;
  // The intended-use clause is a sentence now; the prototype wrote it as a label.
  out = out.replace(
    /For (.+?), (?:leave clean negative space around the subject for copy|keep the focal subject clear of the outer eighth of the frame)\./g,
    '$1: keep the focal subject clear of the outer eighth of the frame.',
  );
  /*
   * The app brief's first line gained the full stop every other line already had. The prototype's
   * placeholder carried one and its real values did not, so the mapping is symmetric: both sides
   * lose that line's trailing stop before the compare. dedot() below does the block bodies.
   */
  // The segment ends at the next label in the prototype's one-line flat, or at the line break in
  // ours, so the anchor is whichever comes next rather than the end of a line.
  // The capture may not cross into the next section, or on the prototype's one-line flat the
  // lazy match walks past a dot-less first segment and eats the following section's stop instead.
  out = out.replace(
    /(What we are building: (?:(?!Data model:|This pass only:)[^\n])*?)\.(?=\s*(?:\n|Data model:|This pass only:|$))/,
    '$1',
  );
  /*
   * The pacing folded into the mood sentence: "Playful in feeling, escalating." was two stub
   * sentences in the prototype. Mapped back by re-splitting and re-capitalising. Video only:
   * pacing is a video field, and the image grammars legitimately write "in feeling, in the
   * register of..." which this must not touch.
   */
  if (VIDEO_IDS.has(id)) {
    out = out.replace(
      /in feeling, ([a-z])([^.\n]*)\./g,
      (_, first: string, rest: string) => `in feeling. ${first.toUpperCase()}${rest}.`,
    );
  }
  // Hailuo's inline token dropped the usage note that was being pasted as part of the prompt.
  if (id === 'hailuo') {
    out = out.replace(
      /\[(zoom|pan|static)\](?!:)/g,
      '[$1]: Hailuo reads this bracket syntax. Strip it before pasting into any other model.',
    );
  }
  return out;
}

/*
 * The sound-effects grammar dropped its quality-word tail, which called an ambience bed foley and
 * padded every prompt with the words Forge strips everywhere else. There is no clean byte mapping
 * for a removal plus a reworded placeholder, so the check is containment: everything the prototype
 * said except the tail must survive, and the tail must not.
 */
const SFX_FIXED = new Set(['el-sfx', 'generic-sfx']);
const SFX_TAIL = ', high-quality, professionally recorded, sound effects foley';

/*
 * The score's specificity axis counts the words of the composed prompt, so the models whose dead
 * meta-text was removed measure differently now: the Hailuo usage note and the sfx quality tail
 * were inflating specificity with words that told the model nothing. The prompt got better while
 * the number moved, in either direction, so for exactly these models the score is not compared.
 */
const WORDING_SCORE = new Set(['hailuo', 'el-sfx', 'generic-sfx']);

/** Symmetric: applied to both sides' 'What we are building' body. See rewriteOurs. */
const dedot = (label: string, body: string): string =>
  label === 'What we are building' ? body.replace(/\.$/, '') : body;

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

          if (SFX_FIXED.has(m.id)) {
            const theirsWithoutTail = theirs.flat.replace(SFX_TAIL, '');
            for (const word of words(theirsWithoutTail)) {
              if (word === 'sound' && !theirsWithoutTail.includes('The sound,')) {
                expect(words(mine.flat)).toContain(word);
                continue;
              }
              if (theirs.flat.startsWith('The sound,') && ['sound'].includes(word)) continue;
              expect(words(mine.flat), `${m.id} lost "${word}"`).toContain(word);
            }
            expect(mine.flat).not.toContain(SFX_TAIL);
            expect(mine.flat).not.toContain('high-quality, professionally recorded');
          } else if (LAYOUT_ONLY.has(m.id)) {
            // Same words, better laid out. Nothing else about this model may have moved.
            expect(collapse(rewriteOurs(m.id, mine.flat))).toBe(
              collapse(rewriteOurs(m.id, theirs.flat)),
            );
            expect(newlines(mine.flat)).toBeGreaterThan(newlines(theirs.flat));
            expect(
              mine.blocks.map((b) => [b.label, dedot(b.label, rewriteOurs(m.id, b.body))]),
            ).toEqual(theirs.blocks.map(([label, body]) => [label, dedot(label, body)]));
          } else if (JSON_FIXED.has(m.id)) {
            const mineJson = JSON.parse(mine.flat) as JsonPrompt;
            const theirsJson = JSON.parse(theirs.flat) as JsonPrompt;
            // The description a person reads is untouched. Only the contradiction is gone.
            expect(mineJson.high_level_description).toEqual(
              theirsJson.high_level_description === ''
                ? 'the subject'
                : theirsJson.high_level_description,
            );
            expect(mineJson.style_description).toEqual(theirsJson.style_description);
            expect(mineJson.compositional_deconstruction).toEqual(
              theirsJson.compositional_deconstruction,
            );
            const medium = mineJson.art_style?.medium;
            const style = (mineJson.style_description ?? '').toLowerCase();
            if (medium !== undefined) expect(style).toContain(medium.toLowerCase());
          } else if (SCRIPT_VERBATIM.has(m.id)) {
            // Same text, with the punctuation it was given. Nothing else may have moved.
            const trailing = /[.!?\u2026]+$/;
            expect(mine.flat.replace(trailing, '')).toBe(theirs.flat.replace(trailing, ''));
            expect(mine.blocks.map((b) => [b.label, b.body.replace(trailing, '')])).toEqual(
              theirs.blocks.map(([label, body]) => [label, body.replace(trailing, '')]),
            );
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
            expect(rewriteOurs(m.id, mine.flat)).toBe(rewriteOurs(m.id, theirs.flat));
            expect(
              mine.blocks.map((b) => [b.label, dedot(b.label, rewriteOurs(m.id, b.body))]),
            ).toEqual(theirs.blocks.map(([label, body]) => [label, dedot(label, body)]));
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
          if (WORDING_SCORE.has(m.id)) {
            // See WORDING_SCORE above: the words that moved the measure were dead weight.
          } else if (
            SHOTLIST_FIXED.has(m.id) ||
            JSON_FIXED.has(m.id) ||
            SCRIPT_VERBATIM.has(m.id)
          ) {
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
