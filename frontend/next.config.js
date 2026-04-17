/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://ai-genomics-api:8000/:path*',
      },
    ]
  },
}

module.exports = nextConfig
