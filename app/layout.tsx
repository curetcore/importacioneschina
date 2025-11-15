import type { Metadata } from "next"
import "./globals.css"
import { ToastProvider } from "@/components/ui/toast"

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
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
