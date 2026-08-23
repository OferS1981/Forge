import { useLayoutEffect, useState, type RefObject } from 'react';

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';

export interface Position {
  top: number;
  left: number;
  side: Side;
}

export interface Box {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Where a layer sits relative to what opened it. Pure, so the flipping and clamping can be tested
 * without a browser: it is the part that stops a popover rendering off the screen at 375px.
 */
export function place(
  anchor: Box,
  layer: Pick<Box, 'width' | 'height'>,
  viewport: { width: number; height: number },
  preferred: Side,
  align: Align,
  gap: number,
): Position {
  let side = preferred;
  if (
    preferred === 'bottom' &&
    anchor.bottom + gap + layer.height > viewport.height &&
    anchor.top - gap - layer.height > 0
  )
    side = 'top';
  if (
    preferred === 'top' &&
    anchor.top - gap - layer.height < 0 &&
    anchor.bottom + gap + layer.height < viewport.height
  )
    side = 'bottom';

  let top = side === 'top' ? anchor.top - layer.height - gap : anchor.bottom + gap;
  if (side === 'left' || side === 'right') top = anchor.top;

  let left = anchor.left;
  if (align === 'center') left = anchor.left + anchor.width / 2 - layer.width / 2;
  if (align === 'end') left = anchor.right - layer.width;
  if (side === 'left') left = anchor.left - layer.width - gap;
  if (side === 'right') left = anchor.right + gap;

  left = Math.max(gap, Math.min(left, viewport.width - layer.width - gap));
  top = Math.max(gap, Math.min(top, viewport.height - layer.height - gap));
  return { top, left, side };
}

export function usePosition(
  open: boolean,
  anchor: RefObject<HTMLElement | null>,
  layer: RefObject<HTMLElement | null>,
  preferred: Side = 'bottom',
  align: Align = 'start',
  gap = 6,
): Position {
  const [pos, setPos] = useState<Position>({ top: 0, left: 0, side: preferred });

  useLayoutEffect(() => {
    if (!open) return;
    const measure = (): void => {
      const a = anchor.current?.getBoundingClientRect();
      const l = layer.current?.getBoundingClientRect();
      if (!a || !l) return;
      setPos(
        place(
          a,
          l,
          { width: window.innerWidth, height: window.innerHeight },
          preferred,
          align,
          gap,
        ),
      );
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, anchor, layer, preferred, align, gap]);

  return pos;
}
