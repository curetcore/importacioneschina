import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sistema de importacion",
  description: "Sistema de importacion con control financiero automático",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
