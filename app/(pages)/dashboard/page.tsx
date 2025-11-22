"use client"

import { useQuery } from "@tanstack/react-query"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { CHART_COLORS } from "@/lib/chart-colors"
import { BarChart, Bar } from "recharts"
import { PieChart, Pie, Cell } from "recharts"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { AuditLogViewer } from "@/components/audit/AuditLogViewer"

export const dynamic = "force-dynamic"

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
    // Nuevas métricas
    totalFOB: number
    totalPagado: number
    totalGastosLogisticos: number
    balancePendiente: number
    porcentajePagado: number
    gastosComoPercent: number
    comisionesComoPercent: number
    costoRealUnitario: number
    unidadesPendientes: number
    porcentajeRecepcion: number
    valorInventarioBodega: number
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
  // Nuevas secciones
  distribucion: {
    distribucionCostos: Array<{ name: string; value: number; porcentaje: number }>
    balancePorOC: Array<{ name: string; balance: number; pagado: number; total: number }>
  }
  alertas: {
    ocsConBalancePendiente: Array<{
      oc: string
      proveedor: string
      fobTotal: number
      pagado: number
      balance: number
      porcentajeBalance: number
    }>
    ocsSinRecepcion: Array<{
      oc: string
      proveedor: string
      unidadesOrdenadas: number
      fechaOC: Date
    }>
  }
  topProductosPorValor: Array<{
    sku: string
    nombre: string
    unidades: number
    valorUSD: number
  }>
}

