"use client"

import { useQuery } from "@tanstack/react-query"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

export const dynamic = 'force-dynamic'

interface DashboardData {
  kpis: {
    inversionTotal: number
    unidadesOrdenadas: number
    unidadesRecibidas: number
    diferenciaUnidades: number
    costoPromedioUnitario: number
    totalComisiones: number
    ocsActivas: number
    ocsCompletadas: number
  }
  financiero: {
    pagosPorMetodo: Array<{ name: string; value: number; cantidad: number }>
    pagosPorTipo: Array<{ name: string; value: number; cantidad: number }>
    pagosPorMoneda: Array<{ moneda: string; totalOriginal: number; totalRD: number; cantidad: number }>
    tasasPromedio: Array<{ moneda: string; tasa: number }>
  }
  gastos: {
    gastosPorTipo: Array<{ name: string; value: number; cantidad: number }>
    gastosPorProveedor: Array<{ name: string; value: number; cantidad: number }>
  }
  inventario: {
    inventarioPorBodega: Array<{ name: string; value: number }>
    topProductos: Array<{ sku: string; nombre: string; unidades: number; valorUSD: number }>
    comprasPorCategoria: Array<{ name: string; unidades: number; inversion: number }>
  }
  proveedores: {
    inversionPorProveedor: Array<{ name: string; inversion: number; unidades: number }>
  }
  tablas: {
    topOCs: Array<{ oc: string; proveedor: string; inversion: number; unidades: number; costoUnitario: number }>
    transacciones: Array<{ tipo: "Pago" | "Gasto"; id: string; oc: string; fecha: Date; monto: number; descripcion: string }>
  }
}

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658']

const kpiCards = [
  {
    key: "inversionTotal",
    label: "Inversión Total",
    format: "currency",
    subtitle: "Inversión completa en RD$"
  },
  {
    key: "unidadesOrdenadas",
    label: "Unidades Ordenadas",
    format: "number",
    subtitle: "Total de unidades compradas"
  },
  {
    key: "unidadesRecibidas",
    label: "Unidades Recibidas",
    format: "number",
    subtitle: "Ya en bodega"
  },
  {
    key: "costoPromedioUnitario",
    label: "Costo Promedio Unitario",
    format: "currency",
    subtitle: "Por unidad recibida"
  },
  {
    key: "totalComisiones",
    label: "Comisiones Bancarias",
    format: "currency",
    subtitle: "Total pagado en comisiones"
  },
]

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard")
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Error al cargar datos")
      }
      return result.data as DashboardData
    },
  })

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-sm text-gray-500">Cargando...</div>
      </MainLayout>
    )
  }

  if (isError || !data) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <div className="text-xs text-gray-400 mt-1">{kpi.subtitle}</div>
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

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inversión por Proveedor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Inversión por Proveedor</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.proveedores.inversionPorProveedor}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `RD$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Inversión"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="inversion" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gastos por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Gastos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.gastos.gastosPorTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.gastos.gastosPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Inventario y Pagos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inventario por Bodega */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Inventario por Bodega</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.inventario.inventarioPorBodega}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), "Unidades"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pagos por Método */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Pagos por Método</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.financiero.pagosPorMetodo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.financiero.pagosPorMetodo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Productos y Categorías */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Productos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Top 5 Productos (por unidades)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.inventario.topProductos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="sku"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), "Unidades"]}
                    contentStyle={{ fontSize: 12 }}
                    labelFormatter={(label) => {
                      const producto = data.inventario.topProductos.find(p => p.sku === label)
                      return producto ? `${producto.sku} - ${producto.nombre}` : label
                    }}
                  />
                  <Bar dataKey="unidades" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Compras por Categoría */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Inversión por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.inventario.comprasPorCategoria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `RD$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Inversión"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="inversion" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
