import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'data',
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // The policy tests boot a WebAssembly Postgres, which is slower than the default allows.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
