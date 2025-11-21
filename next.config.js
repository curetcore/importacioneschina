/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone para Docker
  output: "standalone",

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Optimizaciones
  compress: true,
  poweredByHeader: false,

  // Configuración de imágenes
  images: {
    domains: [],
    formats: ["image/avif", "image/webp"],
    // Allow unoptimized images for local uploads
    unoptimized: false,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
}

module.exports = nextConfig
