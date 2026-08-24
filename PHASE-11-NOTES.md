# Phase 11 notes: the CLI and the MCP server

**Done when:** `forge` builds a prompt from a shell and the MCP server answers a real client over
stdio. Both do. `pnpm verify` exits 0 with 961 unit tests, 66 of them this phase's, plus eight
end-to-end tests that spawn the built binaries and talk to them.

## Why this was cheap

Section 19 calls this optional and says why it is worth doing: both are thin wrappers over
`packages/catalog` once it exists, which is the payoff for the monorepo. That turned out to be
exactly right. Neither binary holds a fact. Model ids, field names, glossary terms, the flag list
and the MCP input schemas all come out of the catalogue, so adding a model changes both without
anyone editing either.

## The split, a fifth time

- **`packages/cli`** is `run(argv)` returning a code and two strings. No `process`, no `console`,
  no `exit`. Thirty-six tests cover every command and every way an invocation can be wrong.
- **`packages/mcp`** is `handle(request)` returning a response object or `null`. No transport. Thirty
  tests cover every method, every tool and every malformed request.
- **`apps/cli`** and **`apps/mcp`** are the pumps, twelve and twenty lines. Both are built by
  `scripts/bundle-bin.mjs` and both get an end-to-end test that builds them first, because a stale
  binary passing is the one failure those tests exist to stop.

## The flags are the catalogue

`forge build midjourney --subject "a dragon" --lens 35mm`. Every field a model reads is already a
flag. A flag that is not a field is refused with the nearest name that is, and a field that exists
but belongs to another model gets a different sentence and a pointer at
`forge models --fields <model>`. There is a test that walks every text field of a model and asserts
the CLI accepts it, so a new field cannot arrive unusable.

## What the MCP server is careful about

- **A tool refusing is a result, not a protocol error.** "There is no model called that" is an
  answer an agent can act on. A JSON-RPC error stops the conversation. Getting these the wrong way
  round is how an MCP server becomes unusable mid-task, so there is a test for it.
- **A notification gets no response at all.** Returning one anyway is the most common way to confuse
  a client. Tested at both the handler and the line level.
- **Nothing but responses on stdout.** A stray log line is read by a client as a malformed message.
  The pump writes anything worth saying to stderr, and a test asserts a conversation of pure
  notifications produces no stdout at all.
- **A version it does not know is answered with its newest**, rather than refused. Refusing would
  break against a client newer than this file.
- **The descriptions say what the tools do not do.** No tool reads a file, writes one, or reaches
  the network, and that is in `initialize`'s instructions and in `forge_prompt`'s description,
  because an agent deciding whether it may call something reads those, and so does the person
  approving it.

## Running them

```
node apps/cli/dist/main.js build midjourney --subject "a retired boxer taping his hands"
node apps/cli/dist/main.js doctor "a cool picture of a robot, 8k, masterpiece"
node apps/cli/dist/main.js models --category image
```

For the MCP server, point a client at `node apps/mcp/dist/main.js` after
`pnpm --filter @forge/mcp-app run build`. It speaks protocol versions 2025-06-18, 2025-03-26 and
2024-11-05.

## Not done

Publishing either to a registry, which is a name and a decision rather than code. Both run from the
repository, which is what section 14 said about the extension too.