const kpiCards = [
  {
    key: "inversionTotal",
    label: "Inversión Total",
    format: "currency",
    subtitle: "FOB + Logística + Comisiones",
  },
  {
    key: "totalFOB",
    label: "Total FOB",
    format: "currency",
    subtitle: "Costo base de productos",
  },
  {
    key: "totalPagado",
    label: "Total Pagado",
    format: "currency",
    subtitle: "Pagos realizados en RD$",
  },
  {
    key: "balancePendiente",
    label: "Balance Pendiente",
    format: "currency",
    subtitle: "Falta por pagar",
    color: "text-orange-600",
  },
  {
    key: "porcentajePagado",
    label: "% Pago Completado",
    format: "percent",
    subtitle: "Progreso de pagos",
  },
  {
    key: "unidadesOrdenadas",
    label: "Unidades Ordenadas",
    format: "number",
    subtitle: "Total de unidades compradas",
  },
  {
    key: "unidadesRecibidas",
    label: "Unidades Recibidas",
    format: "number",
    subtitle: "Ya en bodega",
  },
  {
    key: "porcentajeRecepcion",
    label: "% Recepción",
    format: "percent",
    subtitle: "Progreso de recepción",
  },
  {
    key: "valorInventarioBodega",
    label: "Valor en Bodega",
    format: "currency",
    subtitle: "Inventario recibido (RD$)",
  },
  {
    key: "costoRealUnitario",
    label: "Costo Real Unitario",
    format: "currency",
    subtitle: "Incluye FOB + Logística + Comisiones",
  },
  {
    key: "totalGastosLogisticos",
    label: "Gastos Logísticos",
    format: "currency",
    subtitle: `${0}% de inversión total`,
    dynamic: true,
  },
  {
    key: "totalComisiones",
    label: "Comisiones Bancarias",
    format: "currency",
    subtitle: `${0}% de total pagado`,
    dynamic: true,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(kpi => {
            const value = data.kpis[kpi.key as keyof typeof data.kpis]
            let displayValue = ""
            if (kpi.format === "currency") {
              displayValue = formatCurrency(Number(value))
            } else if (kpi.format === "percent") {
              displayValue = `${Number(value).toFixed(1)}%`
            } else {
              displayValue = Number(value).toLocaleString()
            }

            // Subtitle dinámico para gastos y comisiones
            let subtitle = kpi.subtitle
            if (kpi.key === "totalGastosLogisticos" && "dynamic" in kpi) {
              subtitle = `${data.kpis.gastosComoPercent.toFixed(1)}% de inversión total`
            } else if (kpi.key === "totalComisiones" && "dynamic" in kpi) {
              subtitle = `${data.kpis.comisionesComoPercent.toFixed(1)}% de total pagado`
            }

            const textColor = ("color" in kpi ? kpi.color : undefined) || "text-gray-900"

            return (
              <Card key={kpi.key}>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-500 mb-1">{kpi.label}</div>
                  <div className={`text-2xl font-semibold ${textColor}`}>{displayValue}</div>
                  <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
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
                    tickFormatter={value => `RD$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Inversión"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="inversion">
                    {data.proveedores.inversionPorProveedor.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
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
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
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
                  <Bar dataKey="value">
                    {data.inventario.inventarioPorBodega.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
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
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
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
              <CardTitle className="text-base font-medium">
                Top 5 Productos (por unidades)
              </CardTitle>
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
                    labelFormatter={label => {
                      const producto = data.inventario.topProductos.find(p => p.sku === label)
                      return producto ? `${producto.sku} - ${producto.nombre}` : label
                    }}
                  />
                  <Bar dataKey="unidades">
                    {data.inventario.topProductos.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
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
                    tickFormatter={value => `RD$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Inversión"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="inversion">
                    {data.inventario.comprasPorCategoria.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Distribución de Costos y Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Distribución de Costos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Distribución de Costos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.distribucion.distribucionCostos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, porcentaje }) => `${name} (${porcentaje.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.distribucion.distribucionCostos.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
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

          {/* Balance Pendiente por OC */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Balance Pendiente por OC (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.distribucion.balancePorOC}>
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
                    tickFormatter={value => `RD$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Balance"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="balance" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {(data.alertas.ocsConBalancePendiente.length > 0 ||
          data.alertas.ocsSinRecepcion.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-red-600">
                Alertas y Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* OCs con Balance Pendiente > 50% */}
                {data.alertas.ocsConBalancePendiente.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      OCs con Balance Pendiente Alto (&gt;50%)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-red-50 border-b-2 border-red-100">
                          <tr>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">OC</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">
                              Proveedor
                            </th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-700">
                              Total
                            </th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-700">
                              Pagado
                            </th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-700">
                              Pendiente
                            </th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-700">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.alertas.ocsConBalancePendiente.map(oc => (
                            <tr key={oc.oc} className="border-b border-gray-200">
                              <td className="py-2 px-3 font-medium text-gray-900">{oc.oc}</td>
                              <td className="py-2 px-3 text-gray-600">{oc.proveedor}</td>
                              <td className="py-2 px-3 text-right text-gray-900">
                                {formatCurrency(oc.fobTotal)}
                              </td>
                              <td className="py-2 px-3 text-right text-green-600">
                                {formatCurrency(oc.pagado)}
                              </td>
                              <td className="py-2 px-3 text-right text-orange-600 font-semibold">
                                {formatCurrency(oc.balance)}
                              </td>
                              <td className="py-2 px-3 text-right text-red-600 font-semibold">
                                {oc.porcentajeBalance.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* OCs sin Recepción */}
                {data.alertas.ocsSinRecepcion.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      OCs sin Recepción de Inventario
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-amber-50 border-b-2 border-amber-100">
                          <tr>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">OC</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">
                              Proveedor
                            </th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-700">
                              Unidades Ordenadas
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.alertas.ocsSinRecepcion.map(oc => (
                            <tr key={oc.oc} className="border-b border-gray-200">
                              <td className="py-2 px-3 font-medium text-gray-900">{oc.oc}</td>
                              <td className="py-2 px-3 text-gray-600">{oc.proveedor}</td>
                              <td className="py-2 px-3 text-right text-gray-900">
                                {oc.unidadesOrdenadas.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actividad Reciente - Audit Log */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
          <AuditLogViewer limit={10} showFilters={false} />
        </div>
      </div>
    </MainLayout>
  )
}
