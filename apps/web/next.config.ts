import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  // Compile the shared TS contract package instead of expecting a prebuilt bundle.
  transpilePackages: ['@conduit/contracts'],
};

export default nextConfig;
