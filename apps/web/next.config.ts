import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Compile the shared TS contract package instead of expecting a prebuilt bundle.
  transpilePackages: ['@conduit/contracts'],
};

export default nextConfig;
