"use client"

export const dynamic = 'force-dynamic'

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { StatsGrid } from "@/components/ui/stats-grid"
import { OCChinaForm } from "@/components/forms/OCChinaForm"
import { CascadeDeleteDialog } from "@/components/ui/cascade-delete-dialog"
import { useToast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"
import { DataTable } from "@/components/ui/data-table"
import { getOrdenesColumns, OCChina } from "./columns"
import { Plus, ClipboardList, Package, DollarSign, AlertCircle, Download } from "lucide-react"

interface OCChinaItem {
  id: string
  sku: string
  nombre: string
  cantidadTotal: number
  precioUnitarioUSD: number
  subtotalUSD: number
}

export default function OrdenesPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [ocToEdit, setOcToEdit] = useState<OCChina | null>(null)
  const [ocToDelete, setOcToDelete] = useState<OCChina | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const handleExport = () => {
    if (ocs.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay órdenes para exportar",
      })
      return
    }

    const dataToExport = ocs.map((oc: OCChina) => ({
      "OC": oc.oc,
      "Proveedor": oc.proveedor,
      "Fecha": new Date(oc.fechaOC).toLocaleDateString(),
      "Categoría": oc.categoriaPrincipal,
      "Productos": oc.items?.length || 0,
      "Unidades": oc.items?.reduce((sum: number, item: OCChinaItem) => sum + item.cantidadTotal, 0) || 0,
      "Costo FOB (USD)": oc.items?.reduce((sum: number, item: OCChinaItem) => sum + parseFloat(item.subtotalUSD.toString()), 0) || 0,
    }))

    exportToExcel(dataToExport, "ordenes", "Órdenes de Compra")

    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${ocs.length} órdenes exportadas a Excel`,
    })
  }

  // Calcular KPIs
  const stats = useMemo(() => {
    const totalOCs = ocs.length

    const totalItems = ocs.reduce((sum: number, oc: OCChina) => sum + (oc.items?.length || 0), 0)

    const totalUnidades = ocs.reduce((sum: number, oc: OCChina) => {
      return sum + (oc.items?.reduce((s: number, item: OCChinaItem) => s + item.cantidadTotal, 0) || 0)
    }, 0)

    const totalFOB = ocs.reduce((sum: number, oc: OCChina) => {
      return sum + (oc.items?.reduce((s: number, item: OCChinaItem) => s + parseFloat(item.subtotalUSD.toString()), 0) || 0)
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-sm text-gray-500">Cargando...</div>
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <ClipboardList size={18} />
              Órdenes ({ocs.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                className="gap-1.5 h-8 px-3 text-xs"
                disabled={ocs.length === 0}
              >
                <Download size={14} />
                Exportar
              </Button>
              <Button
                onClick={() => setFormOpen(true)}
                variant="outline"
                className="gap-1.5 h-8 px-3 text-xs"
              >
                <Plus size={14} />
                Crear Orden
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {ocs.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes registradas</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Comienza creando tu primera orden de compra
                </p>
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Nueva Orden
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={ocs}
                searchKey="oc"
                searchPlaceholder="Buscar por número de OC..."
                pageSize={20}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      {formOpen && (
        <OCChinaForm
          open={formOpen}
          onOpenChange={(open) => {
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
          onOpenChange={(open) => {
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
