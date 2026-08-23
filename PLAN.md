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
