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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { VirtualizedDataTable } from "@/components/ui/virtualized-data-table"
import { TableSkeleton, StatCardSkeleton } from "@/components/ui/skeleton"
import { getGastosColumns, GastoLogistico } from "./columns"
import { useToast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel, exportToPDF } from "@/lib/export-utils"

// Lazy load heavy components
const GastosLogisticosForm = dynamicImport(
  () =>
    import("@/components/forms/GastosLogisticosForm").then(mod => ({
      default: mod.GastosLogisticosForm,
    })),
  {
    loading: () => (
      <div className="text-center py-4 text-sm text-gray-500">Cargando formulario...</div>
    ),
  }
)
const AddAttachmentsDialog = dynamicImport(
  () =>
    import("@/components/ui/add-attachments-dialog").then(mod => ({
      default: mod.AddAttachmentsDialog,
    })),
  {
    loading: () => <div className="text-center py-4 text-sm text-gray-500">Cargando...</div>,
  }
)
import {
  Plus,
  Truck,
  DollarSign,
  TrendingUp,
  Package,
  Download,
  FileText,
  Search,
  Settings2,
  FileSpreadsheet,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function GastosLogisticosPageContent() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [gastoToEdit, setGastoToEdit] = useState<GastoLogistico | null>(null)
  const [gastoToDelete, setGastoToDelete] = useState<GastoLogistico | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false)
  const [selectedGastoForAttachments, setSelectedGastoForAttachments] =
    useState<GastoLogistico | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

  // Fetch all gastos
  const { data: gastos = [], isLoading } = useQuery({
    queryKey: ["gastos-logisticos"],
    queryFn: async () => {
      const response = await fetch("/api/gastos-logisticos")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al cargar gastos")
      }

      return result.data as GastoLogistico[]
    },
  })

  // Query params detection for edit/delete
  useEffect(() => {
    if (!gastos.length) return

    const editId = searchParams.get("edit")
    const deleteId = searchParams.get("delete")

    if (editId) {
      const gastoToEdit = gastos.find((gasto: GastoLogistico) => gasto.id === editId)
      if (gastoToEdit) {
        setGastoToEdit(gastoToEdit)
        setFormOpen(true)
        router.replace("/gastos-logisticos", { scroll: false })
      }
    } else if (deleteId) {
      const gastoToDelete = gastos.find((gasto: GastoLogistico) => gasto.id === deleteId)
      if (gastoToDelete) {
        setGastoToDelete(gastoToDelete)
        router.replace("/gastos-logisticos", { scroll: false })
      }
    }
  }, [searchParams, gastos, router])

  const handleEdit = (gasto: GastoLogistico) => {
    setGastoToEdit(gasto)
    setFormOpen(true)
  }

  const handleView = (gasto: GastoLogistico) => {
    router.push(`/gastos-logisticos/${gasto.id}`)
  }

  const handleAddAttachments = (gasto: GastoLogistico) => {
    setSelectedGastoForAttachments(gasto)
    setAttachmentsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!gastoToDelete) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/gastos-logisticos/${gastoToDelete.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar el gasto")
      }

      addToast({
        type: "success",
        title: "Gasto eliminado",
        description: `Gasto ${gastoToDelete.idGasto} eliminado exitosamente`,
      })

      setGastoToDelete(null)
      queryClient.invalidateQueries({ queryKey: ["gastos-logisticos"] })
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el gasto",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setGastoToEdit(null)
  }

  const prepareExportData = () => {
    return gastos.map((gasto: GastoLogistico) => {
      const ocs = gasto.ordenesCompra?.map(o => o.ocChina.oc).join(", ") || ""
      const proveedores = gasto.ordenesCompra?.map(o => o.ocChina.proveedor).join(", ") || ""

      return {
        "ID Gasto": gasto.idGasto,
        OCs: ocs,
        Proveedores: proveedores,
        Fecha: new Date(gasto.fechaGasto).toLocaleDateString(),
        "Tipo de Gasto": gasto.tipoGasto,
        "Proveedor Servicio": gasto.proveedorServicio || "",
        "Monto RD$": parseFloat(gasto.montoRD.toString()),
      }
    })
  }

  const handleExportExcel = () => {
    if (gastos.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay gastos para exportar",
      })
      return
    }

    const dataToExport = prepareExportData()
    exportToExcel(dataToExport, "gastos_logisticos", "Gastos Logísticos")
    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${gastos.length} gastos exportados a Excel`,
    })
  }

  const handleExportPDF = () => {
    if (gastos.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay gastos para exportar",
      })
      return
    }

    const dataToExport = prepareExportData()
    exportToPDF(dataToExport, "gastos_logisticos", "Gastos Logísticos - Sistema de Importaciones")
    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${gastos.length} gastos exportados a PDF`,
    })
  }

  // Create columns with callbacks
  const columns = useMemo(
    () =>
      getGastosColumns({
        onView: handleView,
      }),
    []
  )

  // Filtrar gastos por búsqueda
  const filteredGastos = useMemo(() => {
    if (!searchQuery.trim()) return gastos

    const query = searchQuery.toLowerCase()
    return gastos.filter((gasto: GastoLogistico) => {
      // Search in basic fields
      if (
        gasto.idGasto.toLowerCase().includes(query) ||
        gasto.tipoGasto.toLowerCase().includes(query) ||
        (gasto.proveedorServicio && gasto.proveedorServicio.toLowerCase().includes(query))
      ) {
        return true
      }

      // Search in all OCs and providers
      return gasto.ordenesCompra?.some(
        orden =>
          orden.ocChina.oc.toLowerCase().includes(query) ||
          orden.ocChina.proveedor.toLowerCase().includes(query)
      )
    })
  }, [gastos, searchQuery])

  // Calcular KPIs en tiempo real desde los datos filtrados
  const stats = useMemo(() => {
    const totalGastos = gastos.length

    const totalRD = gastos.reduce(
      (sum: number, gasto: GastoLogistico) => sum + parseFloat(gasto.montoRD.toString()),
      0
    )

    const promedioGasto = totalGastos > 0 ? totalRD / totalGastos : 0

    // Calcular el tipo de gasto más frecuente
    const tiposCounts = gastos.reduce(
      (acc: Record<string, number>, gasto: GastoLogistico) => {
        acc[gasto.tipoGasto] = (acc[gasto.tipoGasto] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const tipoMasComun = (Object.entries(tiposCounts) as [string, number][]).sort(
      (a, b) => b[1] - a[1]
    )[0]
    const tipoMasComunNombre = tipoMasComun?.[0] || "N/A"
    const tipoMasComunCantidad = tipoMasComun?.[1] || 0

    return { totalGastos, totalRD, promedioGasto, tipoMasComunNombre, tipoMasComunCantidad }
  }, [gastos])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          {/* Stats skeleton */}
          <StatCardSkeleton count={4} />

          {/* Table skeleton */}
          <Card>
            <CardContent className="p-6">
              <TableSkeleton rows={10} columns={7} />
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
            icon={<FileText className="w-4 h-4" />}
            label="Total Gastos"
            value={stats.totalGastos}
            subtitle="Registrados"
          />

          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Total RD$"
            value={formatCurrency(stats.totalRD)}
            subtitle={`Promedio: ${formatCurrency(stats.promedioGasto)}`}
          />

          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Promedio por Gasto"
            value={formatCurrency(stats.promedioGasto)}
            subtitle={stats.totalGastos > 0 ? `En ${stats.totalGastos} gastos` : "Sin datos"}
          />

          <StatCard
            icon={<Package className="w-4 h-4" />}
            label="Tipo Más Común"
            value={stats.tipoMasComunCantidad}
            subtitle={stats.tipoMasComunNombre}
          />
        </StatsGrid>

        <Card>
          <CardHeader className="space-y-0 pb-4">
            {/* Layout: Título | Buscador | Botones */}
            <div className="flex items-center justify-between gap-4">
              {/* Título a la izquierda */}
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FileText size={18} />
                Gastos ({filteredGastos.length}
                {searchQuery ? ` de ${gastos.length}` : ""})
              </CardTitle>

              {/* Buscador centrado */}
              <div className="flex-1 max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar ID, OC, proveedor..."
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
                        column => "accessorKey" in column && typeof column.accessorKey === "string"
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
                      disabled={gastos.length === 0}
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
                  Crear Gasto
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {gastos.length === 0 ? (
              <div className="text-center py-12">
                <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay gastos logísticos registrados
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Comienza registrando tu primer gasto logístico
                </p>
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Nuevo Gasto
                </Button>
              </div>
            ) : filteredGastos.length === 0 ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  No hay gastos que coincidan con "{searchQuery}"
                </p>
                <Button onClick={() => setSearchQuery("")} variant="outline">
                  Limpiar búsqueda
                </Button>
              </div>
            ) : (
              <VirtualizedDataTable
                columns={columns}
                data={filteredGastos}
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

        <GastosLogisticosForm
          open={formOpen}
          onOpenChange={handleFormClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["gastos-logisticos"] })
            handleFormClose()
          }}
          gastoToEdit={gastoToEdit}
        />

        <ConfirmDialog
          open={!!gastoToDelete}
          onOpenChange={open => !open && setGastoToDelete(null)}
          onConfirm={handleDelete}
          title="Eliminar Gasto"
          description={`¿Estás seguro de eliminar el gasto ${gastoToDelete?.idGasto}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          loading={deleteLoading}
        />

        {selectedGastoForAttachments && (
          <AddAttachmentsDialog
            open={attachmentsDialogOpen}
            onOpenChange={setAttachmentsDialogOpen}
            module="gastos-logisticos"
            recordId={selectedGastoForAttachments.id}
            recordName={`Gasto ${selectedGastoForAttachments.idGasto} - ${selectedGastoForAttachments.tipoGasto}`}
            currentAttachments={selectedGastoForAttachments.adjuntos || []}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["gastos-logisticos"] })
              setSelectedGastoForAttachments(null)
            }}
          />
        )}
      </div>
    </MainLayout>
  )
}

export default function GastosLogisticosPage() {
  return (
    <Suspense
      fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}
    >
      <GastosLogisticosPageContent />
    </Suspense>
  )
}
