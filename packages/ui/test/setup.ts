import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';
import { axe } from './axe';

/**
 * jsdom implements no layout, so it has no scrollIntoView. Keeping a scrolled-to row visible is
 * real behaviour worth having, so it is stubbed here rather than removed from the component.
 * Playwright exercises the real thing.
 */
const proto = Element.prototype as { scrollIntoView?: () => void };
proto.scrollIntoView ??= function scrollIntoView(): void {
  // Nothing to do without layout.
};

afterEach(() => {
  cleanup();
});

/**
 * Every component suite ends with this. It runs the same axe rules CI runs in the browser, minus
 * the ones that need real layout and colour, which the Playwright pass covers instead.
 */
expect.extend({
  async toHaveNoAxeViolations(received: HTMLElement) {
    const violations = await axe(received);
    return {
      pass: violations.length === 0,
      message: () =>
        violations.length === 0
          ? 'Expected axe violations, found none.'
          : `axe found ${String(violations.length)} violation(s):\n` +
            violations
              .map((v) => `  ${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.html).join('\n    ')}`)
              .join('\n'),
    };
  },
});

declare module 'vitest' {
  interface Assertion {
    toHaveNoAxeViolations: () => Promise<void>;
  }
}
