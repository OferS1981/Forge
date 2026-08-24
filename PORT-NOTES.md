# Port notes

Phase 1 ported `reference/forge.html` into `packages/catalog`. The rule was: port the wording as
written, do not rewrite it from my own knowledge, and put every disagreement here rather than into
the data. The parity test in `packages/catalog/test/parity.test.ts` proves the ported engine
reproduces the prototype exactly for all 57 models, so everything below is either a deliberate,
listed deviation or a note for a later phase.

## Deliberate deviations, and why

1. **Two em dashes became "none".** Recraft's `substyle` row and Suno's `Exclude Styles` row used an
   em dash as a placeholder value. `CLAUDE.md` bans em dashes in user-facing text. The parity test
   allows exactly these two substitutions and asserts no other em dash survives anywhere.
2. **Wildcards have no maker.** The prototype set `maker: "—"` on the nine wildcard entries. The
   field is now optional and wildcards simply omit it.
3. **`tags` is two to four entries, not always four.** The spec sketches a four-tuple. Four
   prototype entries carry two tags and nine carry three. Inventing the missing tags would be new
   copy with no source, so the type widened instead.
4. **Model-id branches became typed flags.** The prototype's composers branched on
   `m.id === "midjourney"`, `"mjvideo"`, `"hailuo"`, `"el-tts"`, `"hume"`, `"suno"` and `"claude"`.
   Section 6 of the spec says model-specific behaviour lives in the data, so those became
   `promptSuffix`, `inlineCameraTokens`, `audioTags`, `actingInstruction`, `flatStyleOnly`,
   `delimiters` and `lengthWarningBelow`. The output is byte-identical; the composers no longer know
   any model by name.
5. **The Claude entry names the current family.** The prototype's version line read
   "Opus 5 / Sonnet 5", which predates Fable 5. The catalogue now reads
   "Opus 5 / Sonnet 5 / Fable 5" and the `model` settings row says which is for what. The parity
   test allows exactly this one `why` line to differ and still asserts the parameter and the value
   match, so nothing else can drift under cover of it.
6. **Two models now get narrative prose, because their own notes ask for it.** Nano Banana Pro's
   note reads "Google's own docs ask for narrative descriptive paragraphs, not keyword lists. Forge
   writes it that way", and FLUX.2's reads "Detail is rewarded, not diluted". The prototype wrote
   both as terse token lists anyway, so the note was a claim the product did not keep. Those two
   carry `prose: 'narrative'` and their clauses are written as sentences, keeping the descriptive
   half of a vocabulary entry that the terse form throws away. The parity test excludes exactly
   these two from the composed-output comparison and asserts the flag is why;
   `packages/catalog/test/narrative.test.ts` covers them instead, including that nothing is
   invented that the brief did not say.
7. **The library schema departs from the section 13 sketch in five places.** No `view_count`,
   because it is per-share analytics and `CLAUDE.md` says no analytics: that is a genuine conflict
   between the spec and the rules, resolved in favour of the rules, and worth Alon knowing about.
   No `result jsonb` on `prompts`, because section 13's own next line says a stored brief can be
   re-forged and a stored string is dead. `heat` is `score`, the word the product uses. `shares`
   carries `user_id`, because deriving ownership through the prompt makes two policies depend on
   each other. And a share is `/p#<brief>` rather than `/p/<slug>`, because a static export has no
   server to resolve a slug and an anonymous visitor has no row to make, while the same section
   says anonymous users get everything except cloud sync. An account still mints a short slug.
   `PHASE-7-NOTES.md` has the reasoning for each.
8. **The extension does not use `@crxjs/vite-plugin`.** Section 14 names it. Its job is manifest
   rewriting and hot reload; Forge's manifest is generated from the catalogue by a unit-tested
   function, which is stronger than rewriting one by hand, and two small Vite configs plus one
   script replace a long-running beta dependency in the build path. Everything else in section 14
   is as written.
