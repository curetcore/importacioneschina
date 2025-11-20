"use client"

export const dynamic = "force-dynamic"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import dynamicImport from "next/dynamic"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { StatsGrid } from "@/components/ui/stats-grid"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Lazy load heavy form component
const InventarioRecibidoForm = dynamicImport(
  () =>
    import("@/components/forms/InventarioRecibidoForm").then(mod => ({
      default: mod.InventarioRecibidoForm,
    })),
  {
    loading: () => (
      <div className="text-center py-4 text-sm text-gray-500">Cargando formulario...</div>
    ),
  }
)
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { VirtualizedDataTable } from "@/components/ui/virtualized-data-table"
import { TableSkeleton, StatCardSkeleton } from "@/components/ui/skeleton"
import { getInventarioColumns, InventarioRecibido } from "./columns"
import { columns as analisisColumns, ProductoCosto } from "../analisis-costos/columns"
import { getProductosColumns, ProductoRow } from "../productos/columns"
import { TallasModal } from "@/components/productos/TallasModal"
import { useToast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel, exportToPDF } from "@/lib/export-utils"
import {
  Plus,
  PackageCheck,
  Inbox,
  Package,
  DollarSign,
  Warehouse,
  Download,
  Search,
  Settings2,
  FileSpreadsheet,
  FileText,
  Calculator,
  TrendingUp,
  Tag,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

function InventarioRecibidoPageContent() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [inventarioToEdit, setInventarioToEdit] = useState<InventarioRecibido | null>(null)
  const [inventarioToDelete, setInventarioToDelete] = useState<InventarioRecibido | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [tallasModalOpen, setTallasModalOpen] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<ProductoRow | null>(null)

  // Fetch all inventarios
  const { data: inventarios = [], isLoading } = useQuery({
    queryKey: ["inventario-recibido"],
    queryFn: async () => {
      const response = await fetch("/api/inventario-recibido")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al cargar inventarios")
      }

      return result.data as InventarioRecibido[]
    },
  })

  // Query params detection for edit/delete
  useEffect(() => {
    if (!inventarios.length) return

    const editId = searchParams.get("edit")
    const deleteId = searchParams.get("delete")

    if (editId) {
      const inventarioToEdit = inventarios.find((inv: InventarioRecibido) => inv.id === editId)
      if (inventarioToEdit) {
        setInventarioToEdit(inventarioToEdit)
        setFormOpen(true)
        router.replace("/inventario-recibido", { scroll: false })
      }
    } else if (deleteId) {
      const inventarioToDelete = inventarios.find((inv: InventarioRecibido) => inv.id === deleteId)
      if (inventarioToDelete) {
        setInventarioToDelete(inventarioToDelete)
        router.replace("/inventario-recibido", { scroll: false })
      }
    }
  }, [searchParams, inventarios, router])

  // Fetch análisis de costos
  const { data: analisisResponse, isLoading: analisisLoading } = useQuery({
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

  const productos = (analisisResponse?.data || []) as ProductoCosto[]
  const totales = analisisResponse?.totales || {
    totalProductos: 0,
    totalUnidades: 0,
    inversionTotal: 0,
    costoPromedioUnitario: 0,
  }

  // Fetch productos con pricing
  const { data: productosResponse, isLoading: productosLoading } = useQuery({
    queryKey: ["productos"],
    queryFn: async () => {
      const res = await fetch("/api/productos")
      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || "Error al cargar productos")
      }

      return result
    },
  })

  const productosData = (productosResponse?.data || []) as ProductoRow[]

  const handleEdit = (inventario: InventarioRecibido) => {
    setInventarioToEdit(inventario)
    setFormOpen(true)
  }

  const handleView = (inventario: InventarioRecibido) => {
    router.push(`/inventario-recibido/${inventario.id}`)
  }

  const handleDelete = async () => {
    if (!inventarioToDelete) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/inventario-recibido/${inventarioToDelete.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar el inventario")
      }

      addToast({
        type: "success",
        title: "Inventario eliminado",
        description: `Recepción ${inventarioToDelete.idRecepcion} eliminada exitosamente`,
      })

      setInventarioToDelete(null)
      queryClient.invalidateQueries({ queryKey: ["inventario-recibido"] })
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el inventario",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setInventarioToEdit(null)
  }

  const prepareExportData = () => {
    return inventarios.map((inventario: InventarioRecibido) => ({
      "ID Recepción": inventario.idRecepcion,
      OC: inventario.ocChina.oc,
      Proveedor: inventario.ocChina.proveedor,
      "Fecha Llegada": new Date(inventario.fechaLlegada).toLocaleDateString(),
      Bodega: inventario.bodegaInicial,
      "Cantidad Recibida": inventario.cantidadRecibida,
      SKU: inventario.item?.sku || "",
      Producto: inventario.item?.nombre || "",
      "Costo Unitario RD$":
        inventario.costoUnitarioFinalRD !== null
          ? parseFloat(inventario.costoUnitarioFinalRD.toString())
          : 0,
      "Costo Total RD$":
        inventario.costoTotalRecepcionRD !== null
          ? parseFloat(inventario.costoTotalRecepcionRD.toString())
          : 0,
    }))
  }

  const handleExportExcel = () => {
    if (inventarios.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay recepciones para exportar",
      })
      return
    }

    const dataToExport = prepareExportData()
    exportToExcel(dataToExport, "inventario_recibido", "Inventario Recibido")
    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${inventarios.length} recepciones exportadas a Excel`,
    })
  }

  const handleExportPDF = () => {
    if (inventarios.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay recepciones para exportar",
      })
      return
    }

    const dataToExport = prepareExportData()
    exportToPDF(
      dataToExport,
      "inventario_recibido",
      "Inventario Recibido - Sistema de Importaciones"
    )
    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${inventarios.length} recepciones exportadas a PDF`,
    })
  }

  const handleExportAnalisis = () => {
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

  const handlePrecioVentaChange = async (sku: string, precioVenta: number | null) => {
    try {
      const response = await fetch(`/api/productos/${encodeURIComponent(sku)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ precioVenta }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar precio")
      }

      addToast({
        type: "success",
        title: "Precio actualizado",
        description: `Precio de venta actualizado para ${sku}`,
      })

      queryClient.invalidateQueries({ queryKey: ["productos"] })
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar precio de venta",
      })
      throw error
    }
  }

  const handleTallasClick = (producto: ProductoRow) => {
    setSelectedProducto(producto)
    setTallasModalOpen(true)
  }

  const handleExportProductos = () => {
    if (productosData.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay productos para exportar",
      })
      return
    }

    const dataToExport = productosData.map(producto => ({
      SKU: producto.sku,
      Producto: producto.nombre,
      "Cantidad Total": producto.cantidadTotal,
      "Número de Tallas": producto.numeroTallas,
      "Precio Compra": producto.costoPromedioCompra,
      "Costo Total": producto.costoTotalCompra,
      "Precio Venta": producto.precioVenta || "",
      "Ganancia por Unidad": producto.gananciaPorUnidad || "",
      "Ganancia %": producto.gananciaPorcentaje ? `${producto.gananciaPorcentaje.toFixed(1)}%` : "",
      "Ganancia Total Estimada": producto.gananciaTotalEstimada || "",
    }))

    exportToExcel(dataToExport, "productos_pricing", "Catálogo de Productos")
    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${productosData.length} productos exportados a Excel`,
    })
  }

  // Create columns with callbacks
  const columns = useMemo(
    () =>
      getInventarioColumns({
        onView: handleView,
      }),
    []
  )

  const productosColumns = useMemo(
    () =>
      getProductosColumns({
        onPrecioVentaChange: handlePrecioVentaChange,
        onTallasClick: handleTallasClick,
      }),
    []
  )

  // Filtrar inventarios por búsqueda
  const filteredInventarios = useMemo(() => {
    if (!searchQuery.trim()) return inventarios

    const query = searchQuery.toLowerCase()
    return inventarios.filter(
      (inv: InventarioRecibido) =>
        inv.idRecepcion.toLowerCase().includes(query) ||
        inv.ocChina.oc.toLowerCase().includes(query) ||
        inv.ocChina.proveedor.toLowerCase().includes(query) ||
        inv.bodegaInicial.toLowerCase().includes(query) ||
        (inv.item?.sku && inv.item.sku.toLowerCase().includes(query)) ||
        (inv.item?.nombre && inv.item.nombre.toLowerCase().includes(query))
    )
  }, [inventarios, searchQuery])

  // Calcular KPIs en tiempo real desde los datos filtrados
  const stats = useMemo(() => {
    const totalRecepciones = inventarios.length

    const totalUnidades = inventarios.reduce(
      (sum: number, inv: InventarioRecibido) => sum + inv.cantidadRecibida,
      0
    )

    const totalCostoRD = inventarios.reduce((sum: number, inv: InventarioRecibido) => {
      return sum + parseFloat((inv.costoTotalRecepcionRD || 0).toString())
    }, 0)

    // Calcular bodega con más recepciones
    const bodegaCounts = inventarios.reduce(
      (acc: Record<string, number>, inv: InventarioRecibido) => {
        acc[inv.bodegaInicial] = (acc[inv.bodegaInicial] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const bodegaMasUsada = (Object.entries(bodegaCounts) as [string, number][]).sort(
      (a, b) => b[1] - a[1]
    )[0]
    const bodegaMasUsadaNombre = bodegaMasUsada?.[0] || "N/A"
    const bodegaMasUsadaCantidad = bodegaMasUsada?.[1] || 0

    return {
      totalRecepciones,
      totalUnidades,
      totalCostoRD,
      bodegaMasUsadaNombre,
      bodegaMasUsadaCantidad,
    }
  }, [inventarios])

  if (isLoading || analisisLoading || productosLoading) {
    return (
      <MainLayout>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
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
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Tabs defaultValue="inventario" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventario" className="gap-2">
              <Inbox className="w-4 h-4" />
              Inventario Recibido
            </TabsTrigger>
            <TabsTrigger value="costos" className="gap-2">
              <Calculator className="w-4 h-4" />
              Análisis de Costos
            </TabsTrigger>
            <TabsTrigger value="productos" className="gap-2">
              <Tag className="w-4 h-4" />
              Productos
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Inventario Recibido */}
          <TabsContent value="inventario" className="space-y-6 mt-0">
            {/* KPIs Section */}
            <StatsGrid cols={4}>
              <StatCard
                icon={<Inbox className="w-4 h-4" />}
                label="Total Recepciones"
                value={stats.totalRecepciones}
                subtitle="Registradas"
              />

              <StatCard
                icon={<Package className="w-4 h-4" />}
                label="Total Unidades"
                value={stats.totalUnidades.toLocaleString()}
                subtitle={`En ${stats.totalRecepciones} recepción${stats.totalRecepciones !== 1 ? "es" : ""}`}
              />

              <StatCard
                icon={<DollarSign className="w-4 h-4" />}
                label="Costo Total RD$"
                value={formatCurrency(stats.totalCostoRD)}
                subtitle={`Promedio: ${formatCurrency(stats.totalRecepciones > 0 ? stats.totalCostoRD / stats.totalRecepciones : 0)}`}
              />

              <StatCard
                icon={<Warehouse className="w-4 h-4" />}
                label="Bodega Principal"
                value={stats.bodegaMasUsadaCantidad}
                subtitle={stats.bodegaMasUsadaNombre}
              />
            </StatsGrid>

            <Card>
              <CardHeader className="space-y-0 pb-4">
                {/* Layout: Título | Buscador | Botones */}
                <div className="flex items-center justify-between gap-4">
                  {/* Título a la izquierda */}
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Inbox size={18} />
                    Inventario ({filteredInventarios.length}
                    {searchQuery ? ` de ${inventarios.length}` : ""})
                  </CardTitle>

                  {/* Buscador centrado */}
                  <div className="flex-1 max-w-md mx-auto">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar ID, OC, SKU, producto..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 w-full text-xs"
                      />
                    </div>
                  </div>

                  {/* Botones a la derecha (más compactos) */}
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-8 px-2 text-xs">
                          <Settings2 className="mr-1.5 h-4 w-4" />
                          Columnas
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        {columns
                          .filter(
                            column =>
                              "accessorKey" in column && typeof column.accessorKey === "string"
                          )
                          .map(column => {
                            const id = (column as any).accessorKey as string
                            return (
                              <DropdownMenuCheckboxItem
                                key={id}
                                className="capitalize"
                                checked={columnVisibility[id] !== false}
                                onCheckedChange={value =>
                                  setColumnVisibility(prev => ({
                                    ...prev,
                                    [id]: value,
                                  }))
                                }
                              >
                                {id}
                              </DropdownMenuCheckboxItem>
                            )
                          })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="gap-1.5 h-8 px-2 text-xs"
                          disabled={inventarios.length === 0}
                        >
                          <Download size={14} />
                          Exportar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
                          <FileSpreadsheet size={16} />
                          Exportar a Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                          <FileText size={16} />
                          Exportar a PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={() => setFormOpen(true)} className="gap-1.5 h-8 px-2 text-xs">
                      <Plus size={14} />
                      Crear Recepción
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {inventarios.length === 0 ? (
                  <div className="text-center py-12">
                    <PackageCheck size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay recepciones registradas
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Comienza registrando tu primera recepción de mercancía
                    </p>
                    <Button onClick={() => setFormOpen(true)} className="gap-2">
                      <Plus size={18} />
                      Nueva Recepción
                    </Button>
                  </div>
                ) : filteredInventarios.length === 0 ? (
                  <div className="text-center py-12">
                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No se encontraron resultados
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      No hay recepciones que coincidan con "{searchQuery}"
                    </p>
                    <Button onClick={() => setSearchQuery("")} variant="outline">
                      Limpiar búsqueda
                    </Button>
                  </div>
                ) : (
                  <VirtualizedDataTable
                    columns={columns}
                    data={filteredInventarios}
                    showToolbar={false}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    onRowClick={handleView}
                    maxHeight="70vh"
                    estimatedRowHeight={53}
                    overscan={10}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Análisis de Costos */}
          <TabsContent value="costos" className="space-y-6 mt-0">
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
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Calculator size={18} />
                  Desglose de Costos ({productos.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleExportAnalisis}
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
                      columns={analisisColumns}
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
          </TabsContent>

          {/* Tab 3: Productos */}
          <TabsContent value="productos" className="space-y-6 mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Tag size={18} />
                  Catálogo de Productos ({productosData.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleExportProductos}
                    variant="outline"
                    className="gap-1.5 h-8 px-3 text-xs"
                    disabled={productosData.length === 0}
                  >
                    <Download size={14} />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {productosData.length === 0 ? (
                  <div className="text-center py-12">
                    <Tag size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay productos en catálogo
                    </h3>
                    <p className="text-sm text-gray-500">
                      Los productos aparecerán automáticamente cuando recibas inventario
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-blue-900">
                            💰 Gestión de Precios y Márgenes
                          </h3>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-blue-700">
                            <div>
                              <strong>Precio Compra:</strong> Costo unitario promedio ponderado
                            </div>
                            <div>
                              <strong>Precio Venta:</strong> Haz clic para editar (✏️)
                            </div>
                            <div>
                              <strong>Ganancia:</strong> Calculada automáticamente al asignar precio
                            </div>
                            <div>
                              <strong>Tallas:</strong> Haz clic para ver distribución detallada
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <VirtualizedDataTable
                      columns={productosColumns}
                      data={productosData}
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
          </TabsContent>
        </Tabs>
      </div>

      <InventarioRecibidoForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["inventario-recibido"] })
          handleFormClose()
        }}
        inventarioToEdit={inventarioToEdit}
      />

      <ConfirmDialog
        open={!!inventarioToDelete}
        onOpenChange={open => !open && setInventarioToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Recepción"
        description={`¿Estás seguro de eliminar la recepción ${inventarioToDelete?.idRecepcion}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteLoading}
      />

      <TallasModal
        open={tallasModalOpen}
        onOpenChange={setTallasModalOpen}
        producto={selectedProducto}
      />
    </MainLayout>
  )
}

export default function InventarioRecibidoPage() {
  return (
    <Suspense
      fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}
    >
      <InventarioRecibidoPageContent />
    </Suspense>
  )
}
