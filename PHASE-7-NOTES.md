# Phase 7 notes: accounts and library

**Done when:** the row level security policy tests pass, a signed-out visitor still has the whole
app, axe is clean on the new routes in both themes, and `pnpm verify` exits 0. All four hold.

## The problem this phase had to solve first

Section 13 asks for Supabase. There is no hosted project, `pnpm verify` will never have one, and
building an account layer that nobody can run is how untested code gets shipped. So the phase
starts by splitting what can be proven from what cannot.

**The policies can be proven.** `@electric-sql/pglite` is Postgres 16 compiled to WebAssembly: the
real planner and the real row level security, in Node, with no server, no Docker and no account.
`packages/data/test/harness.ts` creates only what Supabase itself provides and the migration
assumes, which is the `auth` schema, `auth.uid()` and the two roles, then runs
`packages/data/sql/001_library.sql` unedited. What is tested is what would be deployed.

Twenty-two tests. Every table gets both halves: the owner gets through, and a second signed-in
person is stopped. A table with row level security left off fails a test that reads `pg_class`
directly, so a table added later without policies cannot pass quietly. An anonymous visitor is
asserted to hold no table privileges at all.

**The vendor client cannot be proven**, so it is confined to `apps/web/src/lib/account.ts`, about
forty lines behind a six-method `RemotePort`. Everything above that line is tested against a fake.

## Sharing without a server, which is what the rules actually require

Section 13 writes shares as `/p/<slug>` backed by a row. Two things make that impossible as
written: a static export has no server to resolve an arbitrary slug, and an anonymous visitor has
no row to make. The rule two lines above it says anonymous users get everything except cloud sync,
and sharing is not cloud sync.

So a share carries its brief in the URL fragment. A fragment is never sent to a host, the link
needs no database, and it works for everyone. An account additionally mints a short slug and shares
that instead, resolved by a `security definer` function that takes an exact slug, so an anonymous
reader can open the one share they hold and cannot list anybody's prompts.

The two are told apart by `kind`, and the screen says which one it just made. An inline link cannot
be withdrawn and does not offer a button pretending it can. That honesty is the whole reason the
two forms are separate types rather than one with a flag.

What travels is the brief, so a shared prompt is forged on the reader's machine against today's
catalogue. A share does not go stale.

## What is on screen

- **`/library`** folders, saved prompts, pinned models and recipes. One line at the top says where
  the library is. Deleting a folder keeps the prompts in it, in the browser by a filter and in the
  database by `on delete set null`, and both are tested.
- **`/account`** sign in by magic link or Google, and the one-click import of local work. With no
  project configured it says so plainly and points at the library.
- **`/p`** the shared prompt, read-only, with a button that opens it in Build.
- **Keeping and sharing** sit under the prompt in Build, which is where a prompt worth keeping
  appears.

Pins and recipes moved out of `apps/web/src/lib/store.ts` and into the library, so they follow an
account rather than staying in one browser. The first read adopts what phase 5 left in
`forge.recipes` and `forge.pins`, so nobody opens Forge after this phase and finds their work gone.
There is an end-to-end test for exactly that.

## Departures from the section 13 sketch

- **No `view_count`.** It is per-share analytics and `CLAUDE.md` says no analytics. The rule wins.
- **No `result jsonb` on `prompts`.** Section 13's own next line says a stored brief can be
  re-forged and a stored string is dead. The column would be the dead thing.
- **`heat` is `score`**, the word the product uses.
- **`shares` carries `user_id`.** Ownership through a subquery on the prompt would run on every row
  of every policy check and would make two policies depend on each other.
- **Two triggers the sketch does not have.** A prompt cannot be filed in someone else's folder, and
  a prompt that is not yours cannot be shared. Neither is caught by an owner policy on the row
  being written, because in both cases the row's own `user_id` is the attacker's. Both are tested.
- **`/p#…` rather than `/p/<slug>`**, for the reason above.

## Three bugs this phase found, all fixed with a test first

1. **The command palette ranked a description above a name.** Typing a workspace's exact name could
   put a model whose blurb happened to use the word above it, so Enter went somewhere else. The
   filter now ranks in three bands: the name starts with what was typed, the name contains it, then
   anything else. Groups are kept together in the order of their best match.
2. **`Listbox` keyed its groups by name.** A group is a run of adjacent options, so the same name
   can begin a second run, which ranking made possible for the first time. React then had two
   children with one key: it rendered both and stopped removing either, leaving the entire previous
   list on the page under the new one. Keyed by position now. This was invisible until ranking
   existed, and would have been a real bug the first time any caller produced a repeated group.
3. **A link written inside a sentence had no colour**, so it fell back to the browser's blue, which
   fails contrast on the dark ground and belongs to no palette we own. Every navigation link sets
   its own colour and a class beats an element, so one base rule fixed the whole class of bug.

A fourth, caught by looking rather than by a test, then given a test: the shared prompt page drew
the auto-filled values as buttons that opened a field, on a page with no brief to open. `Output`
now takes `onOpenField` optionally and renders plain text without it.

## What is not done

The account path has never spoken to a real Supabase project, because there is not one. The
policies are tested against real Postgres, the library logic is tested against a fake port, and the
remaining untested surface is `apps/web/src/lib/account.ts`. Turning it on is two environment
variables and running `packages/data/sql/001_library.sql`. The account page says so.

No billing table, no plan column, no Stripe, no analytics, and an end-to-end test asserts the
account page contains none of that vocabulary.
