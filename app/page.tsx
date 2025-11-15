"use client"

import Link from "next/link"

const modules = [
  {
    title: "Dashboard",
    description: "Ver métricas y estadísticas generales",
    icon: "📊",
    href: "/dashboard",
    color: "from-blue-500 to-blue-600"
  },
  {
    title: "OC China",
    description: "Gestionar órdenes de compra",
    icon: "📦",
    href: "/oc-china",
    color: "from-purple-500 to-purple-600"
  },
  {
    title: "Pagos",
    description: "Control de pagos y conversiones",
    icon: "💰",
    href: "/pagos-china",
    color: "from-green-500 to-green-600"
  },
  {
    title: "Gastos",
    description: "Gastos logísticos y extras",
    icon: "📋",
    href: "/gastos-logisticos",
    color: "from-orange-500 to-orange-600"
  },
  {
    title: "Inventario",
    description: "Recepción de mercancía",
    icon: "📥",
    href: "/inventario-recibido",
    color: "from-red-500 to-red-600"
  }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Sistema de importacion
          </h1>
          <p className="text-xl text-gray-600">
            Control financiero automático para importaciones
          </p>
        </div>

        {/* Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full">
                <div className={`h-2 bg-gradient-to-r ${module.color}`} />
                <div className="p-8">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
                    {module.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {module.title}
                  </h3>
                  <p className="text-gray-600">
                    {module.description}
                  </p>
                </div>
                <div className="px-8 pb-6">
                  <div className={`inline-flex items-center text-sm font-medium bg-gradient-to-r ${module.color} text-white px-4 py-2 rounded-lg`}>
                    Ir al módulo →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Acceso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/dashboard" className="group p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all">
              <div className="text-3xl mb-2">📈</div>
              <div className="font-semibold text-gray-900">Ver Dashboard</div>
              <div className="text-sm text-gray-600 mt-1">Métricas en tiempo real</div>
            </Link>
            <Link href="/oc-china" className="group p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all">
              <div className="text-3xl mb-2">➕</div>
              <div className="font-semibold text-gray-900">Nueva OC</div>
              <div className="text-sm text-gray-600 mt-1">Registrar orden de compra</div>
            </Link>
            <Link href="/pagos-china" className="group p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all">
              <div className="text-3xl mb-2">💵</div>
              <div className="font-semibold text-gray-900">Nuevo Pago</div>
              <div className="text-sm text-gray-600 mt-1">Registrar pago</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
