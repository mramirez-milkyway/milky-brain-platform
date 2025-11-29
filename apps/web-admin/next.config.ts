import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Temporarily ignore type errors during build due to React 19 compatibility issues
    // with third-party libraries (react-apexcharts)
    // This will be resolved when libraries are updated for React 19
    ignoreBuildErrors: true,
  },
  // Configure turbopack for monorepo structure
  turbopack: {
    // Set root to the monorepo root (two levels up from apps/web-admin)
    root: '../../',
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },
}

export default nextConfig
