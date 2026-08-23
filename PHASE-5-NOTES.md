# Phase 5 notes

The other workspaces. Doctor, Reverse, Match, Cross-forge, Batch, Compare and Recipes, each with
an e2e test, which is what this phase is done by.

## Three additions to the engine, because they are product logic

The screens are thin. What was genuinely missing sat in `packages/catalog`:

- **`analysePixels()` and `nearestRatio()`.** The prototype measures an image on a canvas. The
  canvas belongs to the browser, but the arithmetic does not, so `apps/web` draws the picture small,
  reads the pixels back and hands them over. The measurement now has seventeen unit tests and needs
  no browser to run them.
- **`briefFromStats()`.** The mapping from measurements to a brief: exposure key to a lighting
  choice, edge density to a shot size and an aperture, warm and cool balance to a grade. It fills
  only what the pixels justify and never invents a subject.
- **`diffPrompts()`.** A word-level difference built on a longest common subsequence, so an edit
  reads as an edit rather than as a wholesale replacement. A test rebuilds both sides from the diff
  to prove nothing is lost in it.

`isBriefEmpty()` and `filledFields()` were added too, because four workspaces need them and each
writing its own version is how they drift apart.

## What axe caught, again in the light theme, and once in the dark

1. **The primary button failed contrast on hover.** The light theme's `--strike-a` was _lighter_
   than its resting `--ember`, so white on it measured 3.80. It now darkens on hover, at 5.55,
   which is also the conventional direction. This only appeared now because phase 5 is the first
   time a test clicks a primary button and then looks at it.
2. **The diff's removed text failed on its own background.** `--crit-text` is measured against the
   page, and the diff paints it on `--surface-3`, which is lighter. Three more tokens rather than a
   literal: `--warn-on-raised`, `--good-on-raised` and `--crit-on-raised`, all past 5.7 to 1.

## Deliberate decisions

- **Each workspace is the same bench.** One `Workspace` component: what you give it on the left,
  what it makes on the right. The shape of the product is one shape.
- **Cross-forge, Batch and Recipes work from the brief you already wrote**, rather than asking for
  it again. That is the point of the brief being the source of truth rather than the prompt string.
- **Batch offers only models in the same category.** A speech model cannot read an image brief, and
  offering it would be a promise the engine cannot keep.
- **Recipes key on the name.** Saving twice under one name replaces rather than duplicates, which
  is what a person means by saving again.
- **Navigation goes through the Next router**, not by assigning to `window.location`. It is a real
  client transition, and the React rules correctly refuse to have that value mutated.
- **A second nav row** carries Cross-forge, Batch, Compare and Recipes. They are tools rather than
  workspaces, and putting seven items in the top bar would have made none of them findable.

## The honesty rules this phase had to hold

- Reverse Forge says, in the interface, that it cannot see what the picture is _of_, and asks. It
  does not guess a subject from a palette. That line goes when the AI layer arrives in phase 9.
- The Doctor's findings say what is missing and what it would do, never that the prompt is bad. The
  diagnosis is a lexicon, not a model call, and the lede says so.

## Not done in this phase, by design

The tutorial and Learn (phase 6), accounts and share pages (phase 7), the extension (phase 8) and
the AI layer (phase 9). Recipes live in this browser until phase 7 gives them somewhere better.
