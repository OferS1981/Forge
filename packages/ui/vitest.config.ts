import { defineProject } from 'vitest/config';

/**
 * No React plugin here: Vite's own esbuild reads `jsx: react-jsx` from tsconfig, which is all a
 * test run needs. The plugin exists for the gallery, where fast refresh matters.
 */
export default defineProject({
  test: {
    name: 'ui',
    include: ['test/**/*.test.tsx', 'test/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    css: false,
  },
});
