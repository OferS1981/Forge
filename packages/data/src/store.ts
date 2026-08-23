import { EMPTY_LIBRARY, type Library, type LibraryData } from './types';

/**
 * One snapshot of the library, that screens subscribe to.
 *
 * Deliberately not React: it is `get`, `subscribe` and a set of actions, which `useSyncExternalStore`
 * binds to in three lines and which a Node test drives directly. Every action writes through the
 * `Library` and then re-reads, so what is on screen is what was stored rather than what was hoped.
 *
 * A failure is put into the state rather than thrown, because a screen that has lost its connection
 * should say so in a line of text, not disappear behind an error boundary.
 */

export type LibraryStatus = 'loading' | 'ready' | 'error';

export interface LibraryState {
  kind: 'local' | 'account';
  status: LibraryStatus;
  data: LibraryData;
  /** What went wrong, in the words the screen shows. Null when nothing has. */
  error: string | null;
  /** True while an action is in flight, so a button can say it is working. */
  busy: boolean;
}

export interface LibraryStore {
  get: () => LibraryState;
  subscribe: (listener: () => void) => () => void;
  /** Re-read everything. Called on mount, after a sign-in, and after an import. */
  reload: () => Promise<void>;
  /** Run one action against the library, then re-read. Returns null if it failed. */
  run: <T>(work: (library: Library) => Promise<T>) => Promise<T | null>;
  /** The library itself, for the few reads that are not mutations. */
  library: () => Library;
  /** Signing in or out swaps the library underneath the same screens. */
  swap: (next: Library) => Promise<void>;
  dismissError: () => void;
}

function message(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  return 'The library could not be reached. Check the connection and try again.';
}

export function createLibraryStore(initial: Library): LibraryStore {
  let library = initial;
  let state: LibraryState = {
    kind: initial.kind,
    status: 'loading',
    data: EMPTY_LIBRARY,
    error: null,
    busy: false,
  };
  const listeners = new Set<() => void>();

  function set(patch: Partial<LibraryState>): void {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  }

  async function reload(): Promise<void> {
    try {
      const data = await library.read();
      set({ data, status: 'ready', error: null, kind: library.kind });
    } catch (error) {
      set({ status: 'error', error: message(error), kind: library.kind });
    }
  }

  return {
    get: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reload,
    run: async (work) => {
      set({ busy: true, error: null });
      try {
        const result = await work(library);
        await reload();
        set({ busy: false });
        return result;
      } catch (error) {
        set({ busy: false, error: message(error) });
        return null;
      }
    },
    library: () => library,
    swap: async (next) => {
      library = next;
      set({ kind: next.kind, status: 'loading', data: EMPTY_LIBRARY, error: null });
      await reload();
    },
    dismissError: () => {
      set({ error: null });
    },
  };
}
