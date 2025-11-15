import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CURET - Sistema de Importaciones China",
  description: "Sistema de gestión de importaciones desde China con control financiero automático",
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
