import type { NextConfig } from 'next'

const apiProxy = process.env.API_PROXY_URL || 'http://localhost:3001'
const forceHttps =
  process.env.FORCE_HTTPS === 'true' ||
  (process.env.FORCE_HTTPS !== 'false' && process.env.NODE_ENV === 'production')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Next 16 blocks cross-origin HMR WebSockets unless LAN hosts are allowlisted.
  allowedDevOrigins: ['192.168.1.129', '192.168.1.109', '127.0.0.1'],
  transpilePackages: ['plotly.js-dist', 'react-plotly.js'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxy}/api/:path*`,
      },
    ]
  },
  // Baseline headers; per-request CSP (with nonces) + HSTS redirect live in src/middleware.ts
  async headers() {
    const base = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ]
    if (forceHttps) {
      base.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      })
    }
    return [{ source: '/:path*', headers: base }]
  },
}

export default nextConfig
