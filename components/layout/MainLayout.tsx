"use client"

import Navbar from "./Navbar"
import Sidebar from "./Sidebar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-shopify-navbar overflow-hidden">
      <Navbar />
      <Sidebar />
      {/* Main content con margin-left para el sidebar fijo */}
      <main className="ml-60 mt-16 h-[calc(100vh-4rem)] overflow-y-auto">
        {/* Rounded Content Container - Shopify style: sidebar + main = bloque unificado */}
        <div className="bg-[#F5F6F7] rounded-tr-3xl shadow-sm min-h-full">
          <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
