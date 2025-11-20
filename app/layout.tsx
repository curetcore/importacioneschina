import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Sistema de Importación - Gestión Financiera Automática",
  description:
    "Sistema de importación con control financiero automático, gestión de proveedores, productos y reportes en tiempo real",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Sistema de Importación",
    description: "Sistema de importación con control financiero automático",
    images: [
      {
        url: "/logo-512.png",
        width: 512,
        height: 512,
        alt: "Sistema de Importación Logo",
      },
    ],
    locale: "es_DO",
    type: "website",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
