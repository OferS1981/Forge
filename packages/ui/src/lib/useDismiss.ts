import { useEffect, type RefObject } from 'react';

/**
 * Escape closes and returns focus to whatever opened the layer. A pointer press outside closes it
 * without moving focus. Both are part of the native contract for a popup, so every layer gets them.
 */
export function useDismiss(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  onClose: (returnFocus: boolean) => void,
  extra?: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose(true);
      }
    };
    const onPointer = (e: MouseEvent): void => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (ref.current?.contains(target)) return;
      if (extra?.current?.contains(target)) return;
      onClose(false);
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, ref, extra, onClose]);
}
