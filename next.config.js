/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorer les erreurs ESLint pendant le build (warnings seulement)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignorer les erreurs TypeScript pendant le build
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'supabase.co',
      '*.supabase.co',
      'mux.com',
      '*.mux.com',
      'cdn.memevote.fun'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.mux.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: require.resolve("stream-browserify"),
        "readable-stream": require.resolve("readable-stream"),
      };
    }
    return config;
  },
};

module.exports = nextConfig;

