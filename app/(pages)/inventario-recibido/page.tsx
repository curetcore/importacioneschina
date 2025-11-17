"use client"

export const dynamic = 'force-dynamic'

import { useState, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
import dynamicImport from "next/dynamic"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { StatsGrid } from "@/components/ui/stats-grid"

// Lazy load heavy form component
const InventarioRecibidoForm = dynamicImport(() => import("@/components/forms/InventarioRecibidoForm").then(mod => ({ default: mod.InventarioRecibidoForm })), {
  loading: () => <div className="text-center py-4 text-sm text-gray-500">Cargando formulario...</div>
})
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
import { getInventarioColumns, InventarioRecibido } from "./columns"
import { useToast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"
import { Plus, PackageCheck, Inbox, Package, DollarSign, Warehouse, Download } from "lucide-react"

export default function InventarioRecibidoPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [inventarioToEdit, setInventarioToEdit] = useState<InventarioRecibido | null>(null)
  const [inventarioToDelete, setInventarioToDelete] = useState<InventarioRecibido | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const handleEdit = (inventario: InventarioRecibido) => {
    setInventarioToEdit(inventario)
    setFormOpen(true)
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

  const handleExport = () => {
    if (inventarios.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay recepciones para exportar",
      })
      return
    }

    const dataToExport = inventarios.map((inventario: InventarioRecibido) => ({
      "ID Recepción": inventario.idRecepcion,
      "OC": inventario.ocChina.oc,
      "Proveedor": inventario.ocChina.proveedor,
      "Fecha Llegada": new Date(inventario.fechaLlegada).toLocaleDateString(),
      "Bodega": inventario.bodegaInicial,
      "Cantidad Recibida": inventario.cantidadRecibida,
      "SKU": inventario.item?.sku || "",
      "Producto": inventario.item?.nombre || "",
      "Costo Unitario RD$": inventario.costoUnitarioFinalRD !== null ? parseFloat(inventario.costoUnitarioFinalRD.toString()) : 0,
      "Costo Total RD$": inventario.costoTotalRecepcionRD !== null ? parseFloat(inventario.costoTotalRecepcionRD.toString()) : 0,
    }))

    exportToExcel(dataToExport, "inventario_recibido", "Inventario Recibido")
    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${inventarios.length} recepciones exportadas a Excel`,
    })
  }

  // Create columns with callbacks
  const columns = useMemo(
    () =>
      getInventarioColumns({
        onEdit: handleEdit,
        onDelete: setInventarioToDelete,
      }),
    []
  )

  // Calcular KPIs en tiempo real desde los datos filtrados
  const stats = useMemo(() => {
    const totalRecepciones = inventarios.length

    const totalUnidades = inventarios.reduce((sum: number, inv: InventarioRecibido) => sum + inv.cantidadRecibida, 0)

    const totalCostoRD = inventarios.reduce((sum: number, inv: InventarioRecibido) => {
      return sum + parseFloat((inv.costoTotalRecepcionRD || 0).toString())
    }, 0)

    // Calcular bodega con más recepciones
    const bodegaCounts = inventarios.reduce((acc: Record<string, number>, inv: InventarioRecibido) => {
      acc[inv.bodegaInicial] = (acc[inv.bodegaInicial] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bodegaMasUsada = (Object.entries(bodegaCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0]
    const bodegaMasUsadaNombre = bodegaMasUsada?.[0] || "N/A"
    const bodegaMasUsadaCantidad = bodegaMasUsada?.[1] || 0

    return { totalRecepciones, totalUnidades, totalCostoRD, bodegaMasUsadaNombre, bodegaMasUsadaCantidad }
  }, [inventarios])

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
            icon={<Inbox className="w-4 h-4" />}
            label="Total Recepciones"
            value={stats.totalRecepciones}
            subtitle="Registradas"
          />

          <StatCard
            icon={<Package className="w-4 h-4" />}
            label="Total Unidades"
            value={stats.totalUnidades.toLocaleString()}
            subtitle={`En ${stats.totalRecepciones} recepción${stats.totalRecepciones !== 1 ? 'es' : ''}`}
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Inbox size={18} />
              Inventario ({inventarios.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                className="gap-1.5 h-8 px-3 text-xs"
                disabled={inventarios.length === 0}
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
                Crear Recepción
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {inventarios.length === 0 ? (
              <div className="text-center py-12">
                <PackageCheck size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recepciones registradas</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Comienza registrando tu primera recepción de mercancía
                </p>
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Nueva Recepción
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={inventarios}
                searchKey="idRecepcion"
                searchPlaceholder="Buscar por ID de recepción..."
                pageSize={20}
              />
            )}
          </CardContent>
        </Card>

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
          onOpenChange={(open) => !open && setInventarioToDelete(null)}
          onConfirm={handleDelete}
          title="Eliminar Recepción"
          description={`¿Estás seguro de eliminar la recepción ${inventarioToDelete?.idRecepcion}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          loading={deleteLoading}
        />
      </div>
    </MainLayout>
  )
}
