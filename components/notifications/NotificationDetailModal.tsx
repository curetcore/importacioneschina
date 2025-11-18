"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, Clock, User, FileText, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatTimeAgo } from "@/lib/utils"
import { TranslatedChange } from "@/lib/audit-translator"

interface NotificationDetail {
  id: string
  tipo: string
  titulo: string
  descripcion: string | null
  icono: string | null
  url: string | null
  createdAt: string
  auditLog: {
    id: string
    entidad: string
    accion: string
    usuarioEmail: string | null
    createdAt: string
    descripcion: string | null
    cambios: TranslatedChange[]
    actionPhrase: string
    userName: string | null
  } | null
}

interface NotificationDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notificationId: string | null
}

export function NotificationDetailModal({
  open,
  onOpenChange,
  notificationId,
}: NotificationDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<NotificationDetail | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (open && notificationId) {
      fetchDetail()
    }
  }, [open, notificationId])

  const fetchDetail = async () => {
    if (!notificationId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/notificaciones/${notificationId}/detail`)
      const data = await response.json()

      if (data.success) {
        setDetail(data.data)
      }
    } catch (error) {
      console.error("Error fetching notification detail:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToEntity = () => {
    if (detail?.url) {
      router.push(detail.url)
      onOpenChange(false)
    }
  }

  const getActionColor = (accion: string) => {
    switch (accion) {
      case "CREATE":
        return "text-green-700 bg-green-50"
      case "UPDATE":
        return "text-blue-700 bg-blue-50"
      case "DELETE":
        return "text-red-700 bg-red-50"
      case "RESTORE":
        return "text-purple-700 bg-purple-50"
      default:
        return "text-gray-700 bg-gray-50"
    }
  }

  const getActionLabel = (accion: string) => {
    const labels: Record<string, string> = {
      CREATE: "Creación",
      UPDATE: "Modificación",
      DELETE: "Eliminación",
      RESTORE: "Restauración",
    }
    return labels[accion] || accion
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            {detail?.icono && <span className="text-2xl">{detail.icono}</span>}
            <span>Detalles de la notificación</span>
          </DialogTitle>
          <DialogDescription>Información completa sobre esta acción</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : detail ? (
          <div className="space-y-6 px-6 pb-6">
            {/* Header con acción */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{detail.titulo}</h3>
                  {detail.descripcion && (
                    <p className="text-sm text-gray-600 mt-1">{detail.descripcion}</p>
                  )}
                </div>
                {detail.auditLog && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(detail.auditLog.accion)}`}
                  >
                    {getActionLabel(detail.auditLog.accion)}
                  </span>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {detail.auditLog?.userName && (
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-gray-400" />
                    <span>{detail.auditLog.userName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-gray-400" />
                  <span>{formatTimeAgo(new Date(detail.createdAt))}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Cambios realizados */}
            {detail.auditLog && detail.auditLog.cambios.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={16} className="text-gray-600" />
                  Cambios realizados
                </h4>

                <div className="space-y-2">
                  {detail.auditLog.cambios.map((change, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-700 mb-1.5">{change.label}</div>

                      {detail.auditLog?.accion === "CREATE" && (
                        <div className="text-sm text-gray-600">
                          Se estableció como:{" "}
                          <span className="font-semibold text-green-700">{change.after}</span>
                        </div>
                      )}

                      {detail.auditLog?.accion === "DELETE" && (
                        <div className="text-sm text-gray-600">
                          Valor anterior:{" "}
                          <span className="font-semibold text-red-700 line-through">
                            {change.before}
                          </span>
                        </div>
                      )}

                      {detail.auditLog?.accion === "UPDATE" && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-red-600 line-through">{change.before}</span>
                          <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-green-600 font-semibold">{change.after}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Descripción adicional del audit log */}
            {detail.auditLog?.descripcion && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-sm text-blue-900">{detail.auditLog.descripcion}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              {detail.url && (
                <Button onClick={handleGoToEntity} className="gap-2">
                  <span>Ir al registro</span>
                  <ExternalLink size={16} />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No se pudieron cargar los detalles</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