9. **`describeImage` takes the model as well as the file.** Section 12 writes it as
   `describeImage(file)`. Without the model there is no field menu, so the assistant is free to
   answer with a field or a value the catalogue does not know, and a described brief becomes a
   second, unverified catalogue. The parser needs the model to refuse those. `PHASE-9-NOTES.md`
   has the rest.
10. **Four defects in the prototype's composers, fixed rather than ported.** These are not wording
    disagreements, which is why they are fixed here rather than only listed below. Each is scoped in
    `parity.test.ts` so nothing else could drift under cover of them, and each has a test in
    `packages/catalog/test/shape.test.ts`.

    a. **`stripBanned` flattened every prompt.** It collapsed `\s{2,}` to a single space, and a
    newline is whitespace, so the blank line between two sections became a space and the next
    heading ran onto the end of the previous sentence: `...filling the gap. ## Context`, and
    `Add rate limiting to the public API CONTEXT`. It reached **22 of the 57 models** and only
    `flat`, which is the one thing anybody pastes: the blocks underneath were always correct, which
    is why it survived. Tidying is now done a line at a time, so indentation and blank lines live.

    b. **The shot-list grammar dropped the subject.** It used `subject` only as a fallback for a
    missing `action`, so a brief with both described the room, the light and the grade and never
    said who was in the shot. Kling and LTX-2.

    c. **`splitBeats` discarded beats past the shot count.** "he wraps one hand, then looks up at
    the camera" in a one-shot brief became "he wraps one hand" and the rest was lost. The last shot
    now takes everything still unspoken.

    d. **The JSON grammar named two different media.** Ideogram's `style_description` defaulted to
    `photograph` while its `art_style.medium` defaulted to `illustration`, so one object carried two
    contradictory instructions, and it sent `palette` as an empty string. The medium is decided once
    now, and an empty key is left out.

    e. **The voice grammars stripped the script's final punctuation.** `stripDot` exists so a
    clause can be joined into a sentence without doubling a full stop, and it was being applied to
    the script, which is not a clause: it is the literal text a voice will speak, and the mark it
    ends on tells the model where the pitch falls. Forge's own fifth lesson is "How to direct a
    voice with punctuation", and the composer was removing the last piece of it. Six models.

11. **Category colours moved to token names.** `categories.ts` stores `--cat-image` and so on. The
    hexes move into the `packages/ui` token file in phase 2, because no colour may live outside it.

## The quality pass, ordered by Alon

Alon ordered Forge's composed prompts benched against hand-written ones and improved until they
win, which supersedes port-as-written for the composers. The bench is ten real briefs against all
57 models (`scripts/bench-briefs.mjs`); every match Forge lost became a rule in
`packages/catalog/test/craft.test.ts`, and every wording change is mapped back to the prototype's
exact words in `parity.test.ts`, so the port discipline survives the improvement. The changes:

- **The subject outranks the channel.** Mood and pacing read the scene first: a boxer alone at 6am
  is austere whatever the clip is for, and a product shot carries no invented mood at all.
- **What the user said outranks what a rule would add.** A setting that names its own light, sunlit
  or midnight or 6am, gets no studio light dropped on top of it.
- **Craft belongs to its medium.** Lens, aperture, light and grade are not auto-filled onto ink
  line art or any other non-camera medium.
- **The purpose does real work.** It reads as a sentence, a hero image gets negative space rather
  than a safety margin, and the purpose sets the aspect ratio when it names the crop, only ever to
  one the model offers.
- **Nothing but the prompt in the prompt.** Hailuo's bracket token lost the pasted usage note, and
  the sound-effects grammar lost the quality-word tail that called an ambience bed foley.
- **A writing task may invent.** The system prompt's grounding line now keys off the task's verb:
  "say so rather than filling the gap" stays for reading tasks and would sabotage a drafting one.

## Things in the prototype I think are wrong, left as they are

