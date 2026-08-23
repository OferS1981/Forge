import { describe, expect, it } from 'vitest';
import { place, type Box } from '../src/lib/usePosition';

/** A 100 by 30 anchor at the given point. */
function anchor(top: number, left: number, width = 100, height = 30): Box {
  return { top, left, width, height, right: left + width, bottom: top + height };
}

const LAYER = { width: 300, height: 200 };
const PHONE = { width: 375, height: 720 };
const DESKTOP = { width: 1500, height: 900 };

describe('place', () => {
  it('sits under the anchor when there is room', () => {
    const p = place(anchor(100, 40), LAYER, DESKTOP, 'bottom', 'start', 6);
    expect(p.side).toBe('bottom');
    expect(p.top).toBe(136);
    expect(p.left).toBe(40);
  });

  it('flips above when the bottom would run off the screen', () => {
    const p = place(anchor(600, 40), LAYER, PHONE, 'bottom', 'start', 6);
    expect(p.side).toBe('top');
    expect(p.top).toBe(394);
  });

  it('stays below when there is no room above either', () => {
    const p = place(anchor(10, 40), LAYER, { width: 375, height: 260 }, 'bottom', 'start', 6);
    expect(p.side).toBe('bottom');
  });

  it('flips below when the top would run off the screen', () => {
    const p = place(anchor(20, 40), LAYER, DESKTOP, 'top', 'start', 6);
    expect(p.side).toBe('bottom');
    expect(p.top).toBe(56);
  });

  it('never renders off the left or right edge of a phone', () => {
    const wide = place(anchor(100, 300), LAYER, PHONE, 'bottom', 'start', 6);
    expect(wide.left).toBe(PHONE.width - LAYER.width - 6);
    const off = place(anchor(100, -50), LAYER, PHONE, 'bottom', 'start', 6);
    expect(off.left).toBe(6);
  });

  it('centres and end-aligns against the anchor', () => {
    const centred = place(anchor(100, 400), LAYER, DESKTOP, 'bottom', 'center', 6);
    expect(centred.left).toBe(400 + 50 - 150);
    const ended = place(anchor(100, 400), LAYER, DESKTOP, 'bottom', 'end', 6);
    expect(ended.left).toBe(500 - 300);
  });

  it('sits beside the anchor when asked to', () => {
    const right = place(anchor(100, 400), LAYER, DESKTOP, 'right', 'start', 6);
    expect(right.left).toBe(506);
    expect(right.top).toBe(100);
    const left = place(anchor(100, 400), LAYER, DESKTOP, 'left', 'start', 6);
    expect(left.left).toBe(400 - 300 - 6);
  });

  it('keeps the layer inside the viewport vertically', () => {
    const p = place(anchor(700, 40), LAYER, PHONE, 'right', 'start', 6);
    expect(p.top).toBe(PHONE.height - LAYER.height - 6);
  });
});
