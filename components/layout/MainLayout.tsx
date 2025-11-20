"use client"

import Navbar from "./Navbar"
import Sidebar from "./Sidebar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <Navbar />
      <Sidebar />
      {/* pt-16 para navbar (h-16), pl-60 para sidebar (w-60) */}
      <main className="pt-16 pl-60 p-8 min-w-0">{children}</main>
    </div>
  )
}
