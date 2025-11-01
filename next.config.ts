import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@xenova/transformers'],
  // Empty turbopack config to avoid webpack warnings in Next.js 16
  turbopack: {},
  // Add headers for CORS and model loading
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
        ],
      },
    ];
  }
};

export default nextConfig;
