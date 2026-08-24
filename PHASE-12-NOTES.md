# Phase 12 notes: the changelog

**Done when:** a catalogue change is visible to everyone on a public page, and to somebody with a
library as the sentence that actually matters: how many of their saved prompts it touches. Both
hold. `pnpm verify` exits 0 with 987 unit tests, 26 of them this phase's.

## Choosing it

Section 22 lists seven ideas and says to raise them when the phase arrives rather than building them
unasked. Alon asked for a twelfth phase without naming one, so this is the choice and the reasoning.

**The model changelog feed, and the public page built from the same data.** Section 22 lists them
separately, but they are one feature seen from two sides, and both were already paid for. Phase 10
produces catalogue diffs. Phase 7 knows which prompts somebody saved and which model each uses.
Joining those two gives the sentence section 22 writes itself. Nothing else on the list turns
maintenance into a feature rather than a cost.

**Not chosen, and why.** The cost estimator would need per-model prices, which go stale faster than
anything else in the catalogue and have no source that stays right; it is also pricing copy in a
product whose rules say there is none. Style packs and prompt lineage are additions to the library
rather than to the catalogue, so they belong after this. Local model support is a catalogue job.

## A diff of claims, not of files

The snapshot is of what the catalogue **claims**, reusing phase 10's definition of a claim. That
matters twice over. The two halves of the maintenance story, checking and telling, cannot disagree
about what counts as a change. And a whitespace edit, a reordered import or a reworded comment is
not a change, which is what stops the page filling with noise.

One rule in the diff is worth calling out. A settings row holds exactly one claim, so a removal and
an addition in it are **one** event: "the default moved from 100 to 250" beats two lines the reader
has to join up. A field like `warnings` holds several, and there one line going and another arriving
really are two separate events, so pairing them would invent a relationship that is not there. Both
cases have a test, and the second one caught the first version of this code.

## The history is real, and it is in the repository

`packages/changelog/snapshots/` holds one file per day the catalogue moved, and `/changes` is built
from them. No service, no database, nothing fetched: the page is as checkable as the catalogue is.

The first snapshot was reconstructed rather than invented. The catalogue at the phase 5 commit was
checked out into a worktree and snapshotted with today's definition of a claim, which gives a real
release: Claude's version line went from "Opus 5 / Sonnet 5" to "Opus 5 / Sonnet 5 / Fable 5", and
its `model` settings row changed with it. That is genuine history, recovered from git, and it is
what the page and the end-to-end tests exercise. Nothing here is a fixture pretending to be data.

**A catalogue change with no snapshot fails the build.** `node scripts/catalog-snapshot.mjs` writes
one and regenerates the committed index; a test takes a snapshot of the catalogue as it stands and
compares it to the newest file. That is the gate that stops the changelog quietly falling behind the
thing it describes.

## The half nobody else has

Phase 7 argued that a saved prompt should keep the brief rather than the rendered string, and could
not yet show why. This is why. A saved prompt whose model changed **after it was saved** gets one
line in the library: what changed, how many of your prompts it touches, and a link to the record.

Two details make it a feature rather than a nag:

- A prompt saved **after** the change is left alone. It was written against the catalogue as it is.
- A prompt with a date that cannot be read is treated as old, which errs towards telling somebody.

Both are tested, and so is the wording, including that "1 of your saved prompts uses it" keeps the
noun plural and moves the verb.

## The public page

`/changes` needs nobody signed in, and an end-to-end test asserts it neither mentions signing in nor
contains a word about buying anything. It opens with the newest release and ends with where the
record starts, so an empty stretch is not a mystery. The side column says where the entries come
from, what counts as a change, and that a human merges every one of them.

## Not done

No email and no push about a change: no notifications, no analytics, nothing needing a server. The
page and the library line are both read from files already in the repository.

The "forge it again" step is a link to Build rather than a one-click re-forge. A button that
silently rewrote a saved prompt would be the wrong default for a product whose point is that you
can see what it did.
