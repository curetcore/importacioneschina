/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone para Docker
  output: 'standalone',

  // Configuración de Webpack
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Optimizaciones
  compress: true,
  poweredByHeader: false,

  // Configuración de imágenes
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
