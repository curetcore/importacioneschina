"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PagosChinaForm } from "@/components/forms/PagosChinaForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Edit, Trash2 } from "lucide-react"

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

  const fetchPagos = () => {
    setLoading(true)
    fetch("/api/pagos-china")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setPagos(result.data)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchPagos()
  }, [])

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
      fetchPagos()
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al eliminar el pago",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setPagoToEdit(null)
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
            <h1 className="text-2xl font-semibold text-gray-900">Pagos</h1>
            <p className="text-sm text-gray-500 mt-1">Gestión de pagos a proveedores</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Pago
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pagos Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">ID Pago</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">OC</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Método</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Monto Original</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Tasa</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Monto RD$ (Neto)</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{pago.idPago}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{pago.ocChina.oc}</div>
                          <div className="text-gray-500 text-xs">{pago.ocChina.proveedor}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{formatDate(pago.fechaPago)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{pago.tipoPago}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{pago.metodoPago}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{pago.montoOriginal.toLocaleString()}</div>
                          <div className="text-gray-500 text-xs">{pago.moneda}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900">{pago.tasaCambio.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{formatCurrency(pago.montoRDNeto)}</div>
                          {pago.comisionBancoRD > 0 && (
                            <div className="text-gray-500 text-xs">
                              + {formatCurrency(pago.comisionBancoRD)} comisión
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            className="text-sm h-8"
                            onClick={() => handleEdit(pago)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-sm h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setPagoToDelete(pago)}
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

        <PagosChinaForm
          open={formOpen}
          onOpenChange={handleFormClose}
          onSuccess={() => {
            fetchPagos()
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
      </div>
    </MainLayout>
  )
}
