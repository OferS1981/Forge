# Phase 3 notes

The Anvil. The website, the rail, the adaptive brief, the forged output, both themes, the animated
mark, and Simple and Advanced modes. The Build workspace only: Doctor, Reverse and Match are
phase 5 and their tabs say so rather than pretending to be there.

## What axe caught, again in the light theme only

1. **The status colours failed as text.** `--warn` measures 3.71 to 1 against the daylight ground,
   so the "Unverified" badge was unreadable. `--warn`, `--good` and `--crit` were tuned as fills and
   rules, which need 3 to 1, not as text, which needs 4.5. Three tokens were added rather than a
   literal anywhere: `--warn-text`, `--good-text` and `--crit-text`, measuring 4.78, 5.12 and 6.34
   in daylight and past 7 in the dark.
2. **A pin button inside a listbox option.** An option may not contain a focusable element, and one
   put there is unreachable anyway, because the list is driven by `aria-activedescendant` rather
   than by focus. The pin moved out of the list and became a real labelled button beside the model,
   where it can be reached and read. The row now carries a marker, not a control, and the component
   prop is called `renderBadge` so the next person cannot make the same mistake.
3. **A scrolling region a keyboard could not reach.** With 57 models the list scrolls, and axe
   requires a scrollable region to be in the tab order or to contain something that is. Rather than
   silence the rule, the layer around the list scrolls instead, so the region contains the filter
   input, and the input is pinned to the top of it so it never scrolls away.

## Deliberate decisions

- **Plain CSS, not Tailwind.** Section 3 lists Tailwind v4. `packages/ui` already ships plain CSS
  over the token file, which the extension will reuse as is, so adding Tailwind would mean two
  styling systems for no capability we lack. The requirement that matters, real CSS variables, is
  met either way. This is flagged in `PLAN.md` and is one word from being changed.
- **Next 16, not 15.** 16 is the current major with the same App Router. It is a static export, so
  the whole site is files and runs on any free host.
- **The brief is generated, never written.** It reads the field registry and the model's own core,
  craft and tech lists. Nothing in `apps/web` names a model or a field, which is what keeps the
  rule that a component naming a model is a bug enforceable.
- **Each model keeps its own brief.** Switching model and coming back does not lose the work, which
  matches the prototype. A test asserts it, because it looks like data loss the first time you see
  it.
- **The theme is applied by an inline script before the first paint.** Reading it in React would
  show the light palette for one frame and then flip, which is worse than either theme.
- **The canvas mark is hidden from the accessibility tree.** It is decorative, and the wordmark
  beside it already says Forge. With `prefers-reduced-motion` set it draws once and never asks for
  another frame.
- **The store reads through `useSyncExternalStore`.** Copying storage into state after mount would
  either mismatch the exported HTML or need an effect that sets state, which is the pattern the
  hooks rules correctly object to.

## What Simple mode does, and why it is the tutorial

Simple mode asks only for what the user knows: the subject, the setting, the medium, the purpose.
Forge fills the craft layer itself and then lists every choice with the reason for it, each one a
button. Pressing one switches to Advanced mode, scrolls to that single field and puts focus in it.
So the craft layer is taught one decision at a time, on the user's own work, rather than by a tour.

## Not done in this phase, by design

The other three workspaces, cross-forge, batch, recipes, compare, the tutorial, accounts, the
extension and the AI layer. The glossary is phase 4, which is why nothing links to it yet.
