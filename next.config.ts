import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['https://adex-card.netlify.app', '192.168.1.7'],
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
