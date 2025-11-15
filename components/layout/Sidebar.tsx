"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  DollarSign,
  FileText,
  Inbox
} from "lucide-react"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/oc-china", label: "OC China", icon: Package },
  { href: "/pagos-china", label: "Pagos", icon: DollarSign },
  { href: "/gastos-logisticos", label: "Gastos", icon: FileText },
  { href: "/inventario-recibido", label: "Inventario", icon: Inbox },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <Link href="/" className="block px-3 py-2 mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Sistema de importacion
          </h2>
        </Link>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Icon size={18} className={cn(
                  isActive ? "text-gray-900" : "text-gray-500"
                )} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
