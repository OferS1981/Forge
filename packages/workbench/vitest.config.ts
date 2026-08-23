import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'workbench',
    include: ['test/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    css: false,
  },
});
