"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectOption } from "@/components/ui/select"
import { StatCard } from "@/components/ui/stat-card"
import { StatsGrid } from "@/components/ui/stats-grid"
import { PagosChinaForm } from "@/components/forms/PagosChinaForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AttachmentsList } from "@/components/ui/attachments-list"
import { AddAttachmentsDialog } from "@/components/ui/add-attachments-dialog"
import { Plus, Edit, Trash2, Search, X, DollarSign, Paperclip, Banknote, Coins, TrendingUp } from "lucide-react"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

interface Pago {
  id: string
  idPago: string
  ocId: string
  fechaPago: string
  tipoPago: string
  metodoPago: string
  moneda: "USD" | "CNY" | "RD$"
  montoOriginal: number
  tasaCambio: number
  comisionBancoRD: number
  montoRD: number
  montoRDNeto: number
  adjuntos?: FileAttachment[]
  ocChina: {
    oc: string
    proveedor: string
  }
}

export default function PagosChinaPage() {
  const { addToast } = useToast()
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [pagoToEdit, setPagoToEdit] = useState<Pago | null>(null)
  const [pagoToDelete, setPagoToDelete] = useState<Pago | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [ocFilter, setOcFilter] = useState("")
  const [monedaFilter, setMonedaFilter] = useState("")
  const [ocsOptions, setOcsOptions] = useState<SelectOption[]>([])
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false)
  const [selectedPagoForAttachments, setSelectedPagoForAttachments] = useState<Pago | null>(null)

  const monedaOptions: SelectOption[] = [
    { value: "", label: "Todas las monedas" },
    { value: "USD", label: "USD" },
    { value: "CNY", label: "CNY" },
    { value: "RD$", label: "RD$" },
  ]

  const fetchPagos = (page = 1) => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
    })
    if (searchQuery) params.append("search", searchQuery)
    if (ocFilter) params.append("ocId", ocFilter)
    if (monedaFilter) params.append("moneda", monedaFilter)

    fetch(`/api/pagos-china?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setPagos(result.data)
          setTotalPages(result.pagination.pages)
          setCurrentPage(result.pagination.page)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const fetchOCs = () => {
    fetch("/api/oc-china")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setOcsOptions([
            { value: "", label: "Todas las OCs" },
            ...result.data.map((oc: { id: string; oc: string; proveedor: string }) => ({ value: oc.id, label: `${oc.oc} - ${oc.proveedor}` })),
          ])
        }
      })
  }

  useEffect(() => {
    fetchOCs()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    fetchPagos(1)
  }, [searchQuery, ocFilter, monedaFilter])

  useEffect(() => {
    fetchPagos(currentPage)
  }, [currentPage])

  const handleEdit = (pago: Pago) => {
    setPagoToEdit(pago)
    setFormOpen(true)
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
      fetchPagos(currentPage)
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

  // Calcular KPIs en tiempo real desde los datos filtrados
  const stats = useMemo(() => {
    const totalRD = pagos.reduce((sum, pago) => sum + parseFloat(pago.montoRDNeto?.toString() || "0"), 0)

    const totalUSD = pagos
      .filter(p => p.moneda === "USD")
      .reduce((sum, p) => sum + parseFloat(p.montoOriginal.toString()), 0)

    const totalCNY = pagos
      .filter(p => p.moneda === "CNY")
      .reduce((sum, p) => sum + parseFloat(p.montoOriginal.toString()), 0)

    // Calcular tasa promedio ponderada (weighted average)
    const pagosConMoneda = pagos.filter(p => p.moneda === "USD" || p.moneda === "CNY")
    const totalWeighted = pagosConMoneda.reduce((sum, p) => {
      return sum + (parseFloat(p.montoOriginal.toString()) * parseFloat(p.tasaCambio.toString()))
    }, 0)
    const totalAmount = pagosConMoneda.reduce((sum, p) => sum + parseFloat(p.montoOriginal.toString()), 0)
    const tasaPromedio = totalAmount > 0 ? totalWeighted / totalAmount : 0

    return { totalRD, totalUSD, totalCNY, tasaPromedio }
  }, [pagos])

  if (loading) {
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
            icon={<DollarSign className="w-4 h-4" />}
            label="Total Pagado RD$"
            value={formatCurrency(stats.totalRD)}
            subtitle={`En ${pagos.length} pago${pagos.length !== 1 ? 's' : ''}`}
          />

          <StatCard
            icon={<Banknote className="w-4 h-4" />}
            label="Total USD"
            value={formatCurrency(stats.totalUSD, "USD")}
            subtitle={`${pagos.filter(p => p.moneda === "USD").length} pagos`}
          />

          <StatCard
            icon={<Coins className="w-4 h-4" />}
            label="Total CNY"
            value={formatCurrency(stats.totalCNY, "CNY")}
            subtitle={`${pagos.filter(p => p.moneda === "CNY").length} pagos`}
          />

          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Tasa Promedio"
            value={stats.tasaPromedio.toFixed(2)}
            subtitle="Ponderada por monto"
          />
        </StatsGrid>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <DollarSign size={18} />
              Pagos ({pagos.length})
            </CardTitle>
            <Button
              onClick={() => setFormOpen(true)}
              variant="outline"
              className="gap-1.5 h-8 px-3 text-xs"
            >
              <Plus size={14} />
              Crear Pago
            </Button>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar por ID de pago..."
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
                  options={monedaOptions}
                  value={monedaFilter}
                  onChange={setMonedaFilter}
                  placeholder="Filtrar por moneda"
                />
              </div>
            </div>

            {pagos.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos registrados</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || ocFilter || monedaFilter
                    ? "No se encontraron resultados con los filtros aplicados"
                    : "Comienza registrando tu primer pago a proveedor"}
                </p>
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Nuevo Pago
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: "1400px" }}>
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "120px" }}>ID Pago</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "150px" }}>OC</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "120px" }}>Fecha</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "120px" }}>Tipo</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "130px" }}>Método</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "140px" }}>Monto Original</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "100px" }}>Tasa</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "150px" }}>Monto RD$ (Neto)</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "140px" }}>Adjuntos</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "120px" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((pago) => (
                    <tr key={pago.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">{pago.idPago}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{pago.ocChina.oc}</div>
                          <div className="text-gray-500 text-xs">{pago.ocChina.proveedor}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(pago.fechaPago)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{pago.tipoPago}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{pago.metodoPago}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(pago.montoOriginal, pago.moneda)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900 whitespace-nowrap">{pago.tasaCambio.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{formatCurrency(pago.montoRDNeto)}</div>
                          {pago.comisionBancoRD > 0 && (
                            <div className="text-gray-500 text-xs">
                              + {formatCurrency(pago.comisionBancoRD)} comisión
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <AttachmentsList attachments={pago.adjuntos || []} compact />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedPagoForAttachments(pago)
                              setAttachmentsDialogOpen(true)
                            }}
                            title="Agregar adjuntos"
                          >
                            <Paperclip className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(pago)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setPagoToDelete(pago)}
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
                      <td className="py-3 px-4 text-sm font-semibold text-gray-700" colSpan={8}>
                        Total
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(pagos.reduce((sum, pago) => sum + parseFloat(pago.montoRDNeto?.toString() || "0"), 0))}
                        </div>
                        {pagos.reduce((sum, pago) => sum + parseFloat(pago.comisionBancoRD.toString()), 0) > 0 && (
                          <div className="text-gray-600 text-xs">
                            + {formatCurrency(pagos.reduce((sum, pago) => sum + parseFloat(pago.comisionBancoRD.toString()), 0))} comisión
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {pagos.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>

        <PagosChinaForm
          open={formOpen}
          onOpenChange={handleFormClose}
          onSuccess={() => {
            fetchPagos(currentPage)
            handleFormClose()
          }}
          pagoToEdit={pagoToEdit}
        />

        <ConfirmDialog
          open={!!pagoToDelete}
          onOpenChange={(open) => !open && setPagoToDelete(null)}
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
              fetchPagos(currentPage)
              setSelectedPagoForAttachments(null)
            }}
          />
        )}
      </div>
    </MainLayout>
  )
}
