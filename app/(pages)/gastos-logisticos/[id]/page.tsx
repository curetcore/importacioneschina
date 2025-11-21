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

interface GastoDetail {
  id: string
  idGasto: string
  fechaGasto: string
  tipoGasto: string
  proveedorServicio: string | null
  metodoPago: string
  montoRD: number
  notas: string | null
  adjuntos?: FileAttachment[]
  ordenesCompra: Array<{
    ocChina: {
      id: string
      oc: string
      proveedor: string
      fechaOC: string
      categoriaPrincipal: string
    }
  }>
}

export default function GastoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [gasto, setGasto] = useState<GastoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [fileToRename, setFileToRename] = useState<FileAttachment | null>(null)

  const fetchGasto = () => {
    if (params.id) {
      setLoading(true)
      fetch(`/api/gastos-logisticos/${params.id}`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setGasto(result.data)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }

  useEffect(() => {
    fetchGasto()
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
        `/api/gastos-logisticos/${gasto?.id}/attachments?fileUrl=${encodeURIComponent(file.url)}`,
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
      fetchGasto()
    } catch (error) {
      showToast.error("Error al eliminar", {
        description: "No se pudo eliminar el adjunto",
      })
    }
  }

  const { editingUsers } = useEditingPresence({
    resourceType: "expense",
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

  if (!gasto) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-sm text-gray-500">
          No se encontró el gasto logístico
        </div>
      </MainLayout>
    )
  }

  const numOCs = gasto.ordenesCompra?.length || 0

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-shopify-border-subdued pb-6 mb-2">
          <div>
            <Button
              variant="plain"
              onClick={() => router.push("/gastos-logisticos")}
              className="mb-3 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Gastos
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-shopify-text">Gasto #{gasto.idGasto}</h1>
              <p className="text-sm text-shopify-text-subdued mt-1">
                {formatDate(gasto.fechaGasto)} | {gasto.tipoGasto} | {gasto.metodoPago}
              </p>
              {gasto.proveedorServicio && (
                <p className="text-sm text-shopify-text-subdued mt-0.5 font-medium">
                  {gasto.proveedorServicio}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/gastos-logisticos?edit=${gasto.id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="critical"
              size="sm"
              onClick={() => router.push(`/gastos-logisticos?delete=${gasto.id}`)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        <EditingBanner editingUsers={editingUsers} />

        {/* Información del Gasto */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold">Información del Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500">Monto</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(gasto.montoRD)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Tipo de Gasto</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">{gasto.tipoGasto}</div>
              </div>
              {gasto.proveedorServicio && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Proveedor de Servicio</div>
                  <div className="text-lg text-gray-900 mt-1">{gasto.proveedorServicio}</div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-500">Método de Pago</div>
                <div className="text-lg text-gray-900 mt-1">{gasto.metodoPago}</div>
              </div>
              {gasto.notas && (
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-gray-500">Notas</div>
                  <div className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-md">
                    {gasto.notas}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Órdenes de Compra Asociadas */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold">
              Órdenes de Compra Asociadas ({numOCs})
              {numOCs > 1 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Gasto compartido entre {numOCs} OCs)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {numOCs === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No hay órdenes de compra asociadas
              </div>
            ) : (
              <div className="space-y-4">
                {gasto.ordenesCompra.map((orden, index) => (
                  <div
                    key={orden.ocChina.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900">
                            {orden.ocChina.oc}
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                            {orden.ocChina.categoriaPrincipal}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{orden.ocChina.proveedor}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(orden.ocChina.fechaOC)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/ordenes/${orden.ocChina.id}`)}
                      >
                        Ver Orden
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección de Adjuntos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 font-semibold">
              <Paperclip size={18} />
              Archivos Adjuntos ({gasto.adjuntos?.length || 0})
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
            {!gasto.adjuntos || gasto.adjuntos.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No hay archivos adjuntos para este gasto
              </div>
            ) : (
              <AttachmentsList
                attachments={gasto.adjuntos}
                onRename={handleRenameAttachment}
                onDelete={handleDeleteAttachment}
              />
            )}
          </CardContent>
        </Card>

        {/* Sección de Comentarios */}
        <CommentsSection entityType="GastosLogisticos" entityId={gasto.id} />
      </div>

      {/* Diálogo para agregar adjuntos */}
      <AddAttachmentsDialog
        open={attachmentsDialogOpen}
        onOpenChange={setAttachmentsDialogOpen}
        module="gastos-logisticos"
        recordId={gasto.id}
        recordName={`Gasto ${gasto.idGasto}`}
        currentAttachments={gasto.adjuntos || []}
        onSuccess={fetchGasto}
      />

      {/* Diálogo para renombrar adjuntos */}
      {fileToRename && (
        <RenameAttachmentModal
          open={renameModalOpen}
          onOpenChange={setRenameModalOpen}
          module="gastos-logisticos"
          recordId={gasto.id}
          fileUrl={fileToRename.url}
          currentName={fileToRename.nombre}
          onSuccess={() => {
            fetchGasto()
            setFileToRename(null)
          }}
        />
      )}
    </MainLayout>
  )
}
