"use client"

import Navbar from "./Navbar"
import Sidebar from "./Sidebar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-shopify-background overflow-x-hidden">
      <Navbar />
      <Sidebar />
      {/* pt-16 para navbar (h-16), pl-60 para sidebar (w-60) */}
      {/* max-w-7xl (1280px) + mx-auto + px-8 = Shopify style content area */}
      <main className="ml-60 mt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
