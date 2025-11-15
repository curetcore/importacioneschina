"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { formatCurrency } from "@/lib/utils"
import {
  TrendingUp,
  Package,
  CheckCircle2,
  DollarSign,
  Activity,
  AlertCircle,
  Clock
} from "lucide-react"

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
    icon: DollarSign,
    format: "currency"
  },
  {
    key: "unidadesOrdenadas",
    label: "Unidades Ordenadas",
    icon: Package,
    format: "number"
  },
  {
    key: "unidadesRecibidas",
    label: "Unidades Recibidas",
    icon: CheckCircle2,
    format: "number"
  },
  {
    key: "costoPromedioUnitario",
    label: "Costo Promedio",
    icon: TrendingUp,
    format: "currency"
  },
]

export default function PanelPage() {
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
            <Activity className="w-8 h-8 text-gray-400 animate-pulse mx-auto mb-3" />
            <p className="text-sm text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Error al cargar datos</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Métricas y estadísticas en tiempo real</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => {
            const value = data.kpis[kpi.key as keyof typeof data.kpis]
            const Icon = kpi.icon
            return (
              <div
                key={kpi.key}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {kpi.label}
                  </p>
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {kpi.format === "currency"
                    ? formatCurrency(Number(value))
                    : Number(value).toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                OCs Activas
              </p>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900 mb-1">
              {data.kpis.ocsActivas}
            </p>
            <p className="text-xs text-gray-500">En proceso de recepción</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                OCs Completadas
              </p>
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900 mb-1">
              {data.kpis.ocsCompletadas}
            </p>
            <p className="text-xs text-gray-500">Recepción finalizada</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Inversión por Proveedor
            </h3>
            <div className="space-y-4">
              {data.graficos.inversionPorProveedor.map((item, index) => {
                const total = data.graficos.inversionPorProveedor.reduce((sum, p) => sum + p.value, 0)
                const percentage = (item.value / total) * 100
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <span className="text-gray-500">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gray-900"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{percentage.toFixed(1)}% del total</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Gastos por Tipo
            </h3>
            <div className="space-y-2">
              {data.graficos.gastosPorTipo.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-gray-900" />
                    <span className="text-xs font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
