import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'extension',
    include: ['test/**/*.test.ts'],
    // The paste adapters are the risky part and they are all DOM, so they are tested in one.
    environment: 'jsdom',
  },
});
