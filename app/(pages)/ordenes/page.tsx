"use client"

export const dynamic = "force-dynamic"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
import dynamicImport from "next/dynamic"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { StatsGrid } from "@/components/ui/stats-grid"

// Lazy load heavy form component
const OCChinaForm = dynamicImport(
  () => import("@/components/forms/OCChinaForm").then(mod => ({ default: mod.OCChinaForm })),
  {
    loading: () => (
      <div className="text-center py-4 text-sm text-gray-500">Cargando formulario...</div>
    ),
  }
)
import { CascadeDeleteDialog } from "@/components/ui/cascade-delete-dialog"
import { useToast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel, exportToPDF } from "@/lib/export-utils"
import { VirtualizedDataTable } from "@/components/ui/virtualized-data-table"
import { TableSkeleton, StatCardSkeleton } from "@/components/ui/skeleton"
import { getOrdenesColumns, OCChina, OCChinaItem } from "./columns"
import {
  Plus,
  ClipboardList,
  Package,
  DollarSign,
  AlertCircle,
  Download,
  Search,
  Settings2,
  FileSpreadsheet,
  FileText,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function OrdenesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [ocToEdit, setOcToEdit] = useState<OCChina | null>(null)
  const [ocToDelete, setOcToDelete] = useState<OCChina | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

  // Fetch all OCs
  const { data: ocs = [], isLoading } = useQuery({
    queryKey: ["oc-china"],
    queryFn: async () => {
      const response = await fetch("/api/oc-china")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al cargar órdenes")
      }

      return result.data as OCChina[]
    },
  })

  // Detect query params for edit/delete actions
  useEffect(() => {
    if (!ocs.length) return // Wait for data to load

    const editId = searchParams.get("edit")
    const deleteId = searchParams.get("delete")

    if (editId) {
      const ocToEdit = ocs.find((oc: OCChina) => oc.id === editId)
      if (ocToEdit) {
        setOcToEdit(ocToEdit)
        setFormOpen(true)
        // Clear query param
        router.replace("/ordenes", { scroll: false })
      }
    } else if (deleteId) {
      const ocToDelete = ocs.find((oc: OCChina) => oc.id === deleteId)
      if (ocToDelete) {
        setOcToDelete(ocToDelete)
        // Clear query param
        router.replace("/ordenes", { scroll: false })
      }
    }
  }, [searchParams, ocs, router, setOcToEdit, setOcToDelete])

  const handleEdit = (oc: OCChina) => {
    setOcToEdit(oc)
    setFormOpen(true)
  }

  const handleView = (oc: OCChina) => {
    router.push(`/ordenes/${oc.id}`)
  }

  const handleDelete = async () => {
    if (!ocToDelete) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/oc-china/${ocToDelete.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar")
      }

      addToast({
        type: "success",
        title: "OC eliminada",
        description: `La orden ${ocToDelete.oc} ha sido eliminada correctamente`,
      })

      queryClient.invalidateQueries({ queryKey: ["oc-china"] })
      setOcToDelete(null)
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar la orden",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setOcToEdit(null)
    queryClient.invalidateQueries({ queryKey: ["oc-china"] })
  }

  const prepareExportData = () => {
    return ocs.map((oc: OCChina) => ({
      OC: oc.oc,
      Proveedor: oc.proveedor,
      Fecha: new Date(oc.fechaOC).toLocaleDateString(),
      Categoría: oc.categoriaPrincipal,
      Productos: oc.items?.length || 0,
      Unidades:
        oc.items?.reduce((sum: number, item: OCChinaItem) => sum + item.cantidadTotal, 0) || 0,
      "Costo FOB (USD)":
        oc.items?.reduce(
          (sum: number, item: OCChinaItem) => sum + parseFloat(item.subtotalUSD.toString()),
          0
        ) || 0,
    }))
  }

  const handleExportExcel = () => {
    if (ocs.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay órdenes para exportar",
      })
      return
    }

    const dataToExport = prepareExportData()
    exportToExcel(dataToExport, "ordenes", "Órdenes de Compra")

    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${ocs.length} órdenes exportadas a Excel`,
    })
  }

  const handleExportPDF = () => {
    if (ocs.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay órdenes para exportar",
      })
      return
    }

    const dataToExport = prepareExportData()
    exportToPDF(dataToExport, "ordenes", "Órdenes de Compra - Sistema de Importaciones")

    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${ocs.length} órdenes exportadas a PDF`,
    })
  }

  // Calcular KPIs
  const stats = useMemo(() => {
    const totalOCs = ocs.length

    const totalItems = ocs.reduce((sum: number, oc: OCChina) => sum + (oc.items?.length || 0), 0)

    const totalUnidades = ocs.reduce((sum: number, oc: OCChina) => {
      return (
        sum + (oc.items?.reduce((s: number, item: OCChinaItem) => s + item.cantidadTotal, 0) || 0)
      )
    }, 0)

    const totalFOB = ocs.reduce((sum: number, oc: OCChina) => {
      return (
        sum +
        (oc.items?.reduce(
          (s: number, item: OCChinaItem) => s + parseFloat(item.subtotalUSD.toString()),
          0
        ) || 0)
      )
    }, 0)

    const pendientes = ocs.filter((oc: OCChina) => !oc._count || oc._count.items === 0).length

    return { totalOCs, totalItems, totalUnidades, totalFOB, pendientes }
  }, [ocs])

  const columns = useMemo(
    () =>
      getOrdenesColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: setOcToDelete,
      }),
    []
  )

  // Filtrar órdenes por búsqueda
  const filteredOcs = useMemo(() => {
    if (!searchQuery.trim()) return ocs

    const query = searchQuery.toLowerCase()
    return ocs.filter(
      (oc: OCChina) =>
        oc.oc.toLowerCase().includes(query) ||
        oc.proveedor.toLowerCase().includes(query) ||
        oc.categoriaPrincipal.toLowerCase().includes(query)
    )
  }, [ocs, searchQuery])

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
            icon={<ClipboardList className="w-4 h-4" />}
            label="Total Órdenes"
            value={stats.totalOCs}
            subtitle="Registradas"
          />

          <StatCard
            icon={<Package className="w-4 h-4" />}
            label="Total Productos"
            value={stats.totalItems.toLocaleString()}
            subtitle={`${stats.totalUnidades.toLocaleString()} unidades`}
          />

          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="FOB Total"
            value={formatCurrency(stats.totalFOB, "USD")}
            subtitle={`Promedio: ${formatCurrency(stats.totalOCs > 0 ? stats.totalFOB / stats.totalOCs : 0, "USD")}/OC`}
          />

          <StatCard
            icon={<AlertCircle className="w-4 h-4" />}
            label="OCs Pendientes"
            value={stats.pendientes}
            subtitle="Sin items registrados"
          />
        </StatsGrid>

        <Card>
          <CardHeader className="space-y-0 pb-4">
            {/* Layout: Título | Buscador | Botones */}
            <div className="flex items-center justify-between gap-4">
              {/* Título a la izquierda */}
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ClipboardList size={18} />
                Órdenes ({filteredOcs.length}
                {searchQuery ? ` de ${ocs.length}` : ""})
              </CardTitle>

              {/* Buscador centrado */}
              <div className="flex-1 max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar OC, proveedor..."
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
                      disabled={ocs.length === 0}
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
                  Crear Orden
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {ocs.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay órdenes registradas
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Comienza creando tu primera orden de compra
                </p>
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Nueva Orden
                </Button>
              </div>
            ) : filteredOcs.length === 0 ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  No hay órdenes que coincidan con "{searchQuery}"
                </p>
                <Button onClick={() => setSearchQuery("")} variant="outline">
                  Limpiar búsqueda
                </Button>
              </div>
            ) : (
              <VirtualizedDataTable
                columns={columns}
                data={filteredOcs}
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
      </div>

      {/* Form Dialog */}
      {formOpen && (
        <OCChinaForm
          open={formOpen}
          onOpenChange={open => {
            setFormOpen(open)
            if (!open) setOcToEdit(null)
          }}
          onSuccess={handleFormSuccess}
          ocToEdit={ocToEdit}
        />
      )}

      {/* Delete Dialog */}
      {ocToDelete && (
        <CascadeDeleteDialog
          open={!!ocToDelete}
          onOpenChange={open => {
            if (!open) setOcToDelete(null)
          }}
          onConfirm={handleDelete}
          loading={deleteLoading}
          ocId={ocToDelete.id}
          ocNumber={ocToDelete.oc}
        />
      )}
    </MainLayout>
  )
}

export default function OrdenesPage() {
  return (
    <Suspense
      fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}
    >
      <OrdenesPageContent />
    </Suspense>
  )
}
