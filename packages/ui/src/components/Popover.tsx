import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { cn } from '../lib/cn';
import { useDismiss } from '../lib/useDismiss';
import { usePosition, type Align, type Side } from '../lib/usePosition';

export interface PopoverProps {
  open: boolean;
  onClose: (returnFocus: boolean) => void;
  /** What the layer is positioned against, and what focus returns to. */
  anchor: RefObject<HTMLElement | null>;
  children: ReactNode;
  side?: Side | undefined;
  align?: Align | undefined;
  label?: string | undefined;
  labelledBy?: string | undefined;
  /** Move focus into the layer when it opens. Off for a tooltip, on for a menu. */
  focusOnOpen?: boolean | undefined;
  id?: string | undefined;
  className?: string | undefined;
  role?: 'dialog' | 'tooltip' | 'group' | 'none' | undefined;
}

/**
 * A layer rendered in our own page, positioned against its anchor, dismissed on Escape or an
 * outside press. This is what replaces every native popup the operating system would otherwise
 * draw for us.
 */
export function Popover({
  open,
  onClose,
  anchor,
  children,
  side = 'bottom',
  align = 'start',
  label,
  labelledBy,
  focusOnOpen = false,
  id,
  className,
  role = 'dialog',
}: PopoverProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const pos = usePosition(open, anchor, ref, side, align);
  const close = useCallback(
    (returnFocus: boolean) => {
      onClose(returnFocus);
      if (returnFocus) anchor.current?.focus();
    },
    [onClose, anchor],
  );
  useDismiss(open, ref, close, anchor);

  useEffect(() => {
    if (!open || !focusOnOpen) return;
    ref.current?.focus();
  }, [open, focusOnOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      id={id}
      className={cn('fg-pop', className)}
      role={role === 'none' ? undefined : role}
      aria-label={label}
      aria-labelledby={labelledBy}
      data-side={pos.side}
      tabIndex={focusOnOpen ? -1 : undefined}
      style={{ top: pos.top, left: pos.left }}
    >
      {children}
    </div>
  );
}
