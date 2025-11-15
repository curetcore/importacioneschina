"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export const dynamic = 'force-dynamic'

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
    format: "currency"
  },
  {
    key: "unidadesOrdenadas",
    label: "Unidades Ordenadas",
    format: "number"
  },
  {
    key: "unidadesRecibidas",
    label: "Unidades Recibidas",
    format: "number"
  },
  {
    key: "costoPromedioUnitario",
    label: "Costo Promedio Unitario",
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
        <div className="text-center py-12 text-sm text-gray-500">Cargando...</div>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Métricas y estadísticas en tiempo real</p>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => {
            const value = data.kpis[kpi.key as keyof typeof data.kpis]
            return (
              <Card key={kpi.key}>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">{kpi.label}</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {kpi.format === "currency"
                      ? formatCurrency(Number(value))
                      : Number(value).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Estado de OCs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 mb-1">OCs Activas</div>
              <div className="text-2xl font-semibold text-gray-900">{data.kpis.ocsActivas}</div>
              <div className="text-xs text-gray-500 mt-1">En proceso de recepción</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 mb-1">OCs Completadas</div>
              <div className="text-2xl font-semibold text-gray-900">{data.kpis.ocsCompletadas}</div>
              <div className="text-xs text-gray-500 mt-1">Recepción finalizada</div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inversión por Proveedor */}
          <Card>
            <CardHeader>
              <CardTitle>Inversión por Proveedor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.graficos.inversionPorProveedor.map((item, index) => {
                  const total = data.graficos.inversionPorProveedor.reduce((sum, p) => sum + p.value, 0)
                  const percentage = (item.value / total) * 100
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <span className="text-gray-600">{formatCurrency(item.value)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gray-900"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}% del total</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Gastos por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.graficos.gastosPorTipo.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
