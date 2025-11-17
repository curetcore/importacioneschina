"use client"

export const dynamic = 'force-dynamic'

import { useState, useMemo, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectOption } from "@/components/ui/select"
import { StatCard } from "@/components/ui/stat-card"
import { StatsGrid } from "@/components/ui/stats-grid"
import { GastosLogisticosForm } from "@/components/forms/GastosLogisticosForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"
import { AttachmentsList } from "@/components/ui/attachments-list"
import { AddAttachmentsDialog } from "@/components/ui/add-attachments-dialog"
import { tiposGasto } from "@/lib/validations"
import { Plus, Edit, Trash2, Search, X, Truck, FileText, Paperclip, DollarSign, TrendingUp, Package, Download } from "lucide-react"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

interface GastoLogistico {
  id: string
  idGasto: string
  ocId: string
  fechaGasto: string
  tipoGasto: string
  proveedorServicio: string | null
  montoRD: number
  notas: string | null
  adjuntos?: FileAttachment[]
  ocChina: {
    oc: string
    proveedor: string
  }
}

export default function GastosLogisticosPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [gastoToEdit, setGastoToEdit] = useState<GastoLogistico | null>(null)
  const [gastoToDelete, setGastoToDelete] = useState<GastoLogistico | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [ocFilter, setOcFilter] = useState("")
  const [tipoGastoFilter, setTipoGastoFilter] = useState("")
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false)
  const [selectedGastoForAttachments, setSelectedGastoForAttachments] = useState<GastoLogistico | null>(null)

  const tipoGastoOptions: SelectOption[] = [
    { value: "", label: "Todos los tipos" },
    ...tiposGasto.map(t => ({ value: t, label: t })),
  ]

  // Fetch gastos with pagination and filters
  const { data: gastosData, isLoading } = useQuery({
    queryKey: ["gastos-logisticos", currentPage, searchQuery, ocFilter, tipoGastoFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      })
      if (searchQuery) params.append("search", searchQuery)
      if (ocFilter) params.append("ocId", ocFilter)
      if (tipoGastoFilter) params.append("tipoGasto", tipoGastoFilter)

      const response = await fetch(`/api/gastos-logisticos?${params.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al cargar gastos")
      }

      return result
    },
  })

  const gastos = gastosData?.data || []
  const totalPages = gastosData?.pagination?.pages || 1

  // Fetch all OCs for filter options
  const { data: allOcsData } = useQuery({
    queryKey: ["oc-china-all"],
    queryFn: async () => {
      const response = await fetch("/api/oc-china")
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Error al cargar OCs")
      }
      return result.data
    },
  })

  const ocsOptions: SelectOption[] = useMemo(() => {
    if (!allOcsData) return [{ value: "", label: "Todas las OCs" }]

    return [
      { value: "", label: "Todas las OCs" },
      ...allOcsData.map((oc: { id: string; oc: string; proveedor: string }) => ({
        value: oc.id,
        label: `${oc.oc} - ${oc.proveedor}`
      })),
    ]
  }, [allOcsData])

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, ocFilter, tipoGastoFilter])

  const handleEdit = (gasto: GastoLogistico) => {
    setGastoToEdit(gasto)
    setFormOpen(true)
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
      "Fecha": formatDate(gasto.fechaGasto),
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
            subtitle={searchQuery || ocFilter || tipoGastoFilter ? "Filtrados" : "Registrados"}
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
          <CardContent className="overflow-hidden">
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar por ID de gasto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="w-64">
                <Select
                  options={ocsOptions}
                  value={ocFilter}
                  onChange={setOcFilter}
                  placeholder="Filtrar por OC"
                />
              </div>
              <div className="w-48">
                <Select
                  options={tipoGastoOptions}
                  value={tipoGastoFilter}
                  onChange={setTipoGastoFilter}
                  placeholder="Filtrar por tipo"
                />
              </div>
            </div>

            {gastos.length === 0 ? (
              <div className="text-center py-12">
                <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay gastos logísticos registrados</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || ocFilter || tipoGastoFilter
                    ? "No se encontraron resultados con los filtros aplicados"
                    : "Comienza registrando tu primer gasto logístico"}
                </p>
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Nuevo Gasto
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: "1300px" }}>
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "120px" }}>ID Gasto</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "150px" }}>OC</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "120px" }}>Fecha</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "150px" }}>Tipo de Gasto</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "150px" }}>Proveedor</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "130px" }}>Monto RD$</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "140px" }}>Adjuntos</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "120px" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastos.map((gasto: GastoLogistico) => (
                    <tr key={gasto.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">{gasto.idGasto}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{gasto.ocChina.oc}</div>
                          <div className="text-gray-500 text-xs">{gasto.ocChina.proveedor}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(gasto.fechaGasto)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{gasto.tipoGasto}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                        {gasto.proveedorServicio || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                        {formatCurrency(gasto.montoRD)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <AttachmentsList attachments={gasto.adjuntos || []} compact />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedGastoForAttachments(gasto)
                              setAttachmentsDialogOpen(true)
                            }}
                            title="Agregar adjuntos"
                          >
                            <Paperclip className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(gasto)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setGastoToDelete(gasto)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap" colSpan={6}>
                        Total
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(gastos.reduce((sum: number, gasto: GastoLogistico) => sum + parseFloat(gasto.montoRD.toString()), 0))}
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {gastos.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
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
