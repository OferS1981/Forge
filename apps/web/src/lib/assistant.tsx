'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  createAssistant,
  createNullAssistant,
  forgetKey,
  maskKey,
  readKey,
  writeKey,
  type Ask,
  type PromptAssistant,
} from '@forge/ai';

/**
 * The AI layer, wired into the app.
 *
 * Two rules from section 12 decide the whole shape of this file. The key stays on the reader's
 * machine, so the request goes from their browser straight to the vendor and nothing here ever
 * sends it anywhere else. And the whole app works without it, so the default is the null assistant
 * and every screen is written against `PromptAssistant` rather than against whether a key exists.
 */

interface AssistantContext {
  assistant: PromptAssistant;
  /** How the stored key may be named on screen: the last four characters and nothing more. */
  named: string | null;
  save: (key: string) => boolean;
  forget: () => void;
}

const Context = createContext<AssistantContext | null>(null);

function storage(): {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
} {
  return {
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Storage denied. Nothing is kept, and the panel will say the key is not stored.
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Nothing kept it.
      }
    },
  };
}

const MODEL = 'claude-opus-5';
const NOTHING = createNullAssistant();

/*
 * The key is read through useSyncExternalStore rather than copied into state after mount, the same
 * way the rest of the app reads storage. That keeps the exported HTML and the first client paint in
 * agreement, and means another tab deleting the key is noticed here.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function announce(): void {
  for (const listener of listeners) listener();
}

/**
 * The one part of the AI layer `pnpm verify` cannot prove, and the reason it is thirty lines: the
 * vendor client, loaded only when there is a key, talking from this browser to the vendor with a
 * header that says so. Nothing is proxied, so there is no server of ours to log anything.
 */
function transportFor(key: string): { ask: (input: Ask) => Promise<string> } {
  return {
    ask: async ({ system, parts, maxTokens }) => {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [
          {
            role: 'user',
            content: parts.map((part) =>
              part.kind === 'text'
                ? ({ type: 'text', text: part.text } as const)
                : ({
                    type: 'image',
                    source: { type: 'base64', media_type: part.mediaType, data: part.base64 },
                  } as const),
            ),
          },
        ],
      });
      return response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim();
    },
  };
}

export function AssistantProvider({ children }: { children: ReactNode }): ReactNode {
  const key = useSyncExternalStore(
    subscribe,
    () => readKey(storage()),
    // The exported HTML has no storage, so on the server there is never a key.
    () => null,
  );

  const assistant = useMemo<PromptAssistant>(
    () => (key === null ? NOTHING : createAssistant({ transport: transportFor(key) })),
    [key],
  );

  const save = useCallback((next: string): boolean => {
    if (!writeKey(storage(), next)) return false;
    announce();
    return true;
  }, []);

  const forget = useCallback(() => {
    forgetKey(storage());
    announce();
  }, []);

  const value = useMemo(
    () => ({ assistant, named: key === null ? null : maskKey(key), save, forget }),
    [assistant, key, save, forget],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAssistant(): AssistantContext {
  const value = useContext(Context);
  if (value === null) throw new Error('The assistant is only available inside AssistantProvider.');
  return value;
}

/**
 * The label every piece of assistant output wears, per section 12. Not a badge in the corner: the
 * sentence says what made it and that nobody checked it.
 */
export function AiLabel({ what }: { what: string }): ReactNode {
  return (
    <p className="ai-label">
      <span className="ai-label__tag">AI-assisted</span> {what} Forge did not check it, and the
      catalogue does not stand behind it.
    </p>
  );
}
