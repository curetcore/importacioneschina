/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone para Docker
  output: 'standalone',

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
