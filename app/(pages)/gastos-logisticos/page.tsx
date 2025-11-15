"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectOption } from "@/components/ui/select"
import { GastosLogisticosForm } from "@/components/forms/GastosLogisticosForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { tiposGasto } from "@/lib/validations"
import { Plus, Edit, Trash2, Search, X, Truck, FileText } from "lucide-react"

interface GastoLogistico {
  id: string
  idGasto: string
  ocId: string
  fechaGasto: string
  tipoGasto: string
  proveedorServicio: string | null
  montoRD: number
  notas: string | null
  ocChina: {
    oc: string
    proveedor: string
  }
}

export default function GastosLogisticosPage() {
  const { addToast } = useToast()
  const [gastos, setGastos] = useState<GastoLogistico[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [gastoToEdit, setGastoToEdit] = useState<GastoLogistico | null>(null)
  const [gastoToDelete, setGastoToDelete] = useState<GastoLogistico | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [ocFilter, setOcFilter] = useState("")
  const [tipoGastoFilter, setTipoGastoFilter] = useState("")
  const [ocsOptions, setOcsOptions] = useState<SelectOption[]>([])

  const tipoGastoOptions: SelectOption[] = [
    { value: "", label: "Todos los tipos" },
    ...tiposGasto.map(t => ({ value: t, label: t })),
  ]

  const fetchGastos = (page = 1) => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
    })
    if (searchQuery) params.append("search", searchQuery)
    if (ocFilter) params.append("ocId", ocFilter)
    if (tipoGastoFilter) params.append("tipoGasto", tipoGastoFilter)

    fetch(`/api/gastos-logisticos?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setGastos(result.data)
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
            ...result.data.map((oc: any) => ({ value: oc.id, label: `${oc.oc} - ${oc.proveedor}` })),
          ])
        }
      })
  }

  useEffect(() => {
    fetchOCs()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    fetchGastos(1)
  }, [searchQuery, ocFilter, tipoGastoFilter])

  useEffect(() => {
    fetchGastos(currentPage)
  }, [currentPage])

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
      fetchGastos(currentPage)
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al eliminar el gasto",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setGastoToEdit(null)
  }

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <FileText size={18} />
              Gastos ({gastos.length})
            </CardTitle>
            <Button
              onClick={() => setFormOpen(true)}
              variant="outline"
              className="h-8 w-8 p-0"
            >
              <Plus size={16} />
            </Button>
          </CardHeader>
          <CardContent>
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
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">ID Gasto</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">OC</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo de Gasto</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Proveedor</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Monto RD$</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastos.map((gasto) => (
                    <tr key={gasto.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{gasto.idGasto}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{gasto.ocChina.oc}</div>
                          <div className="text-gray-500 text-xs">{gasto.ocChina.proveedor}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{formatDate(gasto.fechaGasto)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{gasto.tipoGasto}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {gasto.proveedorServicio || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(gasto.montoRD)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
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
                      <td className="py-3 px-4 text-sm font-semibold text-gray-700" colSpan={5}>
                        Total
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(gastos.reduce((sum, gasto) => sum + parseFloat(gasto.montoRD.toString()), 0))}
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
            fetchGastos(currentPage)
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
      </div>
    </MainLayout>
  )
}
