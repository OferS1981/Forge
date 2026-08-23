# Phase 4 notes

The explain layer. Every field, every option and every settings row in Forge can now say what it
is, what changes when you move it, and when to reach for it.

## What was written

**251 terms**, in three files under `packages/catalog/src/glossary/`:

- 69 brief fields, one per question Forge asks,
- 24 vocabulary banks, which explain a whole chip group at once, so a user who does not know what a
  film stock or an f-stop is can find out without leaving the form,
- 158 settings rows, under the real parameter name the vendor uses.

Rows that share a parameter name share an entry, because `steps` means the same thing wherever it
appears. Where a model's behaviour differs, that model's own `why` line on the row says so.

Each entry carries `short`, `what`, `changes` and `when`, plus a range and a low and high example
where the term is a dial. The voice is the one in `CLAUDE.md`: plain, specific, no hype, and no
apology for a model's limits. A test asserts no em dash reaches a reader.

## The rule the interaction is built around

**Explaining is never the same gesture as choosing.** Section 9 names this as the trap, so:

- every field label carries its own info dot, a real 24px button with an accessible name,
- pressing a chip still only presses the chip, which a test asserts by checking the field is
  untouched after the explanation is opened,
- `i` on a focused chip opens the vocabulary for that group, which costs no tab stop,
- every settings row on the output links to the explanation of the real parameter,
- Escape closes and puts focus back on the dot that opened it.

## `/glossary`

Every term, grouped into the brief, the vocabulary and the settings, searchable across all four
fields of the copy, and deep-linkable. Term ids contain dots, which cannot appear in a fragment, so
`setting.stylize` is reachable at `/glossary#setting-stylize`. Cmd-K searches terms alongside
models, so typing "cfg" reaches the explanation as directly as typing a model name reaches the
model.

## The test that stops this rotting

`ALLOW_STUBS` is gone. `packages/catalog/test/terms.test.ts` now asserts that no stub survives
anywhere, so adding a field, an option or a settings row without an explanation fails the build.
That is the whole point of having laid the skeleton in phase 1: the coverage test was real before
there was any copy to protect.

## Not done in this phase, by design

The hover-after-500ms hint on chips is available through the `Tooltip` component but is not wired
onto every chip, because a hint on all 57 chips of a vocabulary bank is noise rather than help. The
info dot and the `i` key cover the same ground deliberately. Cross-links between related terms
(`seeAlso`) are typed and unused: they are worth filling when the Doctor's findings start pointing
into the glossary in phase 5.
