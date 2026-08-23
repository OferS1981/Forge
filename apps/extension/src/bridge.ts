import { modelForHost } from '@forge/catalog';
import type { KeyValue } from '@forge/data';

/**
 * Everything the panel needs from the browser, in one place, with a fallback for when there is no
 * browser extension around it.
 *
 * That fallback is not a courtesy: the side panel is an ordinary page, and this is what lets
 * Playwright open it, drive it and assert on it like any other page. A panel that can only be
 * tested inside a packaged extension is a panel that does not get tested.
 */

export interface Site {
  /** The host of the tab the panel was opened beside, or null when it is not beside one. */
  host: string | null;
  /** The model for that host, if the catalogue knows one. */
  modelId: string | null;
}

interface Runtime {
  sendMessage: (message: unknown) => Promise<unknown>;
  onMessage: {
    addListener: (fn: (message: unknown) => void) => void;
    removeListener: (fn: (message: unknown) => void) => void;
  };
}

interface Chromish {
  runtime?: Runtime;
  storage?: {
    local: {
      get: (keys: string[]) => Promise<Record<string, unknown>>;
      set: (items: Record<string, unknown>) => Promise<void>;
    };
  };
}

function browser(): Chromish | undefined {
  const g = globalThis as { chrome?: Chromish; browser?: Chromish };
  return g.chrome ?? g.browser;
}

export function inExtension(): boolean {
  return browser()?.runtime !== undefined;
}

/**
 * Which site the panel is for. Inside the extension the content script says so. Outside it, the
 * query string does, which is how the end-to-end test opens the panel "on" Midjourney.
 */
export function readSite(search: string): Site {
  const host = new URLSearchParams(search).get('host');
  if (host === null || host.length === 0) return { host: null, modelId: null };
  return { host, modelId: modelForHost(host) ?? null };
}

export interface PanelMessage {
  kind: 'forge:site';
  host: string;
}

function isSiteMessage(value: unknown): value is PanelMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'forge:site' &&
    typeof (value as { host?: unknown }).host === 'string'
  );
}

/** Listen for the content script saying which site the active tab is on. */
export function onSite(handler: (site: Site) => void): () => void {
  const runtime = browser()?.runtime;
  if (runtime === undefined) {
    return () => {
      // Nothing was started.
    };
  }
  const listener = (message: unknown): void => {
    if (isSiteMessage(message))
      handler({ host: message.host, modelId: modelForHost(message.host) ?? null });
  };
  runtime.onMessage.addListener(listener);
  return () => {
    runtime.onMessage.removeListener(listener);
  };
}

/** Ask the content script to write the prompt into the page it is running in. */
export async function paste(text: string): Promise<unknown> {
  const runtime = browser()?.runtime;
  if (runtime === undefined) return { kind: 'unsupported' };
  return runtime.sendMessage({ kind: 'forge:paste', text });
}

/**
 * Storage for the library. `chrome.storage.local` inside the extension, per section 14, and
 * `localStorage` outside it. Both are wrapped so the library never learns which it got.
 *
 * chrome.storage is asynchronous and the library's storage is not, so the panel reads the whole
 * thing once at start-up and keeps writing through to both. That is honest for a store this size:
 * it is a handful of kilobytes, and the alternative is making every read in the product async for
 * the sake of one surface.
 */
export async function openStorage(): Promise<KeyValue> {
  const local = browser()?.storage?.local;
  if (local === undefined) {
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
          // Storage denied. The work still stands for this visit.
        }
      },
    };
  }
  const KEYS = ['forge.library.v1'];
  const loaded = await local.get(KEYS);
  const cache = new Map<string, string>();
  for (const key of KEYS) {
    const value = loaded[key];
    if (typeof value === 'string') cache.set(key, value);
  }
  return {
    getItem: (key) => cache.get(key) ?? null,
    setItem: (key, value) => {
      cache.set(key, value);
      void local.set({ [key]: value });
    },
  };
}
