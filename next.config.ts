import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    swcPlugins:
      process.env.NODE_ENV === 'test'
        ? [['swc-plugin-coverage-instrument', {}]]
        : [],
  },
};

export default nextConfig;
