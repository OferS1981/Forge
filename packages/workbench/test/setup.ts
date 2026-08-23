import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/** jsdom has no layout, so no scrollIntoView. Playwright exercises the real thing. */
const proto = Element.prototype as { scrollIntoView?: () => void };
proto.scrollIntoView ??= function scrollIntoView(): void {
  // Nothing to do without layout.
};

afterEach(() => {
  cleanup();
});
