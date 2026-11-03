import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.20.1.108', 'localhost', '127.0.0.1'],
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
