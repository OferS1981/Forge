import { useCallback, useEffect, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { createStore, useStore } from '../lib/store';

export type ToastTone = 'info' | 'good' | 'warn' | 'crit';

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
  /** Milliseconds on screen. A warning stays until dismissed. */
  duration: number;
}

interface ToastState {
  items: ToastItem[];
  seq: number;
}

const store = createStore<ToastState>({ items: [], seq: 0 });

/** Raise a message. A control says what it does, then confirms it did it: this is the confirm. */
export function toast(message: string, tone: ToastTone = 'info', duration = 4000): string {
  const state = store.get();
  const id = `toast-${String(state.seq + 1)}`;
  store.set({ items: [...state.items, { id, message, tone, duration }], seq: state.seq + 1 });
  return id;
}

export function dismissToast(id: string): void {
  store.set((s) => ({ ...s, items: s.items.filter((t) => t.id !== id) }));
}

export function clearToasts(): void {
  store.set((s) => ({ ...s, items: [] }));
}

function Item({ item }: { item: ToastItem }): ReactNode {
  const remove = useCallback(() => {
    dismissToast(item.id);
  }, [item.id]);

  useEffect(() => {
    if (item.duration <= 0) return;
    const t = setTimeout(remove, item.duration);
    return () => {
      clearTimeout(t);
    };
  }, [item.duration, remove]);

  return (
    <div className={cn('fg-toast', `fg-toast--${item.tone}`)}>
      <span className="fg-toast__text">{item.message}</span>
      <button
        type="button"
        className="fg-toast__close"
        aria-label="Dismiss this message"
        onClick={remove}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}

/**
 * One live region for the whole page, mounted once. Announcements are polite so they never
 * interrupt what a screen-reader user is already reading, except a critical one.
 */
export function ToastRegion({ className }: { className?: string }): ReactNode {
  const [state] = useStore(store);
  const critical = state.items.some((t) => t.tone === 'crit');

  return (
    <div
      className={cn('fg-toasts', className)}
      role="status"
      aria-live={critical ? 'assertive' : 'polite'}
      aria-atomic="false"
    >
      {state.items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}

/** Exported for tests, so a suite can assert on the queue without rendering. */
export const toastStore = store;
