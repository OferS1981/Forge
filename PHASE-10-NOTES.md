# Phase 10 notes: the refresh pipeline

**Done when:** a manual run produces a per-category report with a citation for every claim, and the
workflow that opens the pull request is in the repository and valid. Both hold. `pnpm verify` exits
0 with 895 unit tests, 20 of them this phase's.

## What this phase is actually for

Section 18: this is what decides whether Forge is alive in a year. The catalogue carries `sources`
and `verifiedOn` on all fifty-seven models, and the staleness test turns the build red 120 days
after that date. Until now nothing could clear it, so the only outcomes were "someone does it by
hand" and "the build goes red and stays red".

## The split, again

The same one as phases 7, 8 and 9, and for the same reason: separate what can be proven from what
cannot.

**The report is deterministic and needs no model.** `packages/catalog/src/refresh.ts` reads a
category's model files and emits, per model, every claim a vendor page could contradict, with the
sources that should settle each one. The claims are extracted from the data rather than described
beside it: the version, the aspect ratios, the clip lengths, the negative-prompt shape, every
settings row with its default and its range, and any warning that names a version number, because
that is what dates first. Twenty tests cover it, including that the output is byte-identical between
two runs, so a monthly diff is a real change rather than a model's mood.

Run it now, with no key and no network:

```
node scripts/catalog-refresh.mjs image
node scripts/catalog-refresh.mjs sfx --stdout
```

**The agent fills it in.** With `ANTHROPIC_API_KEY` configured, the workflow runs an agent over each
report, fetches each source, and proposes a diff with a citation per change and a bumped
`verifiedOn`. Without the key the job still runs, publishes the report as the job summary and keeps
it as an artifact, and says in the summary that nothing was checked and why. A manual run is useful
on its own rather than a no-op that hides a missing secret.

## Never auto-merge

Stated in three places, because it is the rule most easily lost:

- The workflow has `contents: read` at the top level and lifts it to `contents: write` and
  `pull-requests: write` on the one job that needs to push a branch. There is no merge step, no
  `--auto`, and no path that could add one without a review of this file.
- The report says it, in the words a reviewer reads first.
- The pull request body says it, and carries the six-line checklist a reviewer has to hold: every
  change cites a page, nothing changed that the page does not say, `verifiedOn` moved only for
  models actually checked, `unverified` cleared only where every claim was confirmed, golden files
  that moved are explained, and `reference/forge.html` is untouched.

The body is generated beside the report, from the same file, so the rules cannot drift into two
versions.

## The instructions the agent is given

Written to constrain rather than to encourage: change nothing you could not confirm on a vendor
page, leaving a value alone is correct, cite the page for every change, bump `verifiedOn` only for
what you checked, do not touch the prototype or hand-edit a golden file. A golden file that moves is
the reviewable diff those files exist to produce, and the agent is told to explain what moved.

## What has not run

The agent half has never run, because it needs a key this repository does not have and write
permission on a repository a workflow file cannot grant itself. The deterministic half has run, and
its output is above. Turning the rest on is one repository secret.

I have not opened a pull request against `main`. That is outward-facing and it is Alon's repository:
the workflow is ready and can be fired from the Actions tab, with a category or with none.

## One thing to fix on the first real run

The report is only as good as `sources`. Every model has one URL today and a test enforces that,
but several are a product's front page rather than its parameter reference. The first refresh will
show which, because a claim with no page that mentions it cannot be confirmed and will come back
unchanged. That is the pipeline working, not failing.
