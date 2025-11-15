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
        <div className="text-center py-12">Cargando...</div>
      </MainLayout>
    )
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="text-center py-12">Error al cargar datos</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Métricas y estadísticas generales</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Inversión Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(data.kpis.inversionTotal)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Unidades Ordenadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {data.kpis.unidadesOrdenadas.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Unidades Recibidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {data.kpis.unidadesRecibidas.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Costo Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(data.kpis.costoPromedioUnitario)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inversión por Proveedor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.graficos.inversionPorProveedor.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gastos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.graficos.gastosPorTipo.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                OCs Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {data.kpis.ocsActivas}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                OCs Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {data.kpis.ocsCompletadas}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
