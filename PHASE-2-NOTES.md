# Phase 2 notes

The component layer. Twenty controls, the design tokens, and a gallery route the accessibility
suite runs against. No product screens: those are phase 3.

## What axe caught that a person would not have

1. **An empty listbox holding a sentence.** When a filter matched nothing, the "Nothing matches"
   line sat inside `role="listbox"`, which is invalid: a listbox may only contain options. The note
   now sits outside the listbox, and grouped options are wrapped in a real `role="group"` with a
   label rather than a presentational header.
2. **The ember fill failed contrast in the light theme.** `--ember` is `#C0430A` in daylight, and
   the prototype painted near-black text on it: 3.7 to 1, under the 4.5 the bar requires. It passed
   in the dark theme only because `--ember` is a bright orange there. Two tokens were added rather
   than a literal colour anywhere: `--on-ember`, which is white in the light theme (5.19 to 1) and
   near-black in the dark theme (6.71 to 1), and `--scrim` for the modal backdrop.

Both were found by running axe in both themes rather than in one, which is why the suite does that.

## Deliberate decisions

- **`useRovingFocus` was written and then deleted.** The three grouped controls need real element
  references to move focus, so each implements roving against its own refs in about ten lines. A
  shared hook that none of them could use was dead code.
- **`autoFocus` was renamed `focusOnOpen`.** It is our prop, not the DOM attribute, and the name
  made a linter and a reader think otherwise.
- **State is derived, not synchronised.** The combobox and the palette hold their filter and their
  keyboard position in a child that only exists while the layer is open, so opening one is always
  clean and no effect has to reset anything. The active row is computed during render, so filtering
  cannot leave the keyboard pointing at a row that is no longer on screen.
- **Four `jsx-a11y` rules are off for `packages/ui`, with the reason in the config.** Each assumes a
  native element is available. Section 7 says we draw the control and write the contract by hand, so
  the pattern they object to is the documented ARIA one. Nothing is unchecked: every component has
  an axe check in jsdom, and axe runs in the browser in both themes at three viewports.
- **The gallery is rebuilt on every Playwright run.** Reusing a running server would let a stale
  build pass, which is the one failure this suite exists to prevent.

## What jsdom cannot check, and where it is checked instead

Colour contrast and target size need real layout, so those two axe rules are off in the unit run and
on in the browser run. The arrow keys on a range input are the browser's behaviour, not ours, so the
unit test asserts the contract that earns it, a real `input[type="range"]`, and the e2e suite proves
the keys move it in Chromium.

## Not done in this phase, by design

No product screens, no catalogue in the UI, no glossary copy, no animated mark. `packages/ui` does
not import `packages/catalog` and must not: it takes options and renders them, which is what keeps
the rule that a component naming a model is a bug enforceable.
