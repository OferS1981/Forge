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

## The round-six research pass, done by hand

The refresh pipeline's job, done once manually while it waits for its key: the remaining tie models
were checked against their vendors' live documentation, and each fact taken carries the page it
came from in `sources` with `verifiedOn` moved to the day it was read.

- **ElevenLabs v3** documents that ellipses add pauses and weight and capitalisation increases
  emphasis. Now a note on `el-tts`, so the Doctor and the panel teach it.
- **Cartesia** documents concrete transcript rules: end punctuation on every transcript, a dash for
  a pause, dates as MM/DD/YYYY, a space before AM or PM. Now a note.
- **Hume's** examples all pair a precise emotion with a delivery style. The acting line is now
  composed from the tone and texture the user gave, and the invented "measured, warm" fallback is
  gone: it was a made-up mood, the one thing Forge never does.
- **Midjourney Video's own ported note** says it is not a cinematic-paragraph model: motion only,
  a handful of words, the still carries the look. The composer was pasting the paragraph anyway.
  The flat is now the motion alone; everything else the user typed lives in a start-frame block, so
  nothing is lost from the record.
- **Higgsfield's settings row** now names the preset to click, chosen from the camera move out of
  the preset library its own note lists, instead of saying "nearest named preset".

## The round-seven research pass

Three more vendors read and obeyed, each fact cited in `sources` with `verifiedOn` moved to the day
it was read.

- **Kling publishes a formula**: subject and its description, then subject movement, then scene,
  then camera language, lighting and atmosphere. The shot list led with the camera; the vendor puts
  it after the scene, so each shot line now reads subject, movement, scene, then Camera.
- **LTX's guide forbids the very grammar it carried.** "Write your prompt as a single flowing
  paragraph" and "Do not use a shot list, numbered beats, or screenplay sluglines". The grammar
  moved from shotlist to prose in the guide's six-element order, with the character placed before
  the pronouns that refer to it because the same guide demands one chronological paragraph. The
  old shot list also dropped the lens and the reference outright; the prose restores them.
- **ElevenLabs documents a voice-design scaffold**: native language, gender and age, audio
  quality, persona, emotion, then timbre and pacing. The composer writes exactly that order, for
  Voice Design and for Dubbing, which shares the grammar.

And a new invariant suite, `quality.test.ts`, runs every model against a full and a minimal brief
in both modes, 228 cases, holding the rules the bench applied by hand: nothing repeats, nothing
contradicts, no meta-text in the paste, nothing typed is lost, no placeholder ships as a finished
line. Its first run caught the tag and JSON grammars silently dropping the user's purpose, which
no other suite had seen.

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

## Phase 13 decisions (Good to Great, parts A and B)

- **`unverified` now has a definition** (see types.ts): cleared only when the pages in `sources`
  were fetched and every prompting claim reconciled against them. Cleared for el-tts,
  el-voicedesign, hume, kling, ltx (the rounds-6-and-7 reconstruction from vendor docs). Midjourney
  and suno keep the badge: their policy pages were read, but their craft claims were not re-walked.
- **Compliance data sourcing rule**: a fact carries a source URL only where POLICY-MANUAL.md cites
  one (§10 lists what was fetched). Facts the manual states without citation — the §6.5 table rows,
  Kling/Runway/Hailuo terms quotes, Microsoft CCC — are populated but wear `unverified: true` with
  empty sources. This includes Recraft's free-tier trap: the manual asserts it emphatically but
  cites no page, so the data keeps the wording and the badge both.
- **brilliant.spec change**: the "policy page not read" example model moved from Veo to Runway,
  because part B read Google's pages. Not a weakening — the assertion is unchanged.
- **mjvideo shares midjourney's compliance sheet** by reference: same guidelines, same terms.
  ElevenLabs' five models share one voice sheet, with the music model overriding the contractual
  prohibited-input list. Veo/lyria/gemini/notebooklm derive from the Google sheet with cited
  differences. Shared objects, not copies, so a correction lands everywhere at once.
- **deepresearch** is populated as "whichever lab ran it", not as a vendor sheet, and is exempt
  from the block-sources invariant alongside the wildcards.

## Phase 13 rounds (the doctor's judge and the adversarial review)

- **The Doctor gets a judge**: scripts/judge-doctor.mjs, ten hostile patients per category, 570
  consultations a round. Its first run caught a real product bug latent since phase 1: dead-weight
  stripping ran on the composed flat, scripts included, so "a beautiful day" spoken aloud became
  "a day". Stripping now happens per-field before composing, and never on script or mLyrics.
- **The banned bank grew 18 to 43**: conversational filler, empty amplifiers and camera-bragging
  tokens, each learned from a doctor round. "Cool" and "epic" deliberately excluded (colour
  temperature; a register someone can mean).
- **rebuild() taught three things** (sanctioned deviation from the prototype, tests updated from
  byte-parity to behaviour): a comma wall keeps all its subject words; quoted words become the
  script verbatim; a voice description is never put in anyone's mouth; exclusions inside prose
  ("with no music") move to the avoid/mExclude field.
