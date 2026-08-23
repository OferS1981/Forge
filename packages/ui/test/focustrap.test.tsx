import { useRef, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useFocusTrap } from '../src/lib/useFocusTrap';
import { must, setup } from './helpers';

function Trapped({ empty = false }: { empty?: boolean }): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(true, ref);
  return (
    <div ref={ref}>
      {!empty && (
        <>
          <button type="button">First</button>
          <button type="button">Second</button>
          <button type="button">Last</button>
        </>
      )}
    </div>
  );
}

describe('useFocusTrap', () => {
  it('wraps forwards from the last item and backwards from the first', async () => {
    const { user } = setup(<Trapped />);
    expect(document.activeElement).toHaveTextContent('First');
    await user.tab();
    await user.tab();
    expect(document.activeElement).toHaveTextContent('Last');
    await user.tab();
    expect(document.activeElement).toHaveTextContent('First');
    await user.tab({ shift: true });
    expect(document.activeElement).toHaveTextContent('Last');
  });

  it('keeps the tab key inside even when there is nothing to focus', async () => {
    const { user, container } = setup(<Trapped empty />);
    const root = must(container.querySelector('div'), 'the trapped region');
    expect(document.activeElement).toBe(root);
    await user.tab();
    expect(document.activeElement).toBe(root);
  });
});
