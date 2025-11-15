"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface DashboardData {
  kpis: {
    inversionTotal: number
    unidadesOrdenadas: number
    unidadesRecibidas: number
    diferenciaUnidades: number
    costoPromedioUnitario: number
    ocsActivas: number
    ocsCompletadas: number
  }
  graficos: {
    inversionPorProveedor: Array<{ name: string; value: number }>
    gastosPorTipo: Array<{ name: string; value: number }>
  }
}

const kpiCards = [
  {
    key: "inversionTotal",
    label: "Inversión Total",
    icon: "💰",
    color: "from-green-500 to-emerald-600",
    format: "currency"
  },
  {
    key: "unidadesOrdenadas",
    label: "Unidades Ordenadas",
    icon: "📦",
    color: "from-blue-500 to-blue-600",
    format: "number"
  },
  {
    key: "unidadesRecibidas",
    label: "Unidades Recibidas",
    icon: "✅",
    color: "from-purple-500 to-purple-600",
    format: "number"
  },
  {
    key: "costoPromedioUnitario",
    label: "Costo Promedio",
    icon: "📊",
    color: "from-orange-500 to-orange-600",
    format: "currency"
  },
]

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-xl text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-red-600">Error al cargar datos</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Métricas y estadísticas en tiempo real</p>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((kpi) => {
            const value = data.kpis[kpi.key as keyof typeof data.kpis]
            return (
              <div key={kpi.key} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className={`h-2 bg-gradient-to-r ${kpi.color}`} />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{kpi.icon}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-2">{kpi.label}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {kpi.format === "currency"
                      ? formatCurrency(Number(value))
                      : Number(value).toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Estado de OCs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-5xl">🔄</div>
              <div>
                <p className="text-sm font-medium text-gray-600">OCs Activas</p>
                <p className="text-4xl font-bold text-blue-600">{data.kpis.ocsActivas}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">En proceso de recepción</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-5xl">✅</div>
              <div>
                <p className="text-sm font-medium text-gray-600">OCs Completadas</p>
                <p className="text-4xl font-bold text-green-600">{data.kpis.ocsCompletadas}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Recepción finalizada</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inversión por Proveedor */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">💼 Inversión por Proveedor</h3>
            <div className="space-y-4">
              {data.graficos.inversionPorProveedor.map((item, index) => {
                const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500"]
                const total = data.graficos.inversionPorProveedor.reduce((sum, p) => sum + p.value, 0)
                const percentage = (item.value / total) * 100
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <span className="text-gray-600">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${colors[index % colors.length]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{percentage.toFixed(1)}% del total</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Gastos por Tipo */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">📋 Gastos por Tipo</h3>
            <div className="space-y-4">
              {data.graficos.gastosPorTipo.slice(0, 5).map((item, index) => {
                const colors = ["bg-red-500", "bg-yellow-500", "bg-indigo-500", "bg-pink-500", "bg-teal-500"]
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                      <span className="font-medium text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(item.value)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
