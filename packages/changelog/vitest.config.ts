import { defineProject } from 'vitest/config';

export default defineProject({
  test: { name: 'changelog', include: ['test/**/*.test.ts'], environment: 'node' },
});
