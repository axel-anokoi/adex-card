import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['https://adex-card.netlify.app'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fqdonqlxygaxmfnyjhvh.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
