"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OCChinaForm } from "@/components/forms/OCChinaForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { formatDate } from "@/lib/utils"
import { Plus, Edit, Trash2 } from "lucide-react"

interface OCChina {
  id: string
  oc: string
  proveedor: string
  fechaOC: string
  categoriaPrincipal: string
  cantidadOrdenada: number
  costoFOBTotalUSD: number
  descripcionLote?: string | null
}

export default function OrdenesPage() {
  const { addToast } = useToast()
  const [ocs, setOcs] = useState<OCChina[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [ocToEdit, setOcToEdit] = useState<OCChina | null>(null)
  const [ocToDelete, setOcToDelete] = useState<OCChina | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchOCs = () => {
    setLoading(true)
    fetch("/api/oc-china")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setOcs(result.data)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchOCs()
  }, [])

  const handleEdit = (oc: OCChina) => {
    setOcToEdit(oc)
    setFormOpen(true)
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
        throw new Error(result.error || "Error al eliminar la orden")
      }

      addToast({
        type: "success",
        title: "Orden eliminada",
        description: `Orden ${ocToDelete.oc} eliminada exitosamente`,
      })

      setOcToDelete(null)
      fetchOCs()
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al eliminar la orden",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setOcToEdit(null)
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
            <h1 className="text-2xl font-semibold text-gray-900">Ordenes</h1>
            <p className="text-sm text-gray-500 mt-1">Gestión de órdenes de compra</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Orden
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Órdenes de Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">OC</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Proveedor</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Categoría</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Cantidad</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Costo FOB</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ocs.map((oc) => (
                    <tr key={oc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{oc.oc}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{oc.proveedor}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{formatDate(oc.fechaOC)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{oc.categoriaPrincipal}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900">{oc.cantidadOrdenada.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">${oc.costoFOBTotalUSD.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            className="text-sm h-8"
                            onClick={() => handleEdit(oc)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-sm h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setOcToDelete(oc)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <OCChinaForm
          open={formOpen}
          onOpenChange={handleFormClose}
          onSuccess={() => {
            fetchOCs()
            handleFormClose()
          }}
          ocToEdit={ocToEdit}
        />

        <ConfirmDialog
          open={!!ocToDelete}
          onOpenChange={(open) => !open && setOcToDelete(null)}
          onConfirm={handleDelete}
          title="Eliminar Orden"
          description={`¿Estás seguro de eliminar la orden ${ocToDelete?.oc}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          loading={deleteLoading}
        />
      </div>
    </MainLayout>
  )
}
