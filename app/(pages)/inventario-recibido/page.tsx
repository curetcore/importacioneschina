"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectOption } from "@/components/ui/select"
import { InventarioRecibidoForm } from "@/components/forms/InventarioRecibidoForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { bodegas } from "@/lib/validations"
import { Plus, Edit, Trash2, Search, X, PackageCheck, Inbox } from "lucide-react"

interface InventarioRecibido {
  id: string
  idRecepcion: string
  ocId: string
  itemId: string | null
  fechaLlegada: string
  bodegaInicial: string
  cantidadRecibida: number
  costoUnitarioFinalRD: number | null
  costoTotalRecepcionRD: number | null
  notas: string | null
  ocChina: {
    oc: string
    proveedor: string
  }
  item: {
    sku: string
    nombre: string
    cantidadTotal: number
  } | null
}

export default function InventarioRecibidoPage() {
  const { addToast } = useToast()
  const [inventarios, setInventarios] = useState<InventarioRecibido[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [inventarioToEdit, setInventarioToEdit] = useState<InventarioRecibido | null>(null)
  const [inventarioToDelete, setInventarioToDelete] = useState<InventarioRecibido | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [ocFilter, setOcFilter] = useState("")
  const [bodegaFilter, setBodegaFilter] = useState("")
  const [ocsOptions, setOcsOptions] = useState<SelectOption[]>([])

  const bodegaOptions: SelectOption[] = [
    { value: "", label: "Todas las bodegas" },
    ...bodegas.map(b => ({ value: b, label: b })),
  ]

  const fetchInventarios = (page = 1) => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
    })
    if (searchQuery) params.append("search", searchQuery)
    if (ocFilter) params.append("ocId", ocFilter)
    if (bodegaFilter) params.append("bodega", bodegaFilter)

    fetch(`/api/inventario-recibido?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setInventarios(result.data)
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
    fetchInventarios(1)
  }, [searchQuery, ocFilter, bodegaFilter])

  useEffect(() => {
    fetchInventarios(currentPage)
  }, [currentPage])

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
      fetchInventarios(currentPage)
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al eliminar el inventario",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setInventarioToEdit(null)
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
              <Inbox size={18} />
              Inventario ({inventario.length})
            </CardTitle>
            <Button
              onClick={() => setFormOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
            >
              <Plus size={14} />
              Nuevo
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar por ID de recepción..."
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
                  options={bodegaOptions}
                  value={bodegaFilter}
                  onChange={setBodegaFilter}
                  placeholder="Filtrar por bodega"
                />
              </div>
            </div>

            {inventarios.length === 0 ? (
              <div className="text-center py-12">
                <PackageCheck size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recepciones registradas</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || ocFilter || bodegaFilter
                    ? "No se encontraron resultados con los filtros aplicados"
                    : "Comienza registrando tu primera recepción de mercancía"}
                </p>
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Nueva Recepción
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">ID Recepción</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">OC</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha Llegada</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Bodega</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Cantidad</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Costo Unitario</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Costo Total</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventarios.map((inventario) => {
                      return (
                      <tr key={inventario.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{inventario.idRecepcion}</td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{inventario.ocChina.oc}</div>
                            <div className="text-gray-500 text-xs">
                              {inventario.ocChina.proveedor}
                              {inventario.item && ` · ${inventario.item.sku}`}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(inventario.fechaLlegada)}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{inventario.bodegaInicial}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{inventario.cantidadRecibida.toLocaleString()}</div>
                            {inventario.item && (
                              <div className="text-gray-500 text-xs">
                                {inventario.item.nombre}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-900">
                          {inventario.costoUnitarioFinalRD !== null
                            ? formatCurrency(inventario.costoUnitarioFinalRD)
                            : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                          {inventario.costoTotalRecepcionRD !== null
                            ? formatCurrency(inventario.costoTotalRecepcionRD)
                            : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              className="text-sm h-8"
                              onClick={() => handleEdit(inventario)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              className="text-sm h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setInventarioToDelete(inventario)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {inventarios.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>

        <InventarioRecibidoForm
          open={formOpen}
          onOpenChange={handleFormClose}
          onSuccess={() => {
            fetchInventarios(currentPage)
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
