"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatTimeAgo } from "@/lib/utils"
import { History, Eye } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface UserHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AuditLog {
  id: string
  entidad: string
  entidadId: string
  accion: string
  descripcion: string | null
  usuarioEmail: string | null
  usuarioNombre?: string
  ipAddress: string | null
  cambiosAntes: any
  cambiosDespues: any
  camposModificados: string[]
  createdAt: string
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-purple-100 text-purple-700",
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Creó",
  UPDATE: "Actualizó",
  DELETE: "Eliminó",
  LOGIN: "Inició sesión",
}

export function UserHistoryModal({ open, onOpenChange }: UserHistoryModalProps) {
  const { data: session } = useSession()
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ["user-history", session?.user?.email, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        usuarioEmail: session?.user?.email || "",
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      })
      const res = await fetch(`/api/audit-logs?${params}`)
      if (!res.ok) throw new Error("Error al cargar historial")
      return res.json()
    },
    enabled: open && !!session?.user?.email,
  })

  const logs = data?.data || []
  const total = data?.total || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Mi Historial de Actividad</DialogTitle>
          <DialogDescription>
            Registro de todas las acciones que has realizado en el sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando historial...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No hay actividad registrada</p>
            </div>
          ) : (
            logs.map((log: AuditLog) => (
              <div
                key={log.id}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          ACTION_COLORS[log.accion] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ACTION_LABELS[log.accion] || log.accion}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{log.entidad}</span>
                    </div>

                    {log.descripcion && (
                      <p className="text-sm text-gray-600 mb-1">{log.descripcion}</p>
                    )}

                    {log.camposModificados && log.camposModificados.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Campos modificados:{" "}
                        <span className="font-medium">{log.camposModificados.join(", ")}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {log.usuarioNombre && (
                        <span className="font-medium text-gray-600">Por: {log.usuarioNombre}</span>
                      )}
                      <span>{formatTimeAgo(log.createdAt)}</span>
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    </div>
                  </div>

                  {(log.cambiosAntes || log.cambiosDespues) && (
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedLog(log)}
                      className="flex-shrink-0 h-8 px-2 py-1"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {total > limit && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-9 px-3 py-2"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
                className="h-9 px-3 py-2"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {selectedLog && (
          <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalle de Cambios</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedLog.cambiosAntes && (
                  <div>
                    <h4 className="font-medium mb-2">Antes:</h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedLog.cambiosAntes, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.cambiosDespues && (
                  <div>
                    <h4 className="font-medium mb-2">Después:</h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedLog.cambiosDespues, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
