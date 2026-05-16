import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.81'],
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
