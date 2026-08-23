import type { NextConfig } from 'next';

/**
 * A static export. Every page Forge has is the same page for everyone, the engine runs in the
 * browser, and nothing needs a server, so the whole site drops onto any free host as files.
 */
const config: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  // The workspace packages ship TypeScript source rather than a build step.
  transpilePackages: ['@forge/catalog', '@forge/data', '@forge/ui'],
  images: { unoptimized: true },
  /*
   * Lessons are markdown files in the repository, imported as strings and rendered to React
   * elements at runtime. Turbopack needs telling that .md is source rather than an asset.
   */
  turbopack: {
    rules: {
      '*.md': { loaders: ['raw-loader'], as: '*.js' },
    },
  },
};

export default config;
