import { useCallback, useSyncExternalStore } from 'react';

/**
 * A typed store in about twenty lines, which is all the state management this product needs.
 * No state library: the spec forbids one, and nothing here justifies it.
 */
export interface Store<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
      if (Object.is(resolved, value)) return;
      value = resolved;
      for (const l of listeners) l();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T>(store: Store<T>): [T, Store<T>['set']] {
  const value = useSyncExternalStore(store.subscribe, store.get, store.get);
  const set = useCallback<Store<T>['set']>(
    (next) => {
      store.set(next);
    },
    [store],
  );
  return [value, set];
}
