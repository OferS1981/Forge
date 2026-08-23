import type { Brief, Model } from '@forge/catalog';
import { createLimiter, type Limiter } from './limit';
import { createNullAssistant } from './null';
import {
  briefAsText,
  critiqueSystem,
  describeSystem,
  freeformSystem,
  readCritique,
  readDescription,
} from './prompts';
import {
  asImageType,
  AssistantBusy,
  AssistantFailed,
  type Critique,
  type ImageDescription,
  type ImageMediaType,
  type PromptAssistant,
  type Transport,
} from './types';

/**
 * The assistant, over whatever transport it was given.
 *
 * `BrowserKeyAssistant` is this with a transport that goes from the reader's browser straight to
 * the vendor with the reader's own key. `ServerAssistant` is this with a transport that posts to a
 * server, for the day one is funded. They are the same object because the difference between them
 * is one function, and pretending otherwise would mean two things to keep in step.
 */

export interface AssistantOptions {
  transport: Transport;
  /** Requests a minute, sustained. Their key, their bill: see section 12. */
  perMinute?: number;
  burst?: number;
  now?: () => number;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function toBase64(file: Blob): Promise<{ base64: string; mediaType: ImageMediaType }> {
  const mediaType = asImageType(file.type.length > 0 ? file.type : 'image/png');
  if (mediaType === null) {
    throw new AssistantFailed(
      'The assistant reads JPEG, PNG, GIF and WebP. Save that picture as one of those and drop it again.',
    );
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { base64: btoa(binary), mediaType };
}

export function createAssistant({
  transport,
  perMinute = 10,
  burst = 3,
  now = () => Date.now(),
}: AssistantOptions): PromptAssistant & { left: Limiter['left'] } {
  const limiter = createLimiter({ perMinute, burst, now });

  const gate = (): void => {
    const wait = limiter.take();
    if (wait > 0) throw new AssistantBusy(wait);
  };

  const ask = async (
    system: string,
    parts: Parameters<Transport['ask']>[0]['parts'],
    maxTokens: number,
  ): Promise<string> => {
    try {
      return await transport.ask({ system, parts, maxTokens });
    } catch (error) {
      if (error instanceof AssistantFailed) throw error;
      throw new AssistantFailed(
        error instanceof Error && error.message.length > 0
          ? error.message
          : 'The assistant could not be reached. Check the key and the connection.',
      );
    }
  };

  return {
    available: true,
    left: limiter.left,

    describeImage: async (file: Blob, model: Model): Promise<ImageDescription> => {
      gate();
      if (file.size > MAX_IMAGE_BYTES) {
        throw new AssistantFailed(
          'That picture is larger than five megabytes. Save a smaller copy and drop it again.',
        );
      }
      const { base64, mediaType } = await toBase64(file);
      /*
       * The field menu comes from the model the workspace is targeting, so the answer can only use
       * fields that model has, and only values its own vocabulary allows. Anything else is dropped
       * by the parser rather than smuggled into the brief.
       */
      const text = await ask(
        describeSystem(model),
        [
          { kind: 'image', mediaType, base64 },
          { kind: 'text', text: 'Describe this reference.' },
        ],
        1024,
      );
      const read = readDescription(text, model);
      if (read === null) {
        throw new AssistantFailed('The assistant did not answer in a shape Forge could read.');
      }
      return read;
    },

    critique: async (prompt: string, model: Model): Promise<Critique> => {
      gate();
      const text = await ask(critiqueSystem(model), [{ kind: 'text', text: prompt }], 1024);
      const read = readCritique(text);
      if (read === null) {
        throw new AssistantFailed('The assistant did not answer in a shape Forge could read.');
      }
      return read;
    },

    freeform: async (brief: Brief, model: Model): Promise<string> => {
      gate();
      const text = await ask(
        freeformSystem(model),
        [{ kind: 'text', text: briefAsText(brief) }],
        256,
      );
      const line = text.trim();
      if (line.length === 0) throw new AssistantFailed('The assistant answered with nothing.');
      return line;
    },
  };
}

/**
 * A server assistant, behind the same interface, for the day one is funded. It is not a lie and not
 * dead code: given a base URL it works, and given none it is honestly unavailable.
 */
export function createServerAssistant(
  baseUrl: string | null,
  send: (url: string, body: unknown) => Promise<string>,
): PromptAssistant {
  if (baseUrl === null || baseUrl.length === 0) {
    return createNullAssistant('Forge runs no server for this, so there is nothing to ask.');
  }
  return createAssistant({
    transport: { ask: (input) => send(`${baseUrl.replace(/\/$/, '')}/ask`, input) },
  });
}
