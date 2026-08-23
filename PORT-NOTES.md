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
9. **Category colours moved to token names.** `categories.ts` stores `--cat-image` and so on. The
   hexes move into the `packages/ui` token file in phase 2, because no colour may live outside it.

## Things in the prototype I think are wrong, left as they are

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
