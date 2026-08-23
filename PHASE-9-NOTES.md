# Phase 9 notes: the AI layer

**Done when:** every test still passes with the assistant forced to null. It does: the whole suite
runs in that state, because no test stores a key, and the eight tests that are specific to this
phase cover the off state, the key, and what changes when it is on. `pnpm verify` exits 0.

## The claim this phase had to avoid breaking

Forge's claim is that the knowledge lives in this codebase rather than in a model call. An assistant
that quietly became load-bearing would make that false, so the shape of the whole phase follows from
one rule: **the assistant may describe and it may criticise. It never writes a prompt.**

That rule is enforced in three places, not asserted once:

- The critique prompt says "Never rewrite the prompt. Forge writes prompts", and a test reads the
  system prompt to check it still does.
- The description parser accepts **only** fields the target model actually has, and **only** values
  that field's own vocabulary allows. Anything else is dropped before it reaches a brief. Without
  that, the assistant would be a second, unverified catalogue arriving through the back door.
- The Doctor's diagnosis and Reverse's measurements are unchanged whether or not a key exists. An
  end-to-end test diagnoses the same prompt in both states and asserts the engine's findings match.

## Where the untestable part is

`packages/ai` has zero runtime dependencies and takes an injected `Transport`. Everything that
decides what to ask and what an answer means is there and is tested in Node with no key and no
network: 35 tests covering the prompts, the parsers, the rate limiter, the key store and every error
path. The vendor client is about thirty lines in `apps/web/src/lib/assistant.tsx`, loaded only when
there is a key, and it is the only part `pnpm verify` cannot prove. Same seam as phases 7 and 8.

## The key

Section 12 gives four rules. Three are properties of where the key is kept: `localStorage` on their
machine, never sent to our server, never logged. Forge has no server in the path at all, so there is
nothing of ours that could log it. The fourth, never in a URL, is a property of `packages/ai` never
seeing a URL: an end-to-end test walks five routes with a key stored and asserts it appears in
neither the address bar nor any link on the page.

The panel shows a stored key as its last four characters and nothing else, so a shared screen does
not give it away, and one click deletes it.

## The rate limiter

A fixed window would let a runaway loop fire the whole allowance the instant the window turned over.
This is a token bucket: ten a minute sustained, three at once. It is tested for the burst, the
steady refill, the ceiling, and a clock that goes backwards, which would otherwise hand out free
requests. The limiter runs **before** the transport, so a loop never reaches the vendor at all.

## The three implementations

- **`NullAssistant`** is the default everywhere. `available: false`, every method rejects with a
  typed `AssistantUnavailable`, so a screen can tell "there is no assistant" apart from "the
  assistant broke" and say something different for each. It never apologises.
- **`BrowserKeyAssistant`** is `createAssistant` over a transport that goes browser to vendor.
- **`ServerAssistant`** is the same object over a transport that posts to a server. Given no address
  it is honestly unavailable; given one it works. It is a stub in the sense that nobody runs the
  server, not in the sense that it is a lie.

## Deliberate departures

- **`describeImage` takes the model.** Section 12 writes it as `describeImage(file)`. Without the
  model there is no field menu, so the assistant is free to answer with a field or a lens the
  catalogue does not know. The parser needs the model to refuse those.
- **A picture must be JPEG, PNG, GIF or WebP.** Refused here, in a sentence naming the formats that
  work, rather than as a 400 from somebody else's server.

## Labelling

Every piece of assistant output carries a line saying an AI wrote it, that Forge did not check it
and that the catalogue does not stand behind it. Not a badge in a corner: the sentence says what it
means.

## Not done

Nobody funds a server, so `ServerAssistant` has no address. The browser path has never spoken to a
real key, because there is not one in this repository, and there will not be one in CI.
