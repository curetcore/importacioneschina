"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  TrendingUp,
  Package,
  CheckCircle2,
  DollarSign,
  Activity,
  AlertCircle,
  CreditCard,
  FileText,
  Warehouse,
  Users,
  BarChart3,
  TrendingDown,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

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
    pagosPorMoneda: Array<{
      moneda: string
      totalOriginal: number
      totalRD: number
      cantidad: number
    }>
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
    topOCs: Array<{
      oc: string
      proveedor: string
      inversion: number
      unidades: number
      costoUnitario: number
    }>
    transacciones: Array<{
      tipo: "Pago" | "Gasto"
      id: string
      oc: string
      fecha: Date
      monto: number
      descripcion: string
    }>
  }
}

// Colores para gráficos - Shopify inspired
const CHART_COLORS = [
  "#1A1A1A", // Negro principal
  "#4A5568", // Gris oscuro
  "#718096", // Gris medio
  "#A0AEC0", // Gris claro
  "#2D3748", // Gris muy oscuro
  "#4299E1", // Azul
  "#48BB78", // Verde
  "#ED8936", // Naranja
]

export default function PanelPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || "Error desconocido al cargar datos")
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || "Error de conexión al cargar datos")
        setLoading(false)
      })
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
          <div className="text-center max-w-md">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-2">Error al cargar datos</p>
            {error && (
              <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                {error}
              </p>
            )}
          </div>
        </div>
      </MainLayout>
    )
  }

  const totalPagos = data.financiero.pagosPorMoneda.reduce((sum, m) => sum + Number(m.totalRD), 0)
  const totalGastos = data.gastos.gastosPorTipo.reduce((sum, g) => sum + Number(g.value), 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 1. KPIs PRINCIPALES */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            KPIs Principales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Inversión Total
                </p>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.kpis.inversionTotal)}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Unidades Ordenadas
                </p>
                <Package className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">
                {data.kpis.unidadesOrdenadas.toLocaleString()}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Unidades Recibidas
                </p>
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">
                {data.kpis.unidadesRecibidas.toLocaleString()}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Comisiones Bancarias
                </p>
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.kpis.totalComisiones)}
              </p>
            </div>
          </div>
        </div>

        {/* 2. ANÁLISIS FINANCIERO */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Análisis Financiero
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pagos por Método */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Pagos por Método</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.financiero.pagosPorMetodo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.financiero.pagosPorMetodo.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {data.financiero.pagosPorMetodo.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagos por Tipo */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Pagos por Tipo</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.financiero.pagosPorTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.financiero.pagosPorTipo.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {data.financiero.pagosPorTipo.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagos por Moneda */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Pagos por Moneda</h3>
              </div>
              <div className="space-y-3">
                {data.financiero.pagosPorMoneda.map((item, index) => {
                  const percentage = totalPagos > 0 ? (Number(item.totalRD) / totalPagos) * 100 : 0
                  return (
                    <div
                      key={index}
                      className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-900">{item.moneda}</span>
                        <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatCurrency(item.totalOriginal, item.moneda)} →{" "}
                        {formatCurrency(item.totalRD)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{item.cantidad} pagos</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tasas de Cambio */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Tasas de Cambio Promedio</h3>
              </div>
              <div className="space-y-3">
                {data.financiero.tasasPromedio.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-100 rounded-md bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{item.moneda} → RD$</span>
                      <span className="text-xl font-semibold text-gray-900">
                        {item.tasa.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. GASTOS LOGÍSTICOS */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Gastos Logísticos
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gastos por Tipo */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Gastos por Tipo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.gastos.gastosPorTipo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                  />
                  <Bar dataKey="value" fill="#1A1A1A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Proveedores de Servicios */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Top Proveedores de Servicios
              </h3>
              <div className="space-y-2">
                {data.gastos.gastosPorProveedor.length > 0 ? (
                  data.gastos.gastosPorProveedor.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-600">{index + 1}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-900">
                          {formatCurrency(item.value)}
                        </div>
                        <div className="text-xs text-gray-400">{item.cantidad} gastos</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No hay proveedores registrados
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. INVENTARIO & OPERACIONES */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Inventario & Operaciones
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Inventario por Bodega */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Warehouse className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Inventario por Bodega</h3>
              </div>
              {data.inventario.inventarioPorBodega.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.inventario.inventarioPorBodega}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: any) => `${Number(value).toLocaleString()} unidades`}
                      contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                    />
                    <Bar dataKey="value" fill="#4A5568" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-xs text-gray-400">
                  No hay inventario recibido
                </div>
              )}
            </div>

            {/* Estado de OCs */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Estado de OCs</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase">Activas</span>
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">{data.kpis.ocsActivas}</p>
                  <p className="text-xs text-gray-500 mt-1">En proceso de recepción</p>
                </div>

                <div className="p-4 border border-gray-200 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase">Completadas</span>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">{data.kpis.ocsCompletadas}</p>
                  <p className="text-xs text-gray-500 mt-1">Recepción finalizada</p>
                </div>

                <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">% de Cumplimiento</span>
                    <span className="text-xl font-semibold text-gray-900">
                      {data.kpis.unidadesOrdenadas > 0
                        ? (
                            (data.kpis.unidadesRecibidas / data.kpis.unidadesOrdenadas) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top 5 Productos */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Top 5 Productos</h3>
              </div>
              <div className="space-y-2">
                {data.inventario.topProductos.length > 0 ? (
                  data.inventario.topProductos.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-600">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {item.sku}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{item.nombre}</div>
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="text-xs font-semibold text-gray-900">
                          {item.unidades.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatCurrency(item.valorUSD, "USD")}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No hay productos registrados
                  </div>
                )}
              </div>
            </div>

            {/* Compras por Categoría */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Compras por Categoría</h3>
              <div className="space-y-3">
                {data.inventario.comprasPorCategoria.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-900">{item.name}</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {formatCurrency(item.inversion)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.unidades.toLocaleString()} unidades
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5. PROVEEDORES */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Proveedores
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Inversión por Proveedor</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.proveedores.inversionPorProveedor} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                />
                <Bar dataKey="inversion" fill="#2D3748" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. TOP RANKINGS */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Top Rankings
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top 5 OCs */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Top 5 OCs más Costosas</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">
                        #
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">
                        OC
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">
                        Proveedor
                      </th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 uppercase">
                        Inversión
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tablas.topOCs.map((oc, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-2 text-xs text-gray-500">{index + 1}</td>
                        <td className="py-2 px-2 text-xs font-medium text-gray-900">{oc.oc}</td>
                        <td className="py-2 px-2 text-xs text-gray-700">{oc.proveedor}</td>
                        <td className="py-2 px-2 text-xs text-right font-semibold text-gray-900">
                          {formatCurrency(oc.inversion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transacciones Recientes */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Últimas 10 Transacciones</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {data.tablas.transacciones.map((trans, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${trans.tipo === "Pago" ? "bg-green-500" : "bg-orange-500"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-gray-900">{trans.id}</div>
                        <div className="text-xs text-gray-500 truncate">{trans.descripcion}</div>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <div className="text-xs font-semibold text-gray-900">
                        {formatCurrency(trans.monto)}
                      </div>
                      <div className="text-xs text-gray-400">{formatDate(trans.fecha)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
