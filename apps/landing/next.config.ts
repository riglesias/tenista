import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Only apply webpack config when not using Turbopack
  ...(process.env.TURBOPACK !== '1' && {
    webpack: (config, { isServer }) => {
      if (isServer) {
        config.externals.push('encoding');
      }
      return config;
    },
  }),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Turbopack configuration (if needed in future)
  experimental: {
    turbo: {
      // Turbopack-specific configuration can go here
      // Currently empty as 'encoding' external isn't needed with Turbopack
    },
  },
};

export default nextConfig;
