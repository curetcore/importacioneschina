"use client"

import Link from "next/link"
import {
  LayoutDashboard,
  Package,
  DollarSign,
  FileText,
  Inbox
} from "lucide-react"

const modules = [
  {
    title: "Dashboard",
    description: "Metricas y estadisticas generales",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "OC China",
    description: "Ordenes de compra",
    icon: Package,
    href: "/oc-china",
  },
  {
    title: "Pagos",
    description: "Pagos a proveedores",
    icon: DollarSign,
    href: "/pagos-china",
  },
  {
    title: "Gastos",
    description: "Gastos logisticos",
    icon: FileText,
    href: "/gastos-logisticos",
  },
  {
    title: "Inventario",
    description: "Recepcion de mercancia",
    icon: Inbox,
    href: "/inventario-recibido",
  }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-8 py-20">
        <div className="mb-16">
          <h1 className="text-4xl font-semibold text-gray-900 mb-3">
            Sistema de importacion
          </h1>
          <p className="text-lg text-gray-600">
            Selecciona un modulo para comenzar
          </p>
        </div>

        <div className="grid gap-3">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 group-hover:bg-gray-200">
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-gray-900">
                    {module.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {module.description}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
