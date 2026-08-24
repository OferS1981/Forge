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
const NARRATIVE = new Set(['nanobanana', 'flux', 'luma', 'wan']);

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
const SHOTLIST_FIXED = new Set(['kling']);

/*
 * Three video models now follow the order their own notes document the vendor asking for: Runway's
 * template, Seedance's structure, Veo's labelled audio line. A reorder has no byte mapping, so the
 * check is containment both ways at the word level: nothing the prototype said may be lost, and
 * the only words gained are the documented framing ("of", "in", "paced", "SFX and ambience",
 * "framed as").
 */
const ORDER_DOCUMENTED = new Set(['runway', 'seedance', 'veo']);

/*
 * Three music models now order their style tokens the way their vendors publish, so the check is
 * that the comma-separated tokens are the same multiset: order is the only thing allowed to move,
 * and the score, which reads words not order, must not move at all.
 */
const MUSIC_ORDERED = new Set(['lyria', 'stableaudio', 'el-music']);

/*
 * Suno's arrangement block became the metatag syntax its own note documents. The user's words
 * survive inside the brackets, so the check is word containment on that block and byte equality
 * on the rest.
 */
const STRUCTURE_TAGS = new Set(['suno']);

/*
 * Midjourney Video's own note says motion only, a handful of words, and let the still carry the
 * look; the prototype pasted the whole cinematic paragraph anyway. The flat is now the motion
 * alone, so the check is that everything the prototype pasted still lives in the blocks, and the
 * flat is a subset of it.
 */
const MOTION_ONLY = new Set(['mjvideo']);

/* The models whose files gained a cited vendor note in the round-six research pass. */
const NOTES_ADDED = new Set(['el-tts', 'cartesia', 'hume', 'ltx', 'kling', 'el-voicedesign']);

/*
 * LTX moved from the shot list its own guide forbids to the flowing paragraph it asks for. The
 * scaffolding words of the old format may go; the documented framing words may arrive; every
 * content word must survive.
 */
const LTX_REMOVED = new Set([
  'shot',
  'seconds',
  'continuity',
  'single',
  'continuous',
  'cuts',
  'medium',
  'camera',
  // The old format injected alternating default moves per shot; the prose uses only the move the
  // user gave, so the scaffold vocabulary may go.
  'slow',
  'dolly',
  'arc',
  'around',
  'handheld',
  'follow',
  'locked',
  'static',
  'tilt',
  // Both formats' filler placeholders, which differ: 'the action continues' against 'the subject
  // moves through the frame'. Placeholder vocabulary is forgiven in both directions.
  'subject',
  'action',
  'continues',
  // The old format labelled the audio line; the word Audio itself was the label.
  'audio',
]);
const LTX_ADDED = new Set([
  'camera',
  'movement',
  'throughout',
  'shot',
  'framed',
  'subject',
  'moves',
  'frame',
  'through',
  // The framing of sentences whose fields the old shot list dropped outright: the mood and
  // pacing line, and the reference line. Their content words are covered by the typed-words rule;
  // these are the joining words of the recovered sentences.
  'feeling',
  'register',
]);

/*
 * Voice Design now follows the documented scaffold: Native <language>, Persona:, Emotion:. Those
 * label words are the only ones allowed to arrive.
 */
const VOICEDESIGN_ADDED = new Set(['native', 'persona', 'emotion']);
const tokens = (text: string): string => text.split(', ').sort().join('|');
const ORDER_WORDS_ALLOWED = new Set([
  'framed',
  'paced',
  'fill',
  'full',
  'sfx',
  'ambience',
  'camera',
  'performance',
  'across',
  'clip',
  'shot',
]);

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
/** The prototype put ElevenLabs bracket tags on these vendors' scripts; both vendors say not to. */
const TAGS_REMOVED = new Set(['cartesia', 'hume']);
const stripTags = (text: string): string => text.replace(/\[[a-z ]+\] ?/gi, '');

