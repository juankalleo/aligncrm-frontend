/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! AVISO !!
    // Permite build de produção mesmo com erros de tipo TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Permite build de produção mesmo com erros de ESLint
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'api.aligncrm.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
