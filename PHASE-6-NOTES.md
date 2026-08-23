# Phase 6 notes

The tutorial and Learn. A first run over the real interface, the invitation that section 10 calls
the strongest onboarding move, and six lessons that each end by loading their own example into the
Build workspace.

## The first run

Five coach marks, from a data file rather than from strings in components, so the words can be
rewritten without touching code. `CoachMark` was built in phase 2 and had never been used by a
page: this is what it was for.

Two things it does that a tour usually does not:

- **It fills the example brief itself, and strikes it.** Step three has something real to strike
  and step four has a real prompt to point at. A tour that gestures at an empty form teaches
  nothing.
- **It is operable by keyboard alone**, which is the phase's definition of done and is asserted by
  a test that clears `localStorage`, arrives fresh, and completes all five steps with Enter.

It can be left at any point with Escape or Skip, it resumes where it stopped, and once left it is
never shown again unless the visitor asks with **Show me around**.

The marks anchor by `data-tour` attribute rather than by ref, because the four things they point at
belong to four different components and threading refs through all of them would tie the tour to
their shape. The lookup waits on `requestAnimationFrame`, because the prompt and the settings do
not exist until the step before has struck.

## The invitation

Section 10 is blunt: the Doctor's **paste a prompt you already use** is more convincing than any
tour, and should be the first thing a new visitor sees. So the Build workspace carries it until the
visitor forges something or dismisses it.

The first version of it was a filled panel with a paragraph and two buttons. Alon said it looked
bad and he was right: it read as an advertisement for the product you are already using. It is now
one quiet line with a link and a dismiss.

## Learn

Six lessons as markdown files in `apps/web/src/lessons`, rendered at `/learn/<slug>`, each ending
with a button that loads that lesson's brief into the Build workspace in Advanced mode, on the
right model, with the craft layer open.

### The markdown decision

Section 10 says markdown files, which needs either a dependency or a renderer. This phase writes a
small one in `packages/ui`, about 150 lines with 19 tests, because:

- the lessons are our own files, not anything a visitor can write,
- it renders to React elements rather than an HTML string, so there is no
  `dangerouslySetInnerHTML` and no injection surface at all, which a test asserts,
- it handles exactly the subset the lessons use.

If it ever has to read arbitrary markdown, swap it for a real parser then.

## Three real bugs this phase found

1. **Several `setField` calls in a row kept only the last.** Each read the same stored map and
   wrote the whole thing back, so filling a brief field by field silently lost all but one field.
   Both new features hit it at once. Fixed with `setFields`, a single batched write, which is the
   right API for this and now the only way anything fills a brief wholesale.
2. **Changing theme animated every surface.** Controls transition their background, which is right
   on hover and wrong when the palette changes: the whole page smeared for a tenth of a second, and
   axe caught it by measuring a colour that existed for one frame. `applyTheme` now suppresses
   transitions for a frame while the palette swaps.
3. **Wrapped list items in markdown were split into separate paragraphs.** Caught by looking at the
   first rendered lesson rather than by a test, which is why looking is still part of the job.

## What Alon caught, and what changed

- **The panel showed the sections but not the prompt.** The pasteable version was only reachable
  through a Copy button, so the named sections read as though they were the prompt. The flat
  prompt now leads the panel in a copyable block that says which model to paste it into, the
  sections are folded underneath as the explanation, and **Copy everything** is now **Copy the
  whole record** with a line saying it is not the thing to paste.
- **Simple mode should give fewer options.** It does, and a test now enforces it: Simple asks fewer
  questions, shows fewer settings rows, and leaves out the variations, while producing a prompt
  that is longer than Advanced's from the same bare brief, because Simple fills the craft layer.
  That is section 8's rule, fewer decisions and not a worse prompt, as an assertion rather than a
  claim.

## A note on the older tests

A first-time visitor now gets the walkthrough, which traps focus, so every suite written before
this phase arrives as a returning visitor by seeding `localStorage`. Only
`e2e/smoke/tutorial.spec.ts` arrives with nothing remembered, which is the point of it.

## Not done in this phase, by design

Accounts and share pages (phase 7), the extension (phase 8), the AI layer (phase 9). Lesson
progress is not tracked at all: there is nothing to track until there is an account to track it in.

## After the first CI run

The first CI run for this phase failed, on Linux, where the fonts are wider than they are here:
the top bar overflowed the page by 20 pixels at 375px. Adding the **Learn** link had pushed it past
the width, and because the tabs strip would not shrink, the whole page gained a sideways scrollbar.
That is a real bug for anyone on a phone, not only for the test.

The bar now wraps, the tabs strip is allowed to shrink and scroll inside itself, and below 820px
the secondary links take their own row. Measured at 375px with text forced 25 percent wider than
ours: zero overflow on every route.

## The prompt Forge writes, after Alon compared it with Gemini's own

Alon put the same brief through Nano Banana Pro and asked the model to write the prompt itself. The
model's version wrote every clause as a sentence. Forge's wrote a token list:

```
Medium shot, 35mm, f/5.6. Softbox key camera-left. Teal and orange grade.
```

And the catalogue's own note on that model reads: _"Google's own docs ask for narrative descriptive
paragraphs, not keyword lists. Forge writes it that way."_ It did not. That is worse than a thin
prompt: it is a claim the product does not keep.

Two models carry documentation asking for descriptive prose, and both say so in their own notes:
Nano Banana Pro, and FLUX.2 with "Detail is rewarded, not diluted". They now carry
`prose: 'narrative'` and their clauses are written as sentences:

```
Framed as a medium shot on a 35mm lens at f/5.6. Lit by softbox key camera-left.
Captured on Kodak Portra 400 and graded teal and orange. Composed using rule of
thirds. The mood is calm.
```

The narrative form also keeps the descriptive half of a vocabulary entry that the terse form throws
away: `f/1.4, creamy bokeh` stays whole rather than being cut to `f/1.4`.

**Nothing is invented.** A test asserts that every value in the output came from the brief, and
that the words a model would reach for on its own, `majestic`, `serene`, `vast`, `barren`, never
appear. Forge is not competing with the model at writing; it is giving the model what its own
documentation asks for. Where a vendor documents that terse token lists work better, the terse form
stays, and a test asserts the other prose models did not change.

The parity test excludes exactly those two models and asserts the flag is the reason. Four golden
files changed, which is the reviewable diff they exist to produce.
