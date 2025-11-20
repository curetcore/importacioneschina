"use client"

import Navbar from "./Navbar"
import Sidebar from "./Sidebar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-shopify-navbar overflow-x-hidden">
      <Navbar />
      <Sidebar />
      {/* Main content con margin-left para el sidebar fijo */}
      <main className="ml-60 mt-16 min-h-screen">
        {/* Rounded Content Container - Shopify style: sidebar + main = bloque unificado */}
        <div className="bg-white rounded-tr-3xl shadow-sm min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
