"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const menuItems = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/oc-china", label: "OC China", icon: "📦" },
  { href: "/pagos-china", label: "Pagos", icon: "💰" },
  { href: "/gastos-logisticos", label: "Gastos", icon: "📋" },
  { href: "/inventario-recibido", label: "Inventario", icon: "📥" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <Link href="/" className="block mb-8">
          <h2 className="text-xl font-bold text-gray-900">
            Sistema de importacion
          </h2>
          <p className="text-xs text-gray-500 mt-1">Control financiero</p>
        </Link>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className={cn(
                  "font-medium",
                  isActive ? "text-white" : "text-gray-700"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
