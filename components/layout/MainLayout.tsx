"use client"

import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import Footer from "./Footer"
import { RealtimeNotificationToast } from "@/components/notifications/RealtimeNotificationToast"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-shopify-navbar overflow-hidden">
      <Navbar />
      <Sidebar />
      {/* Componente invisible que escucha notificaciones en tiempo real y muestra toasts */}
      <RealtimeNotificationToast />
      {/* Main content con margin-left para el sidebar fijo */}
      <main className="ml-60 mt-16 h-[calc(100vh-4rem)] flex flex-col">
        {/* Rounded Content Container - Shopify style: sidebar + main = bloque unificado */}
        <div className="bg-[#F5F6F7] rounded-tr-3xl shadow-sm flex-1 overflow-y-auto flex flex-col">
          <div className="max-w-7xl mx-auto px-8 py-8 flex-1">{children}</div>
          <Footer />
        </div>
      </main>
    </div>
  )
}
