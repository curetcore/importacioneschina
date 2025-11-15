"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GastosLogisticosForm } from "@/components/forms/GastosLogisticosForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Edit, Trash2 } from "lucide-react"

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

  const fetchGastos = () => {
    setLoading(true)
    fetch("/api/gastos-logisticos")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setGastos(result.data)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchGastos()
  }, [])

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
      fetchGastos()
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
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Gastos Logísticos</h1>
            <p className="text-sm text-gray-500 mt-1">Gestión de gastos de importación</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Gasto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gastos Registrados</CardTitle>
          </CardHeader>
          <CardContent>
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
                            className="text-sm h-8"
                            onClick={() => handleEdit(gasto)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-sm h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setGastoToDelete(gasto)}
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

            {gastos.length === 0 && (
              <div className="text-center py-12 text-sm text-gray-500">
                No hay gastos registrados
              </div>
            )}
          </CardContent>
        </Card>

        <GastosLogisticosForm
          open={formOpen}
          onOpenChange={handleFormClose}
          onSuccess={() => {
            fetchGastos()
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