- **The intended-use clause is a label, not a sentence.** `imageSections` emits
  `<purpose>: keep the focal subject clear of the outer eighth of the frame.` In a prose grammar
  that lands mid-paragraph as `...austere in feeling. editorial: keep the focal subject clear of
the outer eighth of the frame.`, which reads like a leaked internal note rather than a brief.
  "For editorial use, so keep the focal subject clear of the outer eighth of the frame" would carry
  the same instruction as prose. This is a wording disagreement rather than a defect, so it is here
  rather than in the data.
- **The sound-effects placeholder is not a sentence.** An empty brief gives
  `The sound, calm, high-quality, professionally recorded, sound effects foley`. Every other
  grammar's placeholder is a usable instruction: "Write the line you want spoken here", "State the
  task here". "The sound," is neither a placeholder nor a description.
- **The aspect ratio ignores the stated purpose.** A brief that says it is for editorial use still
  gets `--ar 1:1`, where a person would reach for 4:5 or 3:2, and one that says Instagram story
  still gets 1:1 rather than 9:16. `purpose` already changes the framing note, so the information
  is there and unused. This is a missing auto-fill rather than a wrong one, so it is a feature.
- **The mood follows the purpose and ignores the subject.** `purpose: social` auto-fills
  `mood: playful` and `pacing: escalating`, which for "a retired boxer taping his hands, a basement
  gym at 6am" produces "Playful in feeling. Escalating." A person would not write that. The
  auto-fill reads one field where it needs two.
- ~~Seven video models share one prompt, byte for byte.~~ **Resolved in the round-four quality
  pass, from the catalogue's own notes.** Runway now follows its own documented template, Seedance
  its documented structure with the camera held until the performance is told, Veo labels its audio
  line as its note calls the documented syntax, and Wan 2.7 and Luma Ray3 carry `prose: 'narrative'`
  because their notes document reasoning modes that reward it. Each flag sits beside the note that
  justifies it; parity holds the rest byte-still through word-containment with an allowed-words
  list. The remaining prose models genuinely share a grammar until a vendor page says otherwise.
- **Non-camera media now carry a technique clause**, one fixed sentence per medium: confident line
  weight for ink, impasto for oil, misregistration for riso. Craft, not content: it speaks only of
  the medium, so it can contradict no subject and no setting, and a test proves it. Veo, Seedance, Runway, Luma, Higgsfield,
  Wan and the wildcard all emit the same string, and four image models do the same. Sharing a
  grammar is legitimate and the settings do differ, but the product's claim is that each is written
  in its own model's grammar, and Runway and Veo document different orders. Splitting them needs
  vendor sources, which is what the refresh pipeline is for.

- **`el-tts` length warning names ElevenLabs by brand.** The under-250-character warning text says
  "ElevenLabs document that..." and it is emitted for Cartesia, Hume and the voice wildcard too.
  Ported as written. Worth rewording in phase 4 when the glossary copy is written.
- **`--stylize` default.** The Midjourney settings row says "0–1000, default 100" but Forge emits
  250 for non-photographic media. Both may be right, and the vendor page will settle it at the first
  verification pass.
- **Leonardo's negative prompt is marked "not confirmed".** The prototype's own note says to verify
  it in your account. It is ported with that note intact and the model carries `unverified: true`.
- **`generic-*` blurbs promise two grammars.** The image wildcard's blurb says Forge emits both a
  prose and a tag version. The engine emits one. Either the blurb or the composer should change; I
  did not decide that for Alon.

## Verification status

Every model file carries `unverified: true` and `verifiedOn: 2026-08-23`. The `sources` array holds
the vendor's own documentation URL for that product, but nothing in this phase fetched those pages,
so the honest state is unverified across the board. The staleness test turns the build red 120 days
from that date. The refresh workflow in section 18 of the spec (phase 8) is what clears the flags,
one reviewed pull request per category.

## Not done in this phase, by design

The glossary holds one stub entry per term id so the coverage test is real, but no term has its copy
written yet. `packages/catalog/test/terms.test.ts` has `ALLOW_STUBS = true`; phase 4 writes the copy
and flips it to `false`, at which point a stub fails the build.
