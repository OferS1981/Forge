import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/*/src/**/*.ts'],
      // Type-only and id-only files emit nothing at runtime, so they cannot be covered.
      exclude: [
        '**/*.test.ts',
        '**/index.ts',
        'packages/catalog/src/ids.ts',
        'packages/catalog/src/types.ts',
        'packages/catalog/src/fields-raw.ts',
      ],
      // packages/catalog is pure functions, so there is no excuse for less.
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 85,
      },
    },
  },
});
