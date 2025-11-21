"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AddAttachmentsDialog } from "@/components/ui/add-attachments-dialog"
import { AttachmentsList } from "@/components/ui/attachments-list"
import { RenameAttachmentModal } from "@/components/ui/rename-attachment-modal"
import { useEditingPresence } from "@/hooks/useEditingPresence"
import { EditingBanner } from "@/components/ui/editing-banner"
import { ArrowLeft, Paperclip, Edit, Trash2 } from "lucide-react"
import { showToast } from "@/lib/toast"
import { CommentsSection } from "@/components/comments/CommentsSection"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

interface PagoDetail {
  id: string
  idPago: string
  ocId: string
  fechaPago: string
  tipoPago: string
  metodoPago: string
  moneda: "USD" | "RD$"
  montoOriginal: number
  tasaCambio: number
  comisionBancoUSD: number
  montoRD: number
  montoRDNeto: number
  adjuntos?: FileAttachment[]
  ocChina: {
    id: string
    oc: string
    proveedor: string
    fechaOC: string
    categoriaPrincipal: string
  }
}

export default function PagoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [pago, setPago] = useState<PagoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [fileToRename, setFileToRename] = useState<FileAttachment | null>(null)

  const fetchPago = () => {
    if (params.id) {
      setLoading(true)
      fetch(`/api/pagos-china/${params.id}`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setPago(result.data)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }

  useEffect(() => {
    fetchPago()
  }, [params.id])

  const handleRenameAttachment = (file: FileAttachment) => {
    setFileToRename(file)
    setRenameModalOpen(true)
  }

  const handleDeleteAttachment = async (file: FileAttachment) => {
    if (!confirm(`¿Estás seguro de eliminar "${file.nombre}"?`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/pagos-china/${pago?.id}/attachments?fileUrl=${encodeURIComponent(file.url)}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Error al eliminar adjunto")
      }

      showToast.success("Adjunto eliminado", {
        description: `${file.nombre} ha sido eliminado`,
      })
      fetchPago()
    } catch (error) {
      showToast.error("Error al eliminar", {
        description: "No se pudo eliminar el adjunto",
      })
    }
  }

  const { editingUsers } = useEditingPresence({
    resourceType: "payment",
    resourceId: params.id as string,
    currentUser: {
      id: session?.user?.id || "",
      name: session?.user?.name || "",
      email: session?.user?.email || "",
    },
    enabled: !!params.id && !!session?.user,
  })

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-sm text-gray-500">Cargando...</div>
      </MainLayout>
    )
  }

  if (!pago) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-sm text-gray-500">No se encontró el pago</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-shopify-border-subdued pb-6 mb-2">
          <div>
            <Button
              variant="plain"
              onClick={() => router.push("/pagos-china")}
              className="mb-3 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Pagos
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-shopify-text">Pago #{pago.idPago}</h1>
              <p className="text-sm text-shopify-text-subdued mt-1">
                {formatDate(pago.fechaPago)} | {pago.tipoPago} | {pago.metodoPago}
              </p>
              <p className="text-sm text-shopify-text-subdued mt-0.5 font-medium">
                OC: {pago.ocChina.oc} - {pago.ocChina.proveedor}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/pagos-china?edit=${pago.id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="critical"
              size="sm"
              onClick={() => router.push(`/pagos-china?delete=${pago.id}`)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        <EditingBanner editingUsers={editingUsers} />

        {/* Información del Pago */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold">Información del Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500">Monto Original</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(pago.montoOriginal, pago.moneda)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Moneda: {pago.moneda}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Tasa de Cambio</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(pago.tasaCambio)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  RD$ por {pago.moneda === "USD" ? "dólar" : "peso"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Monto en RD$</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(pago.montoRD)}
                </div>
              </div>
              {pago.comisionBancoUSD > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Comisión Banco</div>
                  <div className="text-2xl font-semibold text-gray-900 mt-1">
                    {formatCurrency(pago.comisionBancoUSD, "USD")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    = {formatCurrency(pago.comisionBancoUSD * pago.tasaCambio)} RD$
                  </div>
                </div>
              )}
              <div className="md:col-span-2">
                <div className="text-sm font-medium text-gray-500">Monto Neto (RD$)</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(pago.montoRDNeto)}
                </div>
                {pago.comisionBancoUSD > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Monto total menos comisión bancaria
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de la OC */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold">Orden de Compra Asociada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-500">Número de OC</div>
                <div className="text-lg font-semibold text-gray-900 mt-1">{pago.ocChina.oc}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Proveedor</div>
                <div className="text-lg text-gray-900 mt-1">{pago.ocChina.proveedor}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Fecha de OC</div>
                <div className="text-lg text-gray-900 mt-1">{formatDate(pago.ocChina.fechaOC)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Categoría</div>
                <div className="text-lg text-gray-900 mt-1">{pago.ocChina.categoriaPrincipal}</div>
              </div>
              <div className="pt-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/ordenes/${pago.ocChina.id}`)}
                >
                  Ver Orden Completa
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Adjuntos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 font-semibold">
              <Paperclip size={18} />
              Archivos Adjuntos ({pago.adjuntos?.length || 0})
            </CardTitle>
            <Button
              onClick={() => setAttachmentsDialogOpen(true)}
              variant="outline"
              className="h-8 gap-2"
            >
              <Paperclip size={16} />
              Agregar Archivos
            </Button>
          </CardHeader>
          <CardContent>
            {!pago.adjuntos || pago.adjuntos.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No hay archivos adjuntos para este pago
              </div>
            ) : (
              <AttachmentsList
                attachments={pago.adjuntos}
                onRename={handleRenameAttachment}
                onDelete={handleDeleteAttachment}
              />
            )}
          </CardContent>
        </Card>

        {/* Sección de Comentarios */}
        <CommentsSection entityType="PagosChina" entityId={pago.id} />
      </div>

      {/* Diálogo para agregar adjuntos */}
      <AddAttachmentsDialog
        open={attachmentsDialogOpen}
        onOpenChange={setAttachmentsDialogOpen}
        module="pagos-china"
        recordId={pago.id}
        recordName={`Pago ${pago.idPago}`}
        currentAttachments={pago.adjuntos || []}
        onSuccess={fetchPago}
      />

      {/* Diálogo para renombrar adjuntos */}
      {fileToRename && (
        <RenameAttachmentModal
          open={renameModalOpen}
          onOpenChange={setRenameModalOpen}
          module="pagos-china"
          recordId={pago.id}
          fileUrl={fileToRename.url}
          currentName={fileToRename.nombre}
          onSuccess={() => {
            fetchPago()
            setFileToRename(null)
          }}
        />
      )}
    </MainLayout>
  )
}
