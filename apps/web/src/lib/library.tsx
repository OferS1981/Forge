'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  BROWSER_ENV,
  createLibraryStore,
  createLocalLibrary,
  createRemoteLibrary,
  EMPTY_LIBRARY,
  type Library,
  type LibraryState,
  type LibraryStore,
} from '@forge/data';
import { configured, portFor, watchAccount, type Account } from './account';

/**
 * One library for the whole app, and one place that decides which one it is.
 *
 * Signing in swaps the library underneath the screens. No screen asks whether anybody is signed in
 * before deciding what it can do, which is what keeps the rule that a signed-out visitor has the
 * whole product from quietly rotting.
 */

interface LibraryContext {
  store: LibraryStore;
  account: Account | null;
  /** False in a build with no account service, which is the normal state of this repository. */
  accountsAvailable: boolean;
}

const Context = createContext<LibraryContext | null>(null);

/**
 * localStorage is not there during the export, and it can be denied in the browser. A refusal is
 * not an error worth showing: the library is simply empty for this visit.
 */
function browserStorage(): {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
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
        // Storage denied. The work still stands for this visit.
      }
    },
  };
}

function localLibrary(): Library {
  return createLocalLibrary(browserStorage(), BROWSER_ENV);
}

export function LibraryProvider({ children }: { children: ReactNode }): ReactNode {
  const [account, setAccount] = useState<Account | null>(null);
  const store = useMemo(() => createLibraryStore(localLibrary()), []);
  const signedIn = useRef<string | null>(null);

  useEffect(() => {
    void store.reload();
  }, [store]);

  useEffect(() => watchAccount(setAccount), []);

  useEffect(() => {
    const id = account?.userId ?? null;
    if (signedIn.current === id) return;
    signedIn.current = id;
    void store.swap(id === null ? localLibrary() : createRemoteLibrary(portFor(id), BROWSER_ENV));
  }, [account, store]);

  const value = useMemo(
    () => ({ store, account, accountsAvailable: configured() }),
    [store, account],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

function useContextOrThrow(): LibraryContext {
  const value = useContext(Context);
  if (value === null) throw new Error('The library is only available inside LibraryProvider.');
  return value;
}

const LOADING: LibraryState = {
  kind: 'local',
  status: 'loading',
  data: EMPTY_LIBRARY,
  error: null,
  busy: false,
};

export interface UseLibrary extends LibraryContext {
  state: LibraryState;
}

export function useLibrary(): UseLibrary {
  const context = useContextOrThrow();
  const { store } = context;
  const state = useSyncExternalStore(
    store.subscribe,
    store.get,
    // The exported HTML has no storage to read, so the server snapshot is the loading one.
    () => LOADING,
  );
  return { ...context, state };
}

/**
 * The pinned models, in the order they were pinned. Pins moved into the library this phase, so that
 * they follow an account around rather than staying in one browser.
 */
export function usePinnedModels(): {
  pins: string[];
  toggle: (modelId: string) => void;
} {
  const { store, state } = useLibrary();
  const pins = useMemo(() => state.data.pins.map((p) => p.modelId), [state.data.pins]);
  const toggle = useCallback(
    (modelId: string) => {
      const next = pins.includes(modelId)
        ? pins.filter((id) => id !== modelId)
        : [...pins, modelId];
      void store.run((library) =>
        library.setPins(next.map((id, position) => ({ modelId: id, position }))),
      );
    },
    [pins, store],
  );
  return { pins, toggle };
}
