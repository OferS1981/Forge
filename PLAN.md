# Forge: PLAN.md for phase 0 and phase 1

(On approval this file is copied verbatim to `forge/PLAN.md` as the first commit of phase 0.)

## Context

Forge is a prompt smithy: a catalogue of 57 AI models, each with its own prompt grammar and
settings, composed deterministically with no network call. `forge-starter/forge.html` is a working
single-file prototype. `forge-starter/FORGE-BUILD-SPEC.md` is the brief for turning it into a
monorepo with tests, a real component layer, a website and a browser extension.

Decisions from Alon (section 21):

| Question     | Answer                                                                                                                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name         | Forge. Domain decided later.                                                                                                                                                                                                                 |
| Repo         | Public, on GitHub.                                                                                                                                                                                                                           |
| Models       | All 57 in phase 1.                                                                                                                                                                                                                           |
| Metaphor     | Keep the hammer-and-anvil mark and the brand. Plain workspace names: **Build, Doctor, Reverse, Match**. Heat becomes **Score** in the UI (the seven steel-colour names stay as the score's labels, because they are useful and distinctive). |
| Sign-in      | Magic link and Google (phase 7).                                                                                                                                                                                                             |
| Share pages  | Yes (phase 7).                                                                                                                                                                                                                               |
| Analytics    | None.                                                                                                                                                                                                                                        |
| Refresh PRs  | Alon, monthly.                                                                                                                                                                                                                               |
| Default mode | Simple (chosen for Alon, per the spec).                                                                                                                                                                                                      |
| Daily use    | The website and the extension are one product. Making prompts (Build) and improving prompts (Doctor) matter most. The extension moves up the build order: it comes straight after the Doctor, not at phase 8.                                |

Phase 0 and phase 1 are engine-only. No screens, no React. What the user sees does not change until phase 3.

## Where the code lives

New folder `~/Claude Code/forge/`, a fresh git repo, sibling of `forge-starter/` (which stays
untouched as the reference). The prototype is copied in as `reference/forge.html` so the parity
test can read it without reaching outside the repo.

```
forge/
├─ package.json            pnpm 9 workspace, scripts: verify, typecheck, lint, test, test:golden, test:a11y, test:e2e
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json      strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes
├─ eslint.config.js        ESLint 9 flat + typescript-eslint strict. no-explicit-any = error, non-null assertion = error
├─ .prettierrc
├─ vitest.workspace.ts
├─ playwright.config.ts    present from phase 0, runs with --pass-with-no-tests until phase 2
├─ .github/workflows/ci.yml
├─ CLAUDE.md               the starter file, extended per spec section 20
├─ PLAN.md                 this file
├─ reference/forge.html    the prototype, read-only
├─ packages/catalog/       phase 1
├─ packages/ui/            empty placeholder package in phase 0 (a package.json and an index.ts), so the workspace shape is real
└─ apps/                   not created until phase 3
```

Everything is on a permanent free tier: pnpm, Turborepo (local cache only, no remote cache), Vitest, Playwright, axe-core, GitHub Actions on a public repo. No paid dependency anywhere.

---

## Phase 0: Scaffold

**Done when:** `pnpm verify` exits 0 locally, the repo is pushed to a public GitHub repo, and the CI run on `main` is green.

### Steps

1. `mkdir forge && git init`. Copy `CLAUDE.md`, write `PLAN.md`, copy `forge.html` to `reference/`.
2. Enable pnpm through corepack (`corepack enable pnpm`, pinned in `package.json` `packageManager: pnpm@9.x`). No global install needed.
3. Root `package.json` with the six scripts and `verify` chaining them with `&&` exactly as section 17 writes it.
4. `pnpm-workspace.yaml` listing `packages/*` and `apps/*`. `turbo.json` with pipelines for `typecheck`, `lint`, `test`, `build`, caching locally.
5. TypeScript 5 strict base config. `packages/ui` placeholder with one exported constant so `tsc` has something to check. `packages/catalog` placeholder too (one file, one test) so `test` runs a real test and not zero tests.
6. ESLint 9 flat config with typescript-eslint `strict-type-checked` plus rules: `no-explicit-any: error`, `no-non-null-assertion: error`. Prettier with `--check` in the lint script.
7. Vitest with a workspace file and coverage via `@vitest/coverage-v8` (free, bundled).
8. Playwright installed with Chromium only (`playwright install --with-deps chromium` in CI). `test:a11y` and `test:e2e` run Playwright against empty test folders with `--pass-with-no-tests`. This is stated plainly in the script names' comments; it becomes real in phase 2.
9. `.github/workflows/ci.yml`: ubuntu-latest, Node 22, pnpm via corepack, cache pnpm store, `pnpm install --frozen-lockfile`, `pnpm verify`. Triggers on push and pull_request.
10. Extend `CLAUDE.md` with the section 20 rules not already in the starter file (the "Do" list, the voice rules, the plain workspace names, the "Score not Heat" naming).
11. Run `pnpm verify`. Paste the output. Commit.
12. Push needs a remote. `gh` is not installed, so: Alon creates an empty public repo named `forge` on github.com (no README, no licence chosen) and pastes the URL. I add the remote and push. I will ask before the push because it is outward-facing.

### Phase 0 gotchas already known

- Node 22.22 is installed, pnpm is not. corepack handles it.
- Turborepo needs a `build` task even if packages have nothing to build; give `packages/*` a no-op `build` so `turbo run build` is green.
- Vitest with zero test files exits 1. Hence the one placeholder test.

---

## Phase 1: Catalogue and engine

**Done when:** `forge()` reproduces the prototype exactly for every one of the 57 models on fixed briefs (parity test), `pnpm verify` exits 0, `packages/catalog` line coverage is 90 percent or better, and the staleness and term-coverage tests are in place and passing.

### 1a. Types (`packages/catalog/src/types.ts`)

Port the spec's `Model`, `Option`, `Field`, `Term`, `SettingRow`, `ForgeResult`, `Brief`, `Mode`, plus ids as string-literal unions built from the data (`ModelId`, `FieldId`, `TermId`, `GrammarId`, `CategoryId`, `AxisId`, `StrengthTag`).

Deviations from the spec's sketch, each for a reason:

- `tags: [string, string, string] | [string, string, string, string]`. Twelve prototype models have three tags; inventing a fourth would be new, unsourced copy.
- `settings: (brief, mode) => SettingRow[]` as specified. Each row gets `tier` and `term`.
- New optional model flags that replace the prototype's seven `m.id === ...` branches inside composers, so composers stay model-agnostic (section 6):
  - `promptSuffix?: (brief) => string` (Midjourney `--ar ... --v 8.2 --stylize ...`, MJ Video `--motion high --raw`)
  - `inlineCameraTokens?: true` (Hailuo `[pan]` `[zoom]` `[static]`)
  - `audioTags?: 'always' | 'creative-only' | 'never'` (ElevenLabs v3 tags depend on use case; generic voice always; others never)
  - `actingInstruction?: true` (Hume's under-100-character direction line)
  - `flatStyleOnly?: true` (Suno: flat is the Style line alone, and the exclude block is labelled "Exclude Styles field")
  - `delimiters: 'xml' | 'markdown'` on llm-grammar models (Claude is xml)
  - `lengthWarningBelow?: number` (the 250-character script warning)
- `Brief` is `Partial<Record<FieldId, string | string[]>>`. The prototype stores exactly that.

### 1b. Data port, wording preserved

- `vocab.ts`: the 24 banks from `V`, verbatim.
- `fields.ts`: the 69 fields from `F`, verbatim labels, hints and placeholders. Each gains `tier` and `term`. Tier rule: every field listed in any model's `core` is `simple`; `aspect` and `duration` are `simple`; everything else is `advanced`. `autoFill` added for the image and video craft fields (`shot`, `lens`, `aperture`, `light`, `grade`, `comp`, `mood`, `camMove`, `pacing`) keyed off `medium`, `purpose` and `subject` words, e.g. portrait + documentary gives 85mm, f/2, softbox, desaturated. Each autoFill returns a value and the `why` sentence Simple mode shows.
- `categories.ts`: the 9 categories with their colour tokens moved to token names (`--cat-image` etc.), not hexes, because colours belong in `packages/ui` tokens. The hexes move to the token file in phase 2; phase 1 stores the token name string.
- `models/<category>/<id>.ts`: 57 files, one per model, content ported verbatim: `blurb`, `tags`, `best`, `worst`, `notes`, `warnings`, `negative`, `settings`, `aspects`, `durations`, `core/craft/tech`. Added per the spec: `sources` (official documentation URLs for that vendor's product), `verifiedOn` (the date the file is written), `unverified: true` on every model until a real verification pass clears it (the app shows the badge honestly), `strengthTags`, `pairsWith`, `betterFor`. The recommendation graph is populated only where the spec or the prototype's own text states the relationship (Veo pairs with ElevenLabs Speech; Midjourney with an upscaler and betterFor Ideogram on in-image text; Suno pairs with ElevenLabs Sound Effects; SDXL betterFor Flux klein as the local recommendation; Runway betterFor Kling/Seedance/Veo on vertical). Everything else is an empty array, not a guess.
- `hosts.ts`: the host-to-model map for the extension, from the spec's list.
- `glossary.ts`: a skeleton. One stub entry per term id referenced anywhere (`label`, `short`, and `what/changes/when` set to a marked placeholder). Phase 4 fills them. The term ids are decided now so the coverage test has something to enforce.
- Em dashes: wildcards get no `maker` (field optional) and Recraft's `substyle` placeholder becomes `none`. En dashes in ranges stay. The parity test compares prompt output, where neither appears, so this does not affect parity.
- Prototype text kept even where it looks dated or odd. Porting, not editing. Anything I believe is wrong goes in a `PORT-NOTES.md` list rather than into the data.

### 1c. Composers (`packages/catalog/src/compose/`)

One file per grammar, 13 files, a `shared.ts` for `imageSections`, `videoSections`, the clause builders, `stripBanned`, `splitBeats`, `markUpScript` and the string helpers (`cap`, `lc`, `stripDot`, `artic`, `deMeta`). Logic ported line for line; the model-id branches replaced by the flags in 1a.

### 1d. Engine (`engine.ts`)

- `forge(brief, model, mode)`: the prototype's `forge()` plus: in Simple mode, run `autoFill` for unset craft fields, record `autoFilled`, then compose. `stripped`, `heat`, `axes` populated. `variations` ported.
- `score()`: `scoreBrief` and `AXES`, weights unchanged.
- `diagnose()`: the `LEX` lexicon and findings, verbatim.
- `rebuild()`: verbatim.
- `match()`: the Matchmaker keyword map, priority matrix and scoring, verbatim, returning grouped results by job.
- `recommend()`: evaluates `betterFor` predicates against the brief, returns at most one; plus `pairsWith` passthrough.
- `translate()`: forge the brief on both models, `lost` lists every filled field the target model does not use, with the reason ("Ideogram has no duration field").
- `explain()`: returns the glossary term with model-specific override when `term.models` includes the model.

### 1e. Tests (`packages/catalog/test/`)

1. **Parity against the prototype** (the phase's definition of done). A script extracts the pure-JS section of `reference/forge.html` (from the `VOCABULARY BANKS` marker to `STATE + STORAGE`; that span touches no DOM) and evaluates it in Node. For every model, two fixed briefs per category (one full, one minimal) are forged in both engines. Assert `flat`, `blocks`, `negative`, `settings` (name, value, why), `notes`, `warnings`, `variations` and `score` are deep-equal. Advanced mode, because Simple adds autoFill the prototype did not have.
2. **Golden files**: forge every model with the fixed brief in both modes, snapshot the full `ForgeResult` to `__golden__/<model>.<mode>.json`. `test:golden` diffs against committed snapshots.
3. **Property test**: no result contains `undefined`, `[object Object]`, a doubled separator (`, ,`, `..`), or a banned word.
4. **Mode parity**: Simple-mode forge with its autoFilled values equals an Advanced-mode forge given those same values explicitly.
5. **Option enums**: every `aspects`/`durations` value on a model is unique and non-empty; every `Field.options` value is in its vocab bank.
6. **Term coverage**: every `Field.term`, `Option.term`, `SettingRow.term` resolves to a glossary entry. Phase 1 allows stub entries; phase 4 flips a flag so stubs fail.
7. **Staleness**: fails when any `verifiedOn` is older than 120 days from today.
8. **Diagnose snapshots** against a set of deliberately bad prompts.
9. **Catalogue invariants**: 57 models, 9 categories each ending in exactly one wildcard, ids unique and slug-shaped, every `core/craft/tech` id exists in `fields.ts`, `sources` non-empty, `tags` length 3 or 4.
10. Coverage threshold 90 percent lines on `packages/catalog` enforced in the Vitest config, so a drop fails `pnpm verify`.

### 1f. Wrap-up

Run `pnpm verify`, paste the output, commit, push, confirm CI green, then ask Alon to clear context before phase 2.

---

## Verification (both phases)

```bash
pnpm verify
```

Must print each of the six steps and exit 0. Output is quoted in chat, not summarised. CI on GitHub must show green on `main` for the same commit.

## Out of scope for these two phases

React, the component layer, the website, the extension, Supabase, the AI layer, the refresh workflow, filling the glossary. They are phases 2 onward and are not started here.

---

# Phase 2: The component layer

Written at the start of phase 2, after phases 0 and 1 landed. Same rules: one phase per session,
`pnpm verify` at 0 before it is called done.

**Done when:** a component gallery route passes axe in both themes at three viewports, every control
is fully operable by keyboard alone, and no native `<select>` exists in the rendered DOM.

No product screens. The Anvil, the rail and the brief form are phase 3. This phase builds the parts
they are assembled from.

## What goes in `packages/ui`

```
packages/ui/
├─ src/
│  ├─ styles/
│  │  ├─ tokens.css        ported verbatim from reference/forge.html, plus the nine --cat-* colours
│  │  ├─ base.css          reset, body, focus ring, scrollbars, reduced motion
│  │  ├─ components.css    one file per control, imported by index.css
│  │  └─ index.css         the single stylesheet a consumer imports
│  ├─ lib/                 tiny hooks: roving focus, dismiss, popover position, ids, a typed store
│  ├─ components/          the twenty controls from section 7
│  └─ index.ts
├─ gallery/                a dev-only Vite page: every control, in both themes. Not shipped.
└─ test/                   an interaction test and an axe check per control
```

Tokens are CSS custom properties, not Tailwind config values, so the extension consumes the same
file. Three theme states exactly as section 15 requires: the complete light palette on bare `:root`,
a `prefers-color-scheme: dark` block guarded as `:root:not([data-theme="light"])` that redefines only
the tokens, and `:root[data-theme="dark"]` so the toggle wins in both directions.

The nine category colours move out of the prototype and into `tokens.css` as `--cat-image` through
`--cat-research`, which is the last part of the phase 1 port. After this, no colour lives outside the
token file.

## The controls

All twenty from section 7: `Button`, `Combobox`, `Listbox`, `ChipGroup`, `Segmented`, `TextField`,
`TextArea`, `Slider`, `Switch`, `Popover`, `Dialog`, `Tooltip`, `Tabs`, `Table`, `Toast`, `DropZone`,
`Disclosure`, `CommandPalette`, `InfoDot`, `CoachMark`.

The rule for every one of them is **custom appearance, native semantics**. Same roles, same states,
same keyboard behaviour the native control would have. Where a native element can carry the
semantics, it is used and styled: the slider is a real `input[type="range"]`, the switch a real
checkbox, the drop zone a real file input. Where none exists, the ARIA pattern is implemented in
full.

`Combobox` is the important one, because it is the model picker: a command-style combobox, not a
dropdown. Filter input, results grouped by category with a sticky header, a colour dot, a one-line
strength, arrow keys, Home and End, Enter, Escape, type to filter. A compact variant serves aspect
ratio, duration and every other option list. The keyboard contract is ported from the prototype's
picker, which already gets it right.

`packages/ui` must not name a model. It takes options and renders them. The catalogue stays the only
place that knows what a model is, so the components take plain data and the tests use invented
fixtures, not real model ids.

## Tests

- One Vitest interaction test per control, driven by keyboard only through `@testing-library/user-event`.
- An axe-core check per control in jsdom, so a broken ARIA contract fails the unit run.
- `e2e/a11y/gallery.spec.ts`: axe against the gallery in light and dark, at 1500px, 820px and 375px.
- `e2e/smoke/gallery.spec.ts`: keyboard-only operation of the combobox, dialog, tabs and chips, plus
  the assertions from section 17: no console errors, no horizontal overflow, and no `<select>` in the
  DOM.
- Coverage stays at the 90 percent threshold, now across both packages.

## New dependencies, all free

`react`, `react-dom`, `@types/react`, `@types/react-dom`, `vite`, `@vitejs/plugin-react`, `jsdom`,
`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `axe-core`,
`@axe-core/playwright`. Every one is MIT or Apache, with no paid tier anywhere in the critical path.

## Out of scope

The web app, the rail, the brief form, the animated mark, the glossary copy, and anything that reads
the catalogue. Phase 3 onwards.

---

# Phase 3: The Anvil, and phase 4: the explain layer

Written at the start of this session. Alon asked for both phases in one sitting, so they are planned
together and built in order, each ending at `pnpm verify` exit 0.

## Phase 3: The Anvil

**Done when:** axe is clean on every route in both themes, the e2e smoke passes at three viewports,
and the mode-parity test from section 8 passes.

This phase builds the **Build** workspace only. Doctor, Reverse and Match are phase 5. What lands is
the app shell, the rail, the adaptive brief, the forged output, both themes, the animated mark, and
Simple and Advanced modes.

```
apps/web/
├─ next.config.ts          static export, so it serves from any free host
├─ src/app/
│  ├─ layout.tsx           the shell: skip link, top bar, toast region
│  ├─ page.tsx             the Build workspace
│  └─ styles.css           app layout over the same tokens
└─ src/components/         Mark, TopBar, ModelRail, Brief, Output, ScoreMeter
```

- **The rail** is the command-style combobox from phase 2 in its full variant, plus a filterable
  list of all 57 models grouped by category with the colour dot, the recommended marker on each
  category default, and pins persisted locally.
- **The brief** is generated from `FIELDS` and the chosen model's `core`, `craft` and `tech` lists.
  Nothing in `apps/web` names a model or a field: it reads the registry and renders the control the
  field's `type` asks for. Simple mode shows `core` and the simple tier only, Advanced opens the
  craft layer in a disclosure.
- **The output** carries the prompt in named sections, a flat copy, the negative block with the
  model's own note, the settings table, why it is written this way, the traps, three other
  directions, and in Simple mode the line naming what Forge chose and why, with each choice a
  button that opens that one field in Advanced mode.
- **Score**, not Heat, on the seven steel labels.
- **The mark** is the hammer and anvil on a canvas, ported from the prototype, striking when a
  prompt is forged, and still when `prefers-reduced-motion` is set.

### One deviation from the stack table, to flag rather than bury

Section 3 lists Tailwind v4 for styling. `packages/ui` already ships plain CSS over the token file,
which the extension will reuse as is. Adding Tailwind would mean two styling systems in one product
for no capability we lack, so `apps/web` uses plain CSS over the same tokens. The requirement that
matters, "tokens must be real CSS variables so the extension reuses them", is met either way. Say so
and it changes.

## Phase 4: The explain layer

**Done when:** the term-coverage test passes with zero exemptions, meaning `ALLOW_STUBS` is `false`
and no stub is left.

The glossary skeleton from phase 1 holds **251 term ids**: 69 fields, 24 vocabulary banks and 158
settings rows. Every one gets `short`, `what`, `changes` and `when`, plus a range and a low and high
example where the term is a dial.

- Copy is written to the teaching voice in `CLAUDE.md`: what it is, what changes, when to use it.
- Info dots on every field label, chip group and settings row, using the phase 2 component.
- `i` on a focused chip opens the same explanation, which costs no tab stop.
- A `/glossary` route: every term, grouped, searchable, deep-linkable at `/glossary#term-id`.
- The command palette searches terms alongside models and workspaces.

Then `ALLOW_STUBS` flips to `false` and the build fails the day someone adds a control without one.

## Out of scope for both

The other three workspaces, cross-forge, batch, recipes, compare, the tutorial, accounts, the
extension, the AI layer and the refresh workflow.

---

# Phase 5: The other workspaces

**Done when:** every workspace has an e2e test, axe is clean on every route in both themes, and
`pnpm verify` exits 0.

Phase 3 built the Build workspace and phase 4 the explain layer. The engine for everything below
already exists and is tested: `diagnose`, `rebuild`, `match`, `seedBrief`, `translate` and
`recommend` all landed in phase 1. This phase is mostly screens over functions that already work.

## What is missing from the engine, and goes in first

Three pure additions to `packages/catalog`, each with tests, because they are product logic rather
than page logic:

- `analysePixels()` and `nearestRatio()`. The prototype measures an image on a canvas. The canvas
  belongs to the browser, but the arithmetic does not, so the app hands over raw pixels and the
  catalogue turns them into an `ImageStats`. That keeps the measurement testable without a browser.
- `briefFromStats()`. The mapping from measurements to a brief: exposure key to a lighting choice,
  edge density to a shot size, warm and cool balance to a grade. Ported from the prototype's
  `runReverse`.
- `diffPrompts()`. Word-level difference between two prompts, for Compare.

## The routes

Each is a thin consumer of the engine, sharing one bench layout with the Build workspace.

| Route          | What it does                                                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/doctor`      | Paste a prompt that under-performed. Eight axes, what is doing no work, the re-smithed version, and the score before and after. Every finding links into the glossary.                         |
| `/reverse`     | Drop an image or a text file. Report honestly what a browser can measure, say plainly that it cannot see what the picture is _of_, ask for that, and build the prompt around the measurements. |
| `/match`       | Describe the job. When it needs more than one kind of model, split the answer by job with a first choice and an alternative for each.                                                          |
| `/cross-forge` | The same brief in two models' grammars, side by side, with what was lost and why.                                                                                                              |
| `/batch`       | One brief, several models, results in a row.                                                                                                                                                   |
| `/compare`     | Two prompts, with what actually changed marked, so an edit can be traced to its effect.                                                                                                        |
| `/recipes`     | Save a brief as a template with some fields locked and others open, then reuse it. Stored locally now; phase 7 moves it to an account.                                                         |

`recommend()` was already wired into the Build workspace in phase 3. The command palette gains the
workspaces and any saved recipes alongside the models and glossary terms it already searches.

## Honesty rules this phase has to hold

- Reverse Forge measures geometry, exposure, contrast, chroma, warm and cool balance, edge density
  and a quantised palette. It says in the interface that it cannot see the subject, rather than
  guessing one. That line goes when the AI layer arrives in phase 9, not before.
- The Doctor rebuilds a prompt from a lexicon, not from a model call. Its findings say what is
  missing, never that the prompt is bad.

## Out of scope

The tutorial and Learn (phase 6), accounts and sharing (phase 7), the extension (phase 8), the AI
layer (phase 9). Recipes are stored in the browser only until phase 7.

---

# Phase 6: Tutorial and Learn

**Done when:** a new visitor with `localStorage` cleared can complete the walkthrough by keyboard,
axe is clean on every route in both themes, and `pnpm verify` exits 0.

Section 10 asks for two different things, and both are required.

## The first run

A five-step coach-mark walkthrough over the real interface, not a video and not a slideshow. It
uses a real example brief, can be left at any point, resumes where it stopped, and keeps its state
in `localStorage`.

The five steps are the ones section 10 names: the rack, the brief, the strike, the prompt, the
settings. **Built from a data file**, so the words can be rewritten without touching a component.
The `CoachMark` component has existed since phase 2 and has never been used by a page: this is
what it was built for.

Two things the walkthrough must do that a tour usually does not:

- **Fill the example brief itself**, so step three has something real to strike and step four has a
  real prompt to point at. A tour that shows an empty form teaches nothing.
- **Be operable by keyboard alone**, which is the phase's definition of done. Each mark traps
  focus, `Next` advances, `Escape` and `Skip` both leave, and leaving is remembered.

## The strongest onboarding move

Section 10 is blunt about this: the Doctor's empty state should say **paste a prompt you already
use**, because taking the visitor's own work apart and rebuilding it in ten seconds is more
convincing than any tour. It asks for that to be the first thing a new visitor sees on the landing
route, so the Build workspace carries a dismissible invitation to it until the visitor has forged
something or dismissed it.

## Learn

Six short lessons, the ones section 10 lists, at `/learn` and `/learn/<slug>`:

1. What a lens actually changes
2. Why lighting is the highest-yield thing in an image prompt
3. Why negative prompts work on some models and not others
4. How to write motion for a video model instead of describing a photograph
5. How to direct a voice with punctuation
6. Why `masterpiece, 8k` stopped working

Each lesson is a markdown file in the repo and ends with a **try it** button that loads that
lesson's demo brief into the Build workspace, so the reader immediately does the thing rather than
only reading about it.

### One decision to flag

Section 10 says markdown files. Rendering them needs either a markdown dependency or a small
renderer. This phase writes a small one, about a hundred lines, in `packages/ui`, because the
lessons are our own files rather than user input, and because rendering to React elements instead
of an HTML string means there is no `dangerouslySetInnerHTML` and therefore no injection surface at
all. It handles the subset the lessons use: headings, paragraphs, lists, code, emphasis, links and
block quotes. If it ever needs to handle arbitrary markdown, swap it for a real parser then.

## Out of scope

Accounts and share pages (phase 7), the extension (phase 8), the AI layer (phase 9). Lesson
progress is remembered in the browser only.

---

# Phase 7: Accounts and library

**Done when:** the row level security policy tests pass against real Postgres, a signed-out visitor
still has every feature including sharing, axe is clean on the new routes in both themes, and
`pnpm verify` exits 0.

Section 13 asks for Supabase, RLS on every table with the policies written before the tables are
used, folders, saved prompts, recipes, pins, shares at a public read-only page, and a one-click
import of local work on first sign-in. Two rules constrain how that can be built:

- **A signed-out user has the whole app.** So the library is a local library first, and an account
  is a place to sync it to. Not a gate in front of it.
- **`pnpm verify` has to prove it.** There is no hosted project to test against, and there never
  will be one inside `verify`, so the parts that can be proven have to be separated from the part
  that cannot.

## What can be proven, and how

The policies are the security boundary, so they are the thing that must be tested rather than
assumed. `@electric-sql/pglite` is Postgres 16 compiled to WebAssembly: the real planner, the real
row level security, running in Node with no server, no Docker and no account. The test harness
creates the `anon` and `authenticated` roles and the `auth.uid()` function exactly as Supabase
defines them, runs the migration files unedited, and then attacks the tables as two different
signed-in users and as an anonymous visitor.

Every policy gets a test that it lets the owner through and a test that it stops everyone else. A
table with row level security left off fails a test that reads `pg_class` directly, so a table
added later without policies cannot pass quietly.

## The shape

`packages/data`, a new package with **zero runtime dependencies**, the same rule as the catalogue.

```
sql/001_library.sql     tables, policies, the share function. Run by the test, not by the app.
src/types.ts            the row types and the Library interface
src/local.ts            the local library, over an injected storage
src/remote.ts           the account library, over an injected RemotePort
src/share.ts            encode and decode a share to a URL fragment
src/merge.ts            local work into an account, once, on first sign-in
src/store.ts            the snapshot the app subscribes to, framework free
```

`RemotePort` is six methods. `apps/web` implements it over `@supabase/supabase-js`, which is
loaded only when a project is configured. Keeping the port narrow means `remote.ts` is unit tested
against a fake and the untestable surface is about forty lines at the edge, rather than the whole
library layer.

## The routes

- **`/library`** folders, saved prompts, pinned models and recipes in one place. Works signed out.
- **`/account`** sign in by magic link or Google, what is synced, the import of local work, sign
  out. With no project configured it says that plainly and points at the local library.
- **`/p`** the public read-only share: the prompt, the settings and the score, and a button that
  opens it in Build.

Saving and sharing are added to the Build output, which is where a prompt worth keeping appears.

## Shares without a server

The spec writes shares as `/p/<slug>` backed by a row. A static export has no server to resolve an
arbitrary slug, and an anonymous visitor has no row to make. So a share carries its brief in the
URL fragment: `/p/#<encoded>`. The fragment is never sent to a host, the link needs no database,
and it works for signed-out users, which the spec's own "anonymous users get everything except
cloud sync" requires. An account additionally mints a short slug, `/p/#s=<slug>`, resolved by a
`security definer` function so that anonymous readers can resolve one share they hold the slug for
and cannot list anybody's prompts.

What is stored is the brief, never the rendered string, so a share re-forges on the reader's
machine against today's catalogue.

## Deliberate departures from the section 13 sketch, with reasons

- **No `view_count`.** It is per-share analytics, and `CLAUDE.md` says no analytics. The rule wins.
- **No `result jsonb` on `prompts`.** Section 13's own next line says a stored string is dead and a
  stored brief can be re-forged. The column would be the dead thing.
- **`heat` is `score`**, matching the name the product uses.
- **`shares` carries `user_id`.** Ownership through a subquery on the prompt is slower and is a
  recursion hazard in a policy. One column removes both.

## Out of scope

The extension (phase 8), the AI layer (phase 9), realtime, avatars, file storage. No billing table,
no plan column, no Stripe, per section 2 and `CLAUDE.md`.

---

# Phase 8: The extension

**Done when:** the extension builds, loads unpacked, opens the right anvil for the site you are on,
and pastes into Midjourney, ElevenLabs and Suno with a clipboard fallback everywhere else. Plus the
standing bar: axe clean, `pnpm verify` at 0.

Section 14 says the extension consumes `packages/catalog` and `packages/ui` directly, which is the
whole reason for the monorepo. It is also the least testable thing in the product: a browser
extension needs a browser, and the paste adapters depend on other people's markup, which changes.

So the split is the same one phase 7 used. **`packages/extension`** holds everything that can be
tested in Node: the manifest, built from `HOSTS` so it can never drift from the catalogue, and the
per-site paste adapters, written as pure functions over a `Document` and tested in jsdom against
fabricated markup. **`apps/extension`** is the wiring: a service worker, a content script and the
side panel, all thin.

The side panel is an ordinary web page that happens to run inside a side panel. Every browser API
it needs goes through one small bridge that falls back when `chrome` is not there, so the panel can
be served and driven by Playwright like any other page, which is how it gets a real end-to-end test
rather than a mocked one.

## Adapters

Three to start, as section 14 says. Each one is `find` and `write`, and each degrades quietly:

- **Midjourney**, **ElevenLabs** and **Suno**, matched by host through the catalogue's own map.
- Everything else falls back to the clipboard, which is not a failure and does not say it is.
- An adapter that cannot find its field says so in one line and offers the clipboard.

Writing into a React-controlled field needs the native value setter and an `input` event, or React
overwrites it on the next render. That is the part that actually breaks, so it is the part with the
most tests.

## Out of scope

Publishing to a store, which is a registration fee and a decision, not code. Firefox packaging
beyond the manifest being valid for it.

---

# Phase 9: The AI layer

**Done when:** every test still passes with the assistant forced to null, which is section 19's
own bar, and the key never leaves the device.

`packages/ai`, exporting section 12's interface and three implementations.

- **`NullAssistant`** is the default, `available: false`, every method rejects with a typed
  `AssistantUnavailable`. The whole app works on it, and every control that could use the assistant
  renders a sensible state rather than an error. This is the state the entire existing test suite
  runs in, and it stays that way.
- **`BrowserKeyAssistant`** uses a key the person pastes. It is kept in `localStorage` on their
  machine, never sent to our server, never logged, never put in a URL. The request goes from their
  browser straight to the vendor.
- **`ServerAssistant`** is a stub behind the same interface, so funding one later is a swap.

The rules from section 12 are the tests: a panel that says where the key is kept with a one-click
delete, client-side rate limiting so a mistyped loop cannot burn someone's credit, and every piece
of AI output labelled as AI-assisted.

Where it shows up: describing a dropped image in Reverse, and a second opinion in the Doctor. Both
are additions to a screen that already works without them, never replacements.

`packages/ai` takes an injected `fetch`, so the request shape, the headers, the rate limiter and
the error handling are all tested in Node without a key and without a network.

---

# Phase 10: The refresh pipeline

**Done when:** a manual run produces a per-category report with a citation for every claim, and the
workflow that opens the pull request is in the repository and valid.

Section 18 is what decides whether Forge is alive in a year. The catalogue carries `sources` and
`verifiedOn` on all fifty-seven models, and the staleness test turns the build red 120 days after
that date. What is missing is the thing that clears it.

`scripts/catalog-refresh.mjs` and `.github/workflows/catalog-refresh.yml`, monthly and manually
triggerable, one run per category.

The script has two halves, and only one of them needs a model:

- **The report is deterministic.** For a category it reads every model file and emits, per model,
  every claim the file makes that a vendor page could contradict, with the `sources` URL that
  should settle it. That runs anywhere, needs no key, and is unit tested.
- **The agent fills it in.** With a key configured, the workflow runs an agent over that report,
  fetches each source, and proposes a diff with a citation per change and a bumped `verifiedOn`.

A human merges. Never auto-merge a catalogue change: the workflow has no write permission on
`main`, it opens a pull request, and the pull request template says what to check.

Without a key the workflow still runs and publishes the report as the job summary, so a manual run
is useful on its own rather than being a no-op that hides a missing secret.

---

# Phase 11: The CLI and the MCP server

**Done when:** `forge` builds a prompt from a shell, the MCP server answers a real client over
stdio, and both are thin enough that neither can hold a fact the catalogue does not.

Section 19 calls this optional and says why it is worth doing anyway: both are thin wrappers over
`packages/catalog` once it exists, which is the payoff for the monorepo. Section 22 puts it more
strongly for the MCP half: it is the route from website to infrastructure. Forge stops being a
place you go and becomes a thing another agent calls in the middle of its own task.

## The split, a fourth time

Same shape as phases 7 through 10, because it keeps working.

- **`packages/cli`** turns an argument list into text. Pure: no `process`, no `console`, no exit.
  `run(argv)` gives back a code and two strings, so every command and every error is tested in Node.
- **`packages/mcp`** turns one JSON-RPC request object into one response object. Pure again, so the
  whole protocol, every tool and every malformed request is tested without spawning anything.
- **`apps/cli`** and **`apps/mcp`** are the pumps: read, call, write, exit. About thirty lines each,
  and both get an end-to-end test that spawns the real binary and talks to it.

## The flags are the catalogue

`forge build midjourney --subject "a dragon" --lens 35mm` takes its flag names from `FIELDS`, so
every field in the catalogue is already a flag and adding one changes nothing here. A flag that is
not a field is an error naming the ones that are, rather than being ignored.

## What the MCP server offers

Five tools, each one an engine function that already exists and is already tested:

- `forge_prompt` writes a prompt for a model, in that model's grammar, with its settings.
- `diagnose_prompt` scores a prompt and names what is doing no work.
- `match_models` takes a job and returns the models that are good at it.
- `list_models` is the catalogue, filterable by category.
- `explain_term` is the glossary.

No tool writes anything, opens anything or reaches the network, so the whole server is safe to run
with no permissions at all. That is worth stating in the tool descriptions, because an agent
deciding whether to call something reads those.

## Out of scope

Publishing either to a registry. Both run from the repository, which is what section 14 said about
the extension too.

---

# Phase 12: The changelog

**Done when:** a catalogue change is visible to everyone on a public page, and to a signed-in person
as the sentence that actually matters: how many of their saved prompts it touches.

Section 22 lists seven ideas and says to raise them when the phase arrives rather than building them
unasked. Alon asked for a twelfth phase without naming it, so this is the choice and the reasoning.

**Chosen: the model changelog feed, and the public page built from the same data.** Section 22 lists
them separately but they are one feature seen from two sides, and both are already paid for. Phase
10 produces catalogue diffs. Phase 7 knows which prompts somebody saved and which model each one
uses. Joining those two is the sentence section 22 writes itself: "Midjourney V8.3 shipped and
`--exp` behaves differently. Four of your saved prompts use it." Nothing else on the list turns
maintenance into a feature rather than a cost.

**Not chosen, and why.** The cost estimator would need per-model prices, which go stale faster than
anything else in the catalogue and have no source that stays right; it is also pricing copy in a
product whose rules say there is none. Style packs and prompt lineage are good and are additions to
the library rather than to the catalogue, so they belong after this. Local model support is a
catalogue job, not a feature. The MCP server is phase 11.

## The shape

- **`packages/changelog`**, pure: given two catalogue snapshots, what changed, per model, in the
  words the change actually happened in. A version moved, a setting's default changed, a warning
  appeared or went. Not a text diff: a diff of the claims phase 10 already knows how to extract, so
  the two halves of the maintenance story use one definition of "a claim".
- **A snapshot is committed** each time the catalogue changes, so the history is in the repository
  rather than in a service. It is generated by a script and checked by a test, which means a
  catalogue change with no snapshot fails the build.
- **`/changes`** is the public page: what changed, when, and which models. Free, and it needs
  nobody to be signed in.
- **In the library**, the same data becomes personal: a line on each saved prompt whose model
  changed since it was saved, with what changed and a button to forge it again.

That last part is the reason a saved prompt keeps the brief rather than the rendered string, which
phase 7 argued for and could not yet demonstrate. This is the demonstration.

## Out of scope

Email or push about a change: no notifications, no analytics, nothing that needs a server. The page
and the library line are both read from data already in the repository.

---

## Phase 13: Good to Great — audit, compliance layer (parts A and B)

Ordered by Alon via GOOD-TO-GREAT.md. Part A audited the twelve phases (findings table delivered
in chat; verify green, goldens/staleness/terms proven mutable-to-red, RLS proven live, zero native
controls/billing/any). Part B built the one specified layer that never had a phase: Compliance and
Rights, from POLICY-MANUAL.md section 9.

### Part A fixes

- `unverified` got a written definition (types.ts) and a real pass cleared it on the five models
  whose prompting claims were reconciled against fetched vendor pages: el-tts, el-voicedesign,
  hume, kling, ltx. 52 of 57 still wear the badge, honestly.
- Public API pruned: string helpers (`cap`, `lc`, `stripDot`, `deMeta`, `arr`, `stripBanned`,
  `wordCount`) and numeric internals (`clamp`, `weigh`, `nearestRatio`, `seedBrief`) are no longer
  exported from the package indexes. Slider, Tabs and Tooltip stay: spec §7 mandates the component
  inventory, and Tabs now has a consumer (the Doctor's mode strip).
- The a11y lesson-slug list is drift-guarded: a test compares it against what /learn renders.
- Bundle (catalogue on first paint) is deferred to Part C, where the performance budget and its CI
  enforcement land together. Recorded as the one unfixed finding, with that reason.

### Part B

- **B1**: `PolicyBlock`, `RightsBlock`, `ProvenanceBlock`, `RefusalBlock` (types.ts, §9.1 shapes
  plus per-block `sources`/`verifiedOn`/`unverified`). Data in `models/compliance/` — one file per
  category mirroring the manual's vendor sheets, shared vendor constants, composed onto the 57
  `ModelSpec`s in models/index (typed-complete record: a model without a sheet cannot compile).
  90-day staleness on policy blocks, 120 on the rest. Sourceless facts wear `unverified`; the three
  user-biting traps (Recraft free tier, Suno retroactive caps, Google EU/UK child wall) are pinned
  by invariants.
- **B2**: pure engines — `compliance()` (proper-noun shape detection with decompose offer, register
  check, negative constructions incl. the --no split, intensifiers, per-vendor trip lines, rights
  surprises), `decompose()` (8 visual / 9 audio axes), `rights()`, and the refusal engine
  (`parseRefusal` with the Vertex RAI table, `diagnoseRefusal`, `splitHalves`). Five golden
  snapshot cases as the definition of done demands.
- **B3**: the Compliance Pass (between brief and Strike, live, collapsed to one line, dismissible
  with session memory, never a gate), the Rights card in the Output, and the Refusal Doctor as a
  second mode of the Doctor (tabs; /doctor#refusal deep link; honest per-vendor appeal paths;
  interactive bisect).
- **B4**: 18 concept terms in the glossary ("The rules of the road" group) and two lessons:
  `blocked` and `style-without-naming`, both with try-it briefs.
- The old `policy?: string` field and its billet were subsumed by `policy.tripLines`.

Part C (hardening) awaits its own session.
