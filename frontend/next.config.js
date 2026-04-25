/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Socket.io works better with strict mode off during dev
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig
