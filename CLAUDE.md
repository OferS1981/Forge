# Forge

A prompt smithy. It writes production-grade prompts for a catalogue of AI models, each in that
model's own grammar, with the exact settings to match. The knowledge lives in this codebase, not in
a model call.

Full specification: `forge-starter/FORGE-BUILD-SPEC.md` (sibling folder). The approved plan for the
current phases is `PLAN.md`. Read both before changing anything structural. The prototype is
`reference/forge.html`: the parity test reads it, never edit it.

## Commands

```
pnpm --filter @forge/web dev       run the web app on port 4322
node scripts/catalog-refresh.mjs <category>   the claims in a category, and the sources for each
node apps/cli/dist/main.js --help             the forge command, after building @forge/cli-app
node scripts/catalog-snapshot.mjs             record a catalogue change. Commit what it writes
pnpm verify         typecheck + lint + test + golden + a11y + e2e. must exit 0 before any phase is done
pnpm test -- --watch
pnpm format         prettier --write
pnpm --filter @forge/ui gallery    the component gallery, which axe and the e2e suite run against
```

## Where things live

- `packages/catalog` is the product. Model data, brief fields, glossary, prompt engine. Pure
  TypeScript, zero runtime dependencies, no React, no DOM, no fetch.
- `packages/ui` holds the design tokens and every control we draw ourselves. Its `gallery/` folder
  is a development page showing every control, never shipped, and it is what the axe and e2e suites
  run against.
- `packages/data` is the library: folders, saved prompts, recipes, pins and shares. Zero runtime
  dependencies, like the catalogue. The SQL in `sql/` is tested against real Postgres in Node, and
  the vendor client lives at the edge in `apps/web`, behind `RemotePort`.
- `packages/workbench` holds the product components the website and the extension both draw, which
  today is the generated brief. A component that belongs to one surface stays in that surface.
- `packages/ai` is the optional AI layer. One interface, three implementations, and a transport the
  app supplies. Zero runtime dependencies: the vendor client lives at the edge in `apps/web`.
- `packages/extension` is the extension's testable core: the manifest, generated from the
  catalogue's host map, and the per-site paste adapters as pure functions over a `Document`.
- `apps/web` is the website: a Next.js static export that reads the catalogue and draws it with the
  controls from `packages/ui`. It names no model and no field.
- `packages/changelog` is what changed in the catalogue and which saved prompts it touches. Its
  `snapshots/` are the committed history, and a catalogue change with no snapshot fails a test.
- `packages/cli` is the command line as a pure function, and `packages/mcp` is the MCP protocol as
  one. `apps/cli` and `apps/mcp` are the pumps around them, and hold no decisions.
- `apps/extension` is the browser extension: a service worker, a content script and a side panel,
  all thin. The panel is an ordinary page and stays one, so it can be tested like one. The website
  and the extension are the same product.

## Names

- Workspaces are called Build, Doctor, Reverse and Match. Not Anvil, not Reverse Forge.
- The prompt quality number is Score. Its labels are the steel colours (cold iron through welding
  heat). The word Heat is not used in the UI.
- The brand keeps the hammer-and-anvil mark and the Strike button.

## Do

- Keep all model knowledge in `packages/catalog`. A component that names a specific model is a bug.
- Cite a primary source for every factual claim about a model, in `sources`.
- Mark anything unconfirmed with `unverified: true` rather than writing a confident guess.
- Give every field, option and setting a glossary term. The build enforces it.
- Write the test before the fix when something breaks.
- Prefer deleting code to adding a flag.
- Port prototype wording as written. Disagreements go in `PORT-NOTES.md`, not into the data.

## Do not

- Never use a native `<select>`, `alert`, `confirm`, `prompt` or `title` tooltip. Build the control.
  Custom appearance, native semantics: same roles, same keyboard behaviour.
- No chat interface. Forge is a catalogue and a form.
- No billing, plans, pricing, paywalls or upsell copy anywhere. No analytics.
- No dependency with a paid tier in the critical path. This runs on free tiers only.
- No colour anywhere except the token file, `packages/ui/src/styles/tokens.css`. That includes
  scrims and the foreground painted on a filled control: add a token rather than a literal.
- No `any`. No `!` without a comment saying why.
- Never auto-merge a catalogue change. The refresh workflow opens a pull request and stops.
- A catalogue change needs a snapshot committed with it, or the changelog falls behind in silence.
- Never ship a feature that only works when the AI layer is on, or when an account is signed in.
  A screen is written against `Library` and `PromptAssistant`, never against whether anybody is
  signed in or has a key.
- The assistant may describe and criticise. It never writes a prompt, and nothing it says reaches a
  brief unless the catalogue already knows that field and that value.
- Simple mode produces fewer decisions, never a worse prompt.

## Copy voice

Plain and specific. No hype, no exclamation marks, no emoji in the UI. No em dashes in user-facing
text, use a comma, a colon or a full stop. A control says what it does, then confirms it did it.
Errors say what went wrong and how to fix it. Never apologise in UI copy. Explain a term the way a
good teacher would: what it is, what changes, when to use it.

## IMPORTANT

`pnpm verify` must exit 0 and you must quote its output before calling a phase done.
