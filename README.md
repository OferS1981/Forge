# Forge

**A prompt smithy.** Fifty-seven AI models, each with its own prompt grammar, settings and
content rules, composed deterministically in your browser. No account needed, no API key needed,
and nothing you type ever leaves the page.

## What it does

- **Build** — fill a form, get a prompt written in the target model's own documented grammar,
  with the exact settings to match it. Simple mode makes the choices a professional would,
  settings included, and explains every one; Advanced is the middle tier, where you pick what you
  want; Pro adds what you do not want; **Plan** interviews you.
- **Doctor** — paste an under-performing prompt: a score out of 100, plain-English findings, and
  the same brief re-smithed properly. The **Refusal Doctor** names which of the seven moderation
  layers blocked you and gives the fix for that layer.
- **Reverse** — drop in a reference image and Forge measures what a browser can honestly measure,
  then builds the brief around it.
- **Match** — describe the job; Forge names the right model and why.
- **Compliance and rights** — warned _before_ you paste: named artists, negative constructions,
  regional walls, and who actually owns what you make, sourced to the vendor's own pages.
- Library, recipes, sharing, a browser extension, a CLI, and an MCP server.

## The guarantees

1. **Deterministic.** Same brief, same prompt, every time. No model call, no network.
2. **Sourced.** Every factual claim about a model carries a primary source and a date, with a
   staleness alarm (120 days; 90 for content-policy facts) that turns the build red.
3. **Private.** Prompts and briefs stay in the browser. The only telemetry is anonymous event
   counts — a model was struck, a page was visited — never who, never what was typed.
4. **Honest about limits.** Unverified claims wear a badge. Models with no appeal path say so.
   Nothing in the product helps anyone evade a content filter.

## Run it

```bash
pnpm install
pnpm --filter @forge/web build
pnpm --filter @forge/web serve   # http://localhost:4173
```

## Use Forge inside Claude (MCP)

Forge ships an MCP server: one self-contained file, the whole catalogue inside, no runtime
dependencies. From the repo root:

```bash
pnpm mcp
```

That builds it and prints the exact `claude mcp add` line (and the Claude Desktop / Cursor
config) with the path filled in. Five tools land in your AI: `forge_prompt`, `diagnose_prompt`,
`match_models`, `list_models`, `explain_term` — so Claude can write model-perfect prompts and
doctor bad ones mid-conversation, offline.

## CLI

```bash
pnpm --filter @forge/cli-app build
node apps/cli/dist/main.js midjourney --subject "a lighthouse in fog"
```

## Development

`pnpm verify` runs the whole gate: typecheck, lint, ~1,600 unit tests (including prototype
parity, golden files and RLS policies against real Postgres), axe accessibility on every route in
both themes, end-to-end suites, and a performance budget. It must exit 0.

The battle harnesses (`node scripts/judge.mjs`, `node scripts/judge-doctor.mjs`,
`node scripts/marathon.mjs`) hold every model to a reviewer's rubric: 100 distinct battles per
model per arena.
