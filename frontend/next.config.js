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
        destination: 'http://ai-genomics-api:8000/api/:path*',
      },
      {
        source: '/storage/:path*',
        destination: 'http://ai-genomics-api:8000/storage/:path*',
      },
    ]
  },
}

module.exports = nextConfig