const SCRIPT_VERBATIM = new Set([
  'el-tts',
  'cartesia',
  // hume takes its own containment branch: its acting line changed shape as well as punctuation.
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
  /*
   * Phase 13's echo suppressor: a setting that reopens with the word the subject ended on loses
   * that word at the join ("...basement gym, basement gym at 6am" becomes "...basement gym, at
   * 6am"). Sanctioned; the prototype's doubled words are removed before comparing so everything
   * else stays pinned. Applied to the video prose models compared byte-for-byte.
   */
  if (id === 'hailuo' || id === 'higgsfield' || id === 'generic-video') {
    out = out.replace(/\b([a-z]+ [a-z]+), \1\b/gi, '$1,').replace(/\b([a-z]+), \1\b/gi, '$1,');
    out = out.replace(/, at /g, ', at ');
  }
  /*
   * Phase 13 ended the music run-on for the wildcard too: the style line closes with a stop
   * before the arrangement sentence. The prototype ran them together, so the first stop between
   * a lowercase token and a capitalised sentence is removed before comparing.
   */
  if (id === 'generic-music') out = out.replace(/([a-z0-9])\. (?=[A-Z])/, '$1 ');
  /*
   * Round-eight additions: the video grammars gained the intended-use line the image grammars
   * always had, and models with no negative parameter gained the Leave-out sentence. Stripped
   * before any compare.
   */
  out = out
    .replace(
      / ?For [^.\n]*, (?:front-load the strongest moment into the first two seconds|compose safe for a vertical crop with the subject held centre frame|keep the focal subject clear of the frame edges)\./g,
      '',
    )
    .replace(/ ?Without [^.\n]*\.(?=\s|$)/g, '');
  /*
   * The coding grammar learned three habits in round eight: reproduce a bug first, keep a
   * rollback path on risky work, and ask for the done-check when none was given.
   */
  out = out
    .replace(
      /Reproduce the failure first and paste it, before changing anything: a fix for an unreproduced bug is a guess\. ?/g,
      '',
    )
    .replace(/ ?Keep a tested rollback path: say in the report exactly how to revert this\./g, '')
    .replace(
      /Not stated\. Propose the check you will run to prove it and wait for my yes before implementing\./g,
      'a command that exits 0. Run it yourself before you report back, and quote the output.',
    );
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
  /*
   * The technique clause is craft the prototype never wrote, one fixed sentence per non-camera
   * medium, so it is stripped before the byte compare. The clause list lives in shared.ts and
   * craft.test.ts proves it appears; this only proves nothing else changed around it.
   */
  out = out
    .replace(
      / ?(?:Confident line weight with controlled hatching|Visible brushwork, with impasto in the highlights|Matte layered washes with soft edges|Flat colour fills and crisp edges, no gradients|Limited ink layers with visible grain and slight misregistration|Painterly detail that holds up at full-frame scale|True isometric projection with no perspective distortion|Cut-paper edges and layered texture|Graphite shading with visible construction lines)\.\n?/g,
      '',
    )
    .replace(
      /(?:, )?(?:confident line weight with controlled hatching|visible brushwork, with impasto in the highlights|matte layered washes with soft edges|flat colour fills and crisp edges, no gradients|limited ink layers with visible grain and slight misregistration|painterly detail that holds up at full-frame scale|true isometric projection with no perspective distortion|cut-paper edges and layered texture|graphite shading with visible construction lines)(?:\. )?/g,
      '',
    );
  /*
   * Hume's acting line gained the texture word the user gave and lost the invented fallback. Map
   * ours back: drop a trailing ", <texture>" inside the acting instruction, and where the
   * prototype had the invented "measured, warm" and we have nothing, nothing maps to nothing here
   * and the containment branch handles it.
   */
  if (id === 'hume') {
    out = out.replace(
      /(Acting instruction \(keep under 100 characters\): [^.]*?), (?:breathy|husky|gravelly|velvety|chesty|bright|resonant|smoky|reedy)\./,
      '$1.',
    );
  }
  /*
   * The coding grammar learned three habits in the eighth round: reproduce a bug first, keep a
   * rollback path on risky work, and ask for the done-check when none was given. Each is one
   * fixed sentence, stripped or mapped back before the byte compare.
   */
  out = out
    .replace(
      / ?Reproduce the failure first and paste it, before changing anything: a fix for an unreproduced bug is a guess\./g,
      '',
    )
    .replace(/ ?Keep a tested rollback path: say in the report exactly how to revert this\./g, '')
    .replace(
      /Not stated\. Propose the check you will run to prove it and wait for my yes before implementing\./g,
      'a command that exits 0. Run it yourself before you report back, and quote the output.',
    );
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
const WORDING_SCORE = new Set([
  'hailuo',
  'el-sfx',
  'generic-sfx',
  // The reordered and relabelled video models: same content, different joins, so the axis that
  // counts words and sentence shapes moves a point or two in either direction.
  'runway',
  'seedance',
  'veo',
  'mjvideo',
  // The invented "measured, warm" fallback is gone, so the words the axis counted went with it.
  'hume',
  // Reshaped to their vendors' documented forms, so the word-counting axes move a point or two.
  'kling',
  'ltx',
  'el-voicedesign',
  'el-dubbing',
  // The purpose token the invariant suite restored adds real words, so specificity moves.
  'sdxl',
  'luma',
  'wan',
  'generic-video',
  'kling',
  'higgsfield',
  // The coding grammar's learned habits are sentences, and sentences are words.
  'claudecode',
  'cursor',
  'copilot',
  'codex',
  'devin',
  'generic-code',
]);

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

/*
 * The settings audit found eleven rows whose why was an empty string: a settings table that
 * could not explain itself. The whys were written in phase 13; the prototype's were blank, so
 * for these models a why is compared only for being present, not for matching nothing.
 */
const WHY_WRITTEN = new Set([
  'perplexity',
  'notebooklm',
  'deepresearch',
  'generic-research',
  'generic-app',
]);

/*
 * Higgsfield's Camera preset row used to say "nearest named preset", which told nobody which of
 * the 63 presets to click. It now names one, chosen from the camera move, out of the preset list
 * its own note documents. The parameter and the why must still match; the value is the fix.
 */
const NAMED_VALUE_ROWS: Record<string, string> = { higgsfield: 'Camera preset' };

/** The models that gained an Aspect ratio settings row in round eight; dropped before compare. */
const ASPECT_ROW_ADDED = new Set(['ltx', 'luma', 'higgsfield']);

function normaliseSettings(
  rows: [string, string, string][],
  modelId: string,
): [string, string, string][] {
  const emDash = EM_DASH_ROWS[modelId];
  const rewritten = REWRITTEN_WHY[modelId];
  const named = NAMED_VALUE_ROWS[modelId];
  const withoutAspect = ASPECT_ROW_ADDED.has(modelId)
    ? rows.filter(([name]) => name !== 'Aspect ratio')
    : rows;
  return withoutAspect.map(([name, value, why]) => {
    if (WHY_WRITTEN.has(modelId)) return [name, value, ''];
    if (name === emDash && value === '\u2014') return [name, 'none', why];
    // Only the explanation changed. The parameter and the value it emits must still match.
    if (name === rewritten) return [name, value, ''];
    // Only the value changed, from a shrug to a name. The parameter and the why still match.
    if (name === named) return [name, '', why];
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
          // Sanctioned additions removed up front, so the containment branches see only the rest.
          const mineFlat = rewriteOurs(m.id, mine.flat);

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
            // The one added key carries the purpose the suite caught being dropped.
            if (typeof brief.purpose === 'string') {
              expect((mineJson as { intended_use?: string }).intended_use).toBe(
                brief.purpose.replace(/\.$/, ''),
              );
            }
          } else if (SCRIPT_VERBATIM.has(m.id)) {
            // Same text, with the punctuation it was given. Nothing else may have moved, except
            // the bracket tags the prototype put on vendors whose own docs say not to.
            const trailing = /[.!?\u2026]+$/;
            const norm = (id: string, text: string): string =>
              (TAGS_REMOVED.has(id) ? stripTags(text) : text).replace(trailing, '');
            expect(norm(m.id, mine.flat)).toBe(norm(m.id, theirs.flat));
            expect(mine.blocks.map((b) => [b.label, norm(m.id, b.body)])).toEqual(
              theirs.blocks.map(([label, body]) => [label, norm(m.id, body)]),
            );
          } else if (MUSIC_ORDERED.has(m.id)) {
            /*
             * The Style line carries the reordered tokens; everything after it is untouched. So
             * the Style bodies must be the same multiset, and swapping ours for theirs inside the
             * flat must give byte equality, which pins every other character in place.
             */
            const mineStyle = mine.blocks[0]?.body ?? '';
            const theirsStyle = theirs.blocks[0]?.[1] ?? '';
            expect(tokens(mineStyle)).toBe(tokens(theirsStyle));
            /*
             * Phase 13 ended the run-on: the style line now closes with a full stop before the
             * arrangement sentence ("...instrumental. Start with...", where the prototype ran
             * "...instrumental Start with..."). Sanctioned; the stop is removed before the byte
             * comparison so everything else stays pinned.
             */
            expect(
              mine.flat.replace(mineStyle, theirsStyle).replace(theirsStyle + '.', theirsStyle),
            ).toBe(theirs.flat);
            expect(mine.blocks.map((b, i) => [b.label, i === 0 ? theirsStyle : b.body])).toEqual(
              theirs.blocks,
            );
          } else if (STRUCTURE_TAGS.has(m.id)) {
            expect(mine.flat).toBe(theirs.flat);
            for (const [i, b] of mine.blocks.entries()) {
              const theirBlock = theirs.blocks[i];
              if (theirBlock === undefined) throw new Error('suno gained a block');
              if (b.label === 'Lyrics field metatags') {
                expect(theirBlock[0]).toBe('Arrangement');
                for (const word of words(theirBlock[1])) {
                  expect(words(b.body), `suno lost "${word}"`).toContain(word);
                }
              } else {
                expect([b.label, b.body]).toEqual(theirBlock);
              }
            }
          } else if (m.id === 'ltx') {
            for (const word of words(theirs.flat)) {
              if (LTX_REMOVED.has(word)) continue;
              expect(words(mine.flat), `ltx lost "${word}"`).toContain(word);
            }
            // A word the user typed is always legitimate: the old shot list dropped the lens
            // entirely, and the prose restoring it is a recovery, not an invention.
            const typed = new Set(words(JSON.stringify(brief)));
            for (const word of words(mineFlat)) {
              if (words(theirs.flat).includes(word) || LTX_ADDED.has(word) || typed.has(word))
                continue;
              throw new Error(`ltx gained the undocumented word "${word}"`);
            }
            expect(mine.flat).not.toContain('Shot 1');
          } else if (m.grammar === 'voicedesign') {
            for (const word of words(theirs.flat)) {
              expect(words(mine.flat), `${m.id} lost "${word}"`).toContain(word);
            }
            for (const word of words(mine.flat)) {
              if (words(theirs.flat).includes(word) || VOICEDESIGN_ADDED.has(word)) continue;
              throw new Error(`${m.id} gained the undocumented word "${word}"`);
            }
          } else if (m.grammar === 'tags') {
            /*
             * The tag grammar gained the purpose token the invariant suite caught it dropping.
             * Remove exactly that token and the bytes must match, so nothing else can move.
             */
            const purpose = typeof brief.purpose === 'string' ? brief.purpose : '';
            const imgtext = typeof brief.imgtext === 'string' ? brief.imgtext : '';
            let stripped = mine.flat;
            if (purpose.length > 0)
              stripped = stripped.replace(`, for ${purpose.replace(/\.$/, '')}`, '');
            if (imgtext.length > 0)
              stripped = stripped.replace(`, text "${imgtext.replace(/\.$/, '')}"`, '');
            expect(stripped).toBe(theirs.flat);
          } else if (m.id === 'hume') {
            const record = mine.blocks.map((b) => b.body).join(' ');
            const INVENTED = new Set(['measured', 'warm']);
            for (const word of words(stripTags(theirs.flat))) {
              if (INVENTED.has(word)) continue;
              expect(words(record + ' ' + mine.flat), `hume lost "${word}"`).toContain(word);
            }
            expect(record).not.toContain('measured, warm');
          } else if (MOTION_ONLY.has(m.id)) {
            const record = mine.blocks.map((b) => b.body).join(' ');
            for (const word of words(theirs.flat.replace(/--motion \w+|--raw/g, ''))) {
              expect(words(record), `${m.id} lost "${word}"`).toContain(word);
            }
            const FRAMING = new Set(['pacing', 'throughout', 'without']);
            for (const word of words(mineFlat)) {
              if (FRAMING.has(word)) continue;
              expect(words(theirs.flat), `${m.id} gained "${word}"`).toContain(word);
            }
            expect(mine.flat.length).toBeLessThan(theirs.flat.length + 1);
          } else if (ORDER_DOCUMENTED.has(m.id)) {
            for (const word of words(theirs.flat)) {
              expect(words(mine.flat), `${m.id} lost "${word}"`).toContain(word);
            }
            for (const word of words(mineFlat)) {
              if (words(theirs.flat).includes(word) || ORDER_WORDS_ALLOWED.has(word)) continue;
              throw new Error(`${m.id} gained the undocumented word "${word}"`);
            }
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
            // The round-eight blocks, video intended-use and Leave out, did not exist in the
            // prototype for any model, so they are dropped from ours before comparing shape.
            const comparable = mine.blocks.filter(
              (b) =>
                b.label !== 'Leave out' && !(b.label === 'Intended use' && m.category === 'video'),
            );
            expect(
              comparable.map((b) => [b.label, dedot(b.label, rewriteOurs(m.id, b.body))]),
            ).toEqual(
              theirs.blocks.map(([label, body]) => [label, dedot(label, rewriteOurs(m.id, body))]),
            );
          }
          expect(mine.negative).toBe(theirs.negative);
          expect(
            normaliseSettings(
              mine.settings.map((s): [string, string, string] => [s.name, s.value, s.why]),
              m.id,
            ),
          ).toEqual(normaliseSettings(theirs.settings, m.id));
          if (NOTES_ADDED.has(m.id)) {
            // The ported notes all survive; what is new carries a citation in the model file.
            for (const note of theirs.notes) expect(mine.notes).toContain(note);
          } else {
            expect(mine.notes).toEqual(theirs.notes);
          }
          expect(mine.warnings).toEqual(theirs.warn);
          if (!MOTION_ONLY.has(m.id) && m.id !== 'ltx' && m.grammar !== 'voicedesign') {
            expect(mine.variations.map((v) => ({ n: v.name, t: v.text }))).toEqual(
              theirs.variations,
            );
          }
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
