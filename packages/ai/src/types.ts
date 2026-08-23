import type { Brief, Model } from '@forge/catalog';

/**
 * The optional layer.
 *
 * Section 12: one interface, and the whole app works when it is switched off. That is not a nicety.
 * Forge's claim is that the knowledge lives in this codebase rather than in a model call, and an
 * assistant that quietly became load-bearing would make that claim false. So every method here adds
 * to a screen that already works, and `NullAssistant` is the default everywhere.
 */

/** What a picture turned out to contain, in the catalogue's own field ids. */
export interface ImageDescription {
  /** Field values the Reverse workspace can drop straight into a brief. */
  brief: Brief;
  /** One sentence saying what it saw, shown to the reader so they can disagree with it. */
  summary: string;
}

export interface Critique {
  /** What the assistant thinks is wrong, in the reader's language. */
  findings: string[];
  /** What it would add, as a sentence. Never a rewritten prompt: the engine writes prompts. */
  suggestion: string;
}

export interface PromptAssistant {
  readonly available: boolean;
  /*
   * Section 12 writes this as `describeImage(file)`. It takes the model too, because a described
   * brief may only use fields that model actually has: without it the assistant would be free to
   * answer with a field or a lens Forge does not know, which is a second, unverified catalogue
   * arriving through the back door. `PORT-NOTES.md` records the change.
   */
  describeImage: (file: Blob, model: Model) => Promise<ImageDescription>;
  critique: (prompt: string, model: Model) => Promise<Critique>;
  freeform: (brief: Brief, model: Model) => Promise<string>;
}

/**
 * The typed refusal every method of the null assistant rejects with. Typed, so a screen can tell
 * "there is no assistant" apart from "the assistant broke", and say something different for each.
 */
export class AssistantUnavailable extends Error {
  readonly kind = 'unavailable';
  constructor(message = 'Forge has no assistant configured, so this is not available.') {
    super(message);
    this.name = 'AssistantUnavailable';
  }
}

/** The rate limiter said no. Their credit, their key, so a mistyped loop must not burn it. */
export class AssistantBusy extends Error {
  readonly kind = 'busy';
  constructor(readonly waitMs: number) {
    super(
      `That is more requests than Forge will send in a minute. Wait ${String(Math.ceil(waitMs / 1000))} seconds and try again.`,
    );
    this.name = 'AssistantBusy';
  }
}

/** The vendor said no, or the network did. */
export class AssistantFailed extends Error {
  readonly kind = 'failed';
  constructor(message: string) {
    super(message);
    this.name = 'AssistantFailed';
  }
}

/**
 * The picture formats an assistant can be sent. Narrow on purpose: a format the vendor will refuse
 * should be refused here, in a sentence that says which formats work, rather than as a 400 from
 * somebody else's server.
 */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
export type ImageMediaType = (typeof IMAGE_TYPES)[number];

export function asImageType(value: string): ImageMediaType | null {
  const found = IMAGE_TYPES.find((type) => type === value.toLowerCase());
  return found ?? null;
}

/** One part of a message: text, or a picture the reader dropped in. */
export type Part =
  { kind: 'text'; text: string } | { kind: 'image'; mediaType: ImageMediaType; base64: string };

export interface Ask {
  system: string;
  parts: Part[];
  maxTokens: number;
}

/**
 * The one thing the app supplies. Everything that decides what to ask and what the answer means is
 * in this package and is tested in Node against a fake; the vendor client is about thirty lines at
 * the edge, in `apps/web`, and is the only part `pnpm verify` cannot prove.
 */
export interface Transport {
  ask: (input: Ask) => Promise<string>;
}
