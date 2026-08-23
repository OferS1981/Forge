import type { NextConfig } from 'next';

/**
 * A static export. Every page Forge has is the same page for everyone, the engine runs in the
 * browser, and nothing needs a server, so the whole site drops onto any free host as files.
 */
const config: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  // The workspace packages ship TypeScript source rather than a build step.
  transpilePackages: ['@forge/catalog', '@forge/ui'],
  images: { unoptimized: true },
};

export default config;
