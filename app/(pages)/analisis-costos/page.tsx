"use client"

export const dynamic = "force-dynamic"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { StatsGrid } from "@/components/ui/stats-grid"
import { VirtualizedDataTable } from "@/components/ui/virtualized-data-table"
import { TableSkeleton, StatCardSkeleton } from "@/components/ui/skeleton"
import { columns, ProductoCosto } from "./columns"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"
import { useToast } from "@/components/ui/toast"
import { Calculator, Package, DollarSign, TrendingUp, Download } from "lucide-react"

// Helper function to get distribution method labels
const getMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    peso: "Por Peso",
    volumen: "Por Volumen",
    valor_fob: "Por Valor FOB",
    unidades: "Por Unidades",
  }
  return labels[method] || method
}

export default function AnalisisCostosPage() {
  const { addToast } = useToast()

  // Fetch análisis de costos
  const { data: response, isLoading } = useQuery({
    queryKey: ["analisis-costos"],
    queryFn: async () => {
      const res = await fetch("/api/analisis-costos")
      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || "Error al cargar análisis")
      }

      return result
    },
  })

  const productos = (response?.data || []) as ProductoCosto[]
  const totales = response?.totales || {
    totalProductos: 0,
    totalUnidades: 0,
    inversionTotal: 0,
    costoPromedioUnitario: 0,
  }

  const handleExport = () => {
    if (productos.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay productos para exportar",
      })
      return
    }

    const dataToExport = productos.map(producto => ({
      SKU: producto.sku,
      Producto: producto.nombre,
      OC: producto.oc,
      Proveedor: producto.proveedor,
      Cantidad: producto.cantidad,
      Bodega: producto.bodega,
      "FOB (USD)": producto.desglose.costoFobUsd,
      "Tasa Cambio": producto.desglose.tasaCambio,
      "FOB (RD$)": producto.desglose.costoFobRD,
      "Pagos (RD$)": producto.desglose.pagos,
      "Gastos Logísticos (RD$)": producto.desglose.gastos,
      "Comisiones (RD$)": producto.desglose.comisiones,
      "Costo Final Unitario (RD$)": producto.costoFinalUnitario,
      "Costo Total Recepción (RD$)": producto.costoTotalRecepcion,
    }))

    exportToExcel(dataToExport, "analisis_costos", "Análisis de Costos")
    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${productos.length} productos exportados a Excel`,
    })
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          {/* Stats skeleton */}
          <StatCardSkeleton count={4} />

          {/* Table skeleton */}
          <Card>
            <CardContent className="p-6">
              <TableSkeleton rows={10} columns={8} />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* KPIs Section */}
        <StatsGrid cols={4}>
          <StatCard
            icon={<Package className="w-4 h-4" />}
            label="Total Productos"
            value={totales.totalProductos}
            subtitle={`${totales.totalUnidades.toLocaleString()} unidades`}
          />

          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Inversión Total"
            value={formatCurrency(totales.inversionTotal)}
            subtitle="En inventario recibido"
          />

          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Costo Promedio/u"
            value={formatCurrency(totales.costoPromedioUnitario)}
            subtitle="Costo unitario promedio"
          />

          <StatCard
            icon={<Calculator className="w-4 h-4" />}
            label="Costo Total/u"
            value={formatCurrency(
              totales.totalUnidades > 0 ? totales.inversionTotal / totales.totalUnidades : 0
            )}
            subtitle="Incluyendo todos los costos"
          />
        </StatsGrid>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Calculator size={18} />
              Desglose de Costos ({productos.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                className="gap-1.5 h-8 px-3 text-xs"
                disabled={productos.length === 0}
              >
                <Download size={14} />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {productos.length === 0 ? (
              <div className="text-center py-12">
                <Calculator size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay productos en inventario
                </h3>
                <p className="text-sm text-gray-500">
                  Los productos aparecerán aquí una vez que recibas inventario
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-blue-900">
                        💡 Leyenda de Columnas y Métodos de Distribución
                      </h3>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-blue-700">
                        <div>
                          <strong>FOB (USD):</strong> Costo del producto en China
                        </div>
                        <div>
                          <strong>FOB (RD$):</strong> Convertido a pesos dominicanos
                        </div>
                        <div className="text-blue-600">
                          <strong>Pagos:</strong> Distribución de pagos a proveedor
                          {productos.length > 0 && productos[0]?.desglose?.metodoPagos && (
                            <span className="ml-1 text-xs bg-blue-100 px-1.5 py-0.5 rounded">
                              {getMethodLabel(productos[0].desglose.metodoPagos)}
                            </span>
                          )}
                        </div>
                        <div className="text-orange-600">
                          <strong>Gastos:</strong> Flete, aduana, transporte
                          {productos.length > 0 && productos[0]?.desglose?.metodoGastos && (
                            <span className="ml-1 text-xs bg-orange-100 px-1.5 py-0.5 rounded">
                              {getMethodLabel(productos[0].desglose.metodoGastos)}
                            </span>
                          )}
                        </div>
                        <div className="text-purple-600">
                          <strong>Comisiones:</strong> Comisiones bancarias
                          {productos.length > 0 && productos[0]?.desglose?.metodoComisiones && (
                            <span className="ml-1 text-xs bg-purple-100 px-1.5 py-0.5 rounded">
                              {getMethodLabel(productos[0].desglose.metodoComisiones)}
                            </span>
                          )}
                        </div>
                        <div>
                          <strong>Costo Final:</strong> Suma de todos los costos
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs text-blue-600">
                          <strong>Métodos de distribución:</strong> Los costos se distribuyen
                          profesionalmente según peso, volumen, o valor FOB del producto.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <VirtualizedDataTable
                  columns={columns}
                  data={productos}
                  searchKey="sku"
                  searchPlaceholder="Buscar por SKU o producto..."
                  maxHeight="70vh"
                  estimatedRowHeight={53}
                  overscan={10}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