- **The adversarial review (fresh-context agent, phase-13 diff only) found 11; 10 accepted, 1
  modified**: PEOPLE_WORDS narrowed (a school of fish is not a child); scaffold now applies chips
  to chip fields; an explicit RAI output code outranks the "every time" answer; hard-line
  categories (child, sexual) refuse wordsmithing outright and hide the bisect, which is section 0
  binding in code; bare celebrity subjects flagged behind person-prepositions; possessives dedup;
  the SW asset cache is bounded; the export-cap finding no longer masked by the ownership one; a
  test that could not fail now can; misquotes and comma artifacts fixed. Rejected: removing the
  bisect itself, which the manual and the plan both mandate; the guardrail was the right fix.

## Phase 13, the second wind (subject classes, Plan mode, the profile)

- **Subject-class autofill**: the day a bare "a dragon" got a softbox and a calm mood, three new
  classes joined PORTRAIT/LANDSCAPE/PRODUCT: CREATURE (low angle, 24mm, rim light, depth layering,
  menacing), STRUCTURE (wide, 24mm, golden hour, leading lines) and VEHICLE (low angle, rim light).
  User words still outrank everything; pinned in craft.test.ts.
- **Plan mode**: a third bench gear. plan() in the engine is the full deterministic interview per
  category (professional asking order, answered fields leave the list); the panel writes every
  answer visibly into the brief; the strike runs Simple underneath so skips are auto-filled and
  explained. Not a chat, same as ever.
- **The profile**: local-only (localStorage), account-page "You" card, copies out as user.md.
  Reaches a prompt only via the "Use my profile" switch (writing models only), where the About-me
  line is visible in the context. Never uploaded anywhere; pinned by e2e.
- **Mode storage unified** on 'forge.bench-mode'; the legacy useMode hook is gone.
- **Palette race fixed**: the lazily loaded command list pre-warms one beat after hydration, and
  the e2e waits for the visible option like a person does.

## The counters and the questionnaire (a deliberate amendment to "no analytics")

Alon asked for an admin view of use. The original decision was "Analytics: none", so this is a
recorded amendment, built to keep the promise that matters: **events, never people, never text.**
usage_counts holds (day, event, n) and nothing else; record_use() is the only writer, admin-gated
reads via admin_emails (ofer.shayo@gmail.com on the live project), all pinned by
packages/data/test/usage.test.ts. What is deliberately NOT collected, and cannot be shown on
/admin because it does not exist: prompts, briefs, identities, sessions, or "most common
questions", which would mean uploading what people type. The account-page privacy copy was
updated to say exactly this. The signup questions (age, line of work, how you heard) live in the
local profile; only "how you heard" bumps an anonymous counter, once.

## The marathon (ten rounds of ten, both arenas, all 57)

- Round-varied content pools (scripts/marathon-pools.mjs, the doctor's THINGS) make every one of
  the 100 battles per model per arena distinct. scripts/marathon.mjs aggregates.
- What the varied content caught, all fixed and pinned: two judge false-positives (a freight
  train is not rain: word boundaries; a hive frame legitimately echoes "off-frame": distinctive
  words only); the Doctor duplicating an entire pasted prompt as subject AND action on video;
  Forge's own intended-use boilerplate being re-doctored as content; exclusion lists captured
  whole ("Without watermarks, text artefacts, extra limbs"); near-duplicate clause folding
  ("a spaceship landing on the moon ... a spaceship lands the moon"); the echo suppressors in
  video prose (action that restates the subject stays unsaid; a setting never reopens with the
  subject's last word); the Doctor's craft lexicon widened (floodlights, backlit, sodium,
  amber-and-slate grades) with proportional clause classification so one craft word never costs
  five subject words.
- Plan became a helper toggle beside Simple/Advanced (Alon's call: planning is how you fill the
  brief for a big prompt, not a third way of composing). The interview says when answers came
  from a pre-filled brief, and Skip is honest per mode.
- Settings audit: 57 of 57 distinct signatures; eleven empty whys written (research category and
  the app wildcard), parity carrying the sanctioned change.

## The 75 bar (Alon: "make the prompts better, they're short and not good")

- Simple mode learned every category: audio performance craft (vTone, vTexture, vArch, sfxKind,
  room, mic, sfxLen, sfxLoop), music craft (mMood by genre valence, mProd, mVocal-when-no-lyrics,
  mStruct as musical form, mExclude), work craft (rules per category, role, length, cScope,
  rGaps, rFormat, format), the professional excludes (watermarks/text artefacts, mouth clicks/
  sibilance), film stocks by subject class, palettes for diagrammatic media, native durations.
  The seed guard: the one field Forge never writes is what the prompt is about.
- The score was recalibrated per category (the ported weights measured everything with an
  image-shaped ruler): word norms per category, structure floors for composed grammars and
  settings-borne structure, constraint applicability (a model with no negative parameter is not
  penalised for lacking one), craft applicability (no lens on a diagram, no lyrics on an
  instrumental), verbatim scripts never fined for vocabulary, motion-only prompts measured with
  their blocks. Parity's score claim is now directional: never worse than the prototype read.
- The judge bar enforces it: every multi-field battle brief scores 75+, single-field 62+, across
  all ten marathon rounds. 5,690/5,690 composer, 5,700/5,700 doctor.
- The shell: one top row (workspaces, Learn/Glossary/Account, theme), one slim scrolling tools
  strip sorted by daily use, and the theme control is Light|Dark, with never-chosen following
  the device. "System" as a visible option read as a duplicate of whichever side the device was on.
