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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { VirtualizedDataTable } from "@/components/ui/virtualized-data-table"
import { TableSkeleton, StatCardSkeleton } from "@/components/ui/skeleton"
import { getPagosColumns, Pago } from "./columns"
import { useToast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel, exportToPDF } from "@/lib/export-utils"

// Lazy load heavy components
const PagosChinaForm = dynamicImport(
  () => import("@/components/forms/PagosChinaForm").then(mod => ({ default: mod.PagosChinaForm })),
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
  DollarSign,
  Banknote,
  Coins,
  TrendingUp,
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

function PagosChinaPageContent() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [pagoToEdit, setPagoToEdit] = useState<Pago | null>(null)
  const [pagoToDelete, setPagoToDelete] = useState<Pago | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false)
  const [selectedPagoForAttachments, setSelectedPagoForAttachments] = useState<Pago | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const searchParams = useSearchParams()

  // Fetch all pagos
  const { data: pagos = [], isLoading } = useQuery({
    queryKey: ["pagos-china"],
    queryFn: async () => {
      const response = await fetch("/api/pagos-china")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al cargar pagos")
      }

      return result.data as Pago[]
    },
  })

  // Detect query params for edit/delete actions
  useEffect(() => {
    if (!pagos.length) return // Wait for data to load

    const editId = searchParams.get("edit")
    const deleteId = searchParams.get("delete")

    if (editId) {
      const pagoToEdit = pagos.find((pago: Pago) => pago.id === editId)
      if (pagoToEdit) {
        setPagoToEdit(pagoToEdit)
        setFormOpen(true)
        // Clear query param
        router.replace("/pagos-china", { scroll: false })
      }
    } else if (deleteId) {
      const pagoToDelete = pagos.find((pago: Pago) => pago.id === deleteId)
      if (pagoToDelete) {
        setPagoToDelete(pagoToDelete)
        // Clear query param
        router.replace("/pagos-china", { scroll: false })
      }
    }
  }, [searchParams, pagos, router])

  const handleEdit = (pago: Pago) => {
    setPagoToEdit(pago)
    setFormOpen(true)
  }

  const handleView = (pago: Pago) => {
    router.push(`/pagos-china/${pago.id}`)
  }

  const handleAddAttachments = (pago: Pago) => {
    setSelectedPagoForAttachments(pago)
    setAttachmentsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!pagoToDelete) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/pagos-china/${pagoToDelete.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar el pago")
      }

      addToast({
        type: "success",
        title: "Pago eliminado",
        description: `Pago ${pagoToDelete.idPago} eliminado exitosamente`,
      })

      setPagoToDelete(null)
      queryClient.invalidateQueries({ queryKey: ["pagos-china"] })
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el pago",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setPagoToEdit(null)
  }

  const prepareExportData = () => {
    return pagos.map((pago: Pago) => ({
      "ID Pago": pago.idPago,
      OC: pago.ocChina.oc,
      Proveedor: pago.ocChina.proveedor,
      Fecha: new Date(pago.fechaPago).toLocaleDateString(),
      Tipo: pago.tipoPago,
      Método: pago.metodoPago,
      Moneda: pago.moneda,
      "Monto Original": parseFloat(pago.montoOriginal.toString()),
      "Tasa Cambio": parseFloat(pago.tasaCambio.toString()),
      "Comisión Banco (USD)": parseFloat(pago.comisionBancoUSD.toString()),
      "Comisión Banco (RD$)": parseFloat((pago.comisionBancoUSD * pago.tasaCambio).toString()),
      "Monto RD$": parseFloat(pago.montoRD.toString()),
      "Monto RD$ Neto": parseFloat(pago.montoRDNeto.toString()),
    }))
  }

  const handleExportExcel = () => {
    if (pagos.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay pagos para exportar",
      })
      return
    }

    const dataToExport = prepareExportData()
    exportToExcel(dataToExport, "pagos_china", "Pagos a China")

    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${pagos.length} pagos exportados a Excel`,
    })
  }

  const handleExportPDF = () => {
    if (pagos.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay pagos para exportar",
      })
      return
    }

    const dataToExport = prepareExportData()
    exportToPDF(dataToExport, "pagos_china", "Pagos a China - Sistema de Importaciones")

    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${pagos.length} pagos exportados a PDF`,
    })
  }

  // Create columns with callbacks
  const columns = useMemo(
    () =>
      getPagosColumns({
        onView: handleView,
      }),
    []
  )

  // Filtrar pagos por búsqueda
  const filteredPagos = useMemo(() => {
    if (!searchQuery.trim()) return pagos

    const query = searchQuery.toLowerCase()
    return pagos.filter(
      (pago: Pago) =>
        pago.idPago.toLowerCase().includes(query) ||
        pago.ocChina.oc.toLowerCase().includes(query) ||
        pago.ocChina.proveedor.toLowerCase().includes(query) ||
        pago.tipoPago.toLowerCase().includes(query) ||
        pago.metodoPago.toLowerCase().includes(query)
    )
  }, [pagos, searchQuery])

  // Calcular KPIs en tiempo real desde los datos filtrados
  const stats = useMemo(() => {
    const totalRD = pagos.reduce(
      (sum: number, pago: Pago) => sum + parseFloat(pago.montoRDNeto?.toString() || "0"),
      0
    )

    const totalUSD = pagos
      .filter((p: Pago) => p.moneda === "USD")
      .reduce((sum: number, p: Pago) => sum + parseFloat(p.montoOriginal.toString()), 0)

    const totalRDPesos = pagos
      .filter((p: Pago) => p.moneda === "RD$")
      .reduce((sum: number, p: Pago) => sum + parseFloat(p.montoOriginal.toString()), 0)

    // Calcular tasa promedio ponderada (weighted average) solo para pagos en USD
    const pagosUSD = pagos.filter((p: Pago) => p.moneda === "USD")
    const totalWeighted = pagosUSD.reduce((sum: number, p: Pago) => {
      return sum + parseFloat(p.montoOriginal.toString()) * parseFloat(p.tasaCambio.toString())
    }, 0)
    const totalAmount = pagosUSD.reduce(
      (sum: number, p: Pago) => sum + parseFloat(p.montoOriginal.toString()),
      0
    )
    const tasaPromedio = totalAmount > 0 ? totalWeighted / totalAmount : 0

    return { totalRD, totalUSD, totalRDPesos, tasaPromedio }
  }, [pagos])

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
            icon={<DollarSign className="w-4 h-4" />}
            label="Total Pagado RD$"
            value={formatCurrency(stats.totalRD)}
            subtitle={`En ${pagos.length} pago${pagos.length !== 1 ? "s" : ""}`}
          />

          <StatCard
            icon={<Banknote className="w-4 h-4" />}
            label="Total USD"
            value={formatCurrency(stats.totalUSD, "USD")}
            subtitle={`${pagos.filter((p: Pago) => p.moneda === "USD").length} pagos`}
          />

          <StatCard
            icon={<Coins className="w-4 h-4" />}
            label="Total RD$"
            value={formatCurrency(stats.totalRDPesos)}
            subtitle={`${pagos.filter((p: Pago) => p.moneda === "RD$").length} pagos`}
          />

          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Tasa Promedio"
            value={stats.tasaPromedio.toFixed(2)}
            subtitle="Ponderada por monto"
          />
        </StatsGrid>

        <Card>
          <CardHeader className="space-y-0 pb-4">
            {/* Layout: Título | Buscador | Botones */}
            <div className="flex items-center justify-between gap-4">
              {/* Título a la izquierda */}
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <DollarSign size={18} />
                Pagos ({filteredPagos.length}
                {searchQuery ? ` de ${pagos.length}` : ""})
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
                      disabled={pagos.length === 0}
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
                <Button
                  onClick={() => setFormOpen(true)}
                  variant="outline"
                  className="gap-1.5 h-8 px-2 text-xs"
                >
                  <Plus size={14} />
                  Crear Pago
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pagos.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos registrados</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Comienza registrando tu primer pago a proveedor
                </p>
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Nuevo Pago
                </Button>
              </div>
            ) : filteredPagos.length === 0 ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  No hay pagos que coincidan con "{searchQuery}"
                </p>
                <Button onClick={() => setSearchQuery("")} variant="outline">
                  Limpiar búsqueda
                </Button>
              </div>
            ) : (
              <VirtualizedDataTable
                columns={columns}
                data={filteredPagos}
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

        <PagosChinaForm
          open={formOpen}
          onOpenChange={handleFormClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["pagos-china"] })
            handleFormClose()
          }}
          pagoToEdit={pagoToEdit}
        />

        <ConfirmDialog
          open={!!pagoToDelete}
          onOpenChange={open => !open && setPagoToDelete(null)}
          onConfirm={handleDelete}
          title="Eliminar Pago"
          description={`¿Estás seguro de eliminar el pago ${pagoToDelete?.idPago}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          loading={deleteLoading}
        />

        {selectedPagoForAttachments && (
          <AddAttachmentsDialog
            open={attachmentsDialogOpen}
            onOpenChange={setAttachmentsDialogOpen}
            module="pagos-china"
            recordId={selectedPagoForAttachments.id}
            recordName={`Pago ${selectedPagoForAttachments.idPago} - OC ${selectedPagoForAttachments.ocChina.oc}`}
            currentAttachments={selectedPagoForAttachments.adjuntos || []}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["pagos-china"] })
              setSelectedPagoForAttachments(null)
            }}
          />
        )}
      </div>
    </MainLayout>
  )
}

export default function PagosChinaPage() {
  return (
    <Suspense
      fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}
    >
      <PagosChinaPageContent />
    </Suspense>
  )
}
