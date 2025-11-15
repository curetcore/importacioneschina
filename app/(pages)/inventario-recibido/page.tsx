"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InventarioRecibidoForm } from "@/components/forms/InventarioRecibidoForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Edit, Trash2 } from "lucide-react"

interface InventarioRecibido {
  id: string
  idRecepcion: string
  ocId: string
  fechaLlegada: string
  bodegaInicial: string
  cantidadRecibida: number
  costoUnitarioFinalRD: number | null
  costoTotalRecepcionRD: number | null
  notas: string | null
  ocChina: {
    oc: string
    proveedor: string
    cantidadOrdenada: number
  }
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

  const fetchInventarios = (page = 1) => {
    setLoading(true)
    fetch(`/api/inventario-recibido?page=${page}&limit=20`)
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
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Inventario Recibido</h1>
            <p className="text-sm text-gray-500 mt-1">Gestión de recepción de mercancía</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Recepción
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recepciones Registradas</CardTitle>
          </CardHeader>
          <CardContent>
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
                    const porcentajeRecibido = (inventario.cantidadRecibida / inventario.ocChina.cantidadOrdenada) * 100
                    const isCompleto = porcentajeRecibido >= 100

                    return (
                      <tr key={inventario.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{inventario.idRecepcion}</td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{inventario.ocChina.oc}</div>
                            <div className="text-gray-500 text-xs">{inventario.ocChina.proveedor}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(inventario.fechaLlegada)}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{inventario.bodegaInicial}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{inventario.cantidadRecibida.toLocaleString()}</div>
                            <div className="text-gray-500 text-xs">
                              {porcentajeRecibido.toFixed(0)}% de {inventario.ocChina.cantidadOrdenada.toLocaleString()}
                            </div>
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

            {inventarios.length === 0 && (
              <div className="text-center py-12 text-sm text-gray-500">
                No hay recepciones registradas
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
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
