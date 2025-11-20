"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  DollarSign,
  FileText,
  Inbox,
  Folder,
  Settings,
} from "lucide-react"

const menuItems = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/ordenes", label: "Ordenes", icon: Package },
  { href: "/pagos-china", label: "Pagos", icon: DollarSign },
  { href: "/gastos-logisticos", label: "Gastos", icon: FileText },
  { href: "/inventario-recibido", label: "Inventario", icon: Inbox },
  { href: "/documentos", label: "Documentos", icon: Folder },
]

const bottomMenuItems = [{ href: "/configuracion", label: "Configuración", icon: Settings }]

export default function Sidebar() {
  const pathname = usePathname()

  const renderMenuItem = (item: (typeof menuItems)[0]) => {
    const isActive = pathname === item.href
    const Icon = item.icon
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
          isActive
            ? "bg-shopify-surface-selected text-shopify-primary font-semibold"
            : "text-shopify-text-subdued hover:bg-shopify-surface-hovered font-semibold"
        )}
      >
        <Icon
          size={18}
          className={cn(isActive ? "text-shopify-primary" : "text-shopify-text-subdued")}
        />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-60 bg-[#E8E9EA] border-r border-shopify-border-subdued overflow-y-auto z-40 flex flex-col rounded-tl-3xl">
      {/* Main menu items */}
      <div className="pt-4 flex-1">
        <nav className="space-y-1 px-3">{menuItems.map(renderMenuItem)}</nav>
      </div>

      {/* Bottom menu items (Settings) - Shopify style - Comprimido */}
      <div className="border-t border-shopify-border-neutral py-2">
        <nav className="space-y-1 px-3">{bottomMenuItems.map(renderMenuItem)}</nav>
      </div>
    </aside>
  )
}
