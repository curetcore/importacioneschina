"use client"

import Navbar from "./Navbar"
import Sidebar from "./Sidebar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
