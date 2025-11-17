"use client"

export const dynamic = 'force-dynamic'

import { useState, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { StatsGrid } from "@/components/ui/stats-grid"
import { GastosLogisticosForm } from "@/components/forms/GastosLogisticosForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
import { getGastosColumns, GastoLogistico } from "./columns"
import { useToast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"
import { AddAttachmentsDialog } from "@/components/ui/add-attachments-dialog"
import { Plus, Truck, DollarSign, TrendingUp, Package, Download, FileText } from "lucide-react"

export default function GastosLogisticosPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [gastoToEdit, setGastoToEdit] = useState<GastoLogistico | null>(null)
  const [gastoToDelete, setGastoToDelete] = useState<GastoLogistico | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false)
  const [selectedGastoForAttachments, setSelectedGastoForAttachments] = useState<GastoLogistico | null>(null)

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

  const handleEdit = (gasto: GastoLogistico) => {
    setGastoToEdit(gasto)
    setFormOpen(true)
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

  const handleExport = () => {
    if (gastos.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay gastos para exportar",
      })
      return
    }

    const dataToExport = gastos.map((gasto: GastoLogistico) => ({
      "ID Gasto": gasto.idGasto,
      "OC": gasto.ocChina.oc,
      "Proveedor": gasto.ocChina.proveedor,
      "Fecha": new Date(gasto.fechaGasto).toLocaleDateString(),
      "Tipo de Gasto": gasto.tipoGasto,
      "Proveedor Servicio": gasto.proveedorServicio || "",
      "Monto RD$": parseFloat(gasto.montoRD.toString()),
    }))

    exportToExcel(dataToExport, "gastos_logisticos", "Gastos Logísticos")
    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${gastos.length} gastos exportados a Excel`,
    })
  }

  // Create columns with callbacks
  const columns = useMemo(
    () =>
      getGastosColumns({
        onEdit: handleEdit,
        onDelete: setGastoToDelete,
        onAddAttachments: handleAddAttachments,
      }),
    []
  )

  // Calcular KPIs en tiempo real desde los datos filtrados
  const stats = useMemo(() => {
    const totalGastos = gastos.length

    const totalRD = gastos.reduce((sum: number, gasto: GastoLogistico) => sum + parseFloat(gasto.montoRD.toString()), 0)

    const promedioGasto = totalGastos > 0 ? totalRD / totalGastos : 0

    // Calcular el tipo de gasto más frecuente
    const tiposCounts = gastos.reduce((acc: Record<string, number>, gasto: GastoLogistico) => {
      acc[gasto.tipoGasto] = (acc[gasto.tipoGasto] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const tipoMasComun = (Object.entries(tiposCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0]
    const tipoMasComunNombre = tipoMasComun?.[0] || "N/A"
    const tipoMasComunCantidad = tipoMasComun?.[1] || 0

    return { totalGastos, totalRD, promedioGasto, tipoMasComunNombre, tipoMasComunCantidad }
  }, [gastos])

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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <FileText size={18} />
              Gastos ({gastos.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                className="gap-1.5 h-8 px-3 text-xs"
                disabled={gastos.length === 0}
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
                Crear Gasto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {gastos.length === 0 ? (
              <div className="text-center py-12">
                <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay gastos logísticos registrados</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Comienza registrando tu primer gasto logístico
                </p>
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Nuevo Gasto
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={gastos}
                searchKey="idGasto"
                searchPlaceholder="Buscar por ID de gasto..."
                pageSize={20}
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
          onOpenChange={(open) => !open && setGastoToDelete(null)}
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
