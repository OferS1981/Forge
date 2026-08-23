import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Everything inside `root` a Tab can land on. Hidden subtrees are skipped by attribute rather than
 * by measuring layout, because our closed layers render nothing at all, and because a check that
 * needs layout silently returns an empty list under a test runner.
 */
export function focusable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.closest('[hidden]') === null && el.closest('[aria-hidden="true"]') === null,
  );
}

/**
 * Tab stays inside a modal layer while it is open, and focus goes back where it came from when it
 * closes. Without this a screen-reader user tabs into the page behind the dialog.
 */
export function useFocusTrap(open: boolean, ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = ref.current;
    if (root) {
      const first = focusable(root)[0];
      if (first) first.focus();
      else {
        // Nothing inside to focus. The layer itself takes it, so a screen reader lands in the
        // dialog rather than staying on the page behind it.
        root.tabIndex = -1;
        root.focus();
      }
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab' || !ref.current) return;
      const items = focusable(ref.current);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const current = document.activeElement;
      if (e.shiftKey && (current === first || !ref.current.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previous?.focus();
    };
  }, [open, ref]);
}
