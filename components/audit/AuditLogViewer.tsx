"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  History,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  User,
  Database,
} from "lucide-react"
import { formatTimeAgo } from "@/lib/utils"

interface AuditLog {
  id: string
  entidad: string
  entidadId: string
  accion: string
  descripcion: string | null
  usuarioEmail: string | null
  ipAddress: string | null
  cambiosAntes: any
  cambiosDespues: any
  camposModificados: string[]
  createdAt: string
}

interface AuditLogViewerProps {
  limit?: number
  showFilters?: boolean
  defaultEntidad?: string
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  RESTORE: "bg-purple-100 text-purple-700",
}

const ACTION_ICONS: Record<string, string> = {
  CREATE: "➕",
  UPDATE: "✏️",
  DELETE: "🗑️",
  RESTORE: "♻️",
}

export function AuditLogViewer({
  limit = 20,
  showFilters = true,
  defaultEntidad,
}: AuditLogViewerProps) {
  const [page, setPage] = useState(0)
  const [entidadFilter, setEntidadFilter] = useState(defaultEntidad || "")
  const [accionFilter, setAccionFilter] = useState("")
  const [searchEmail, setSearchEmail] = useState("")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  // Fetch audit logs
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", page, entidadFilter, accionFilter, searchEmail],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set("limit", limit.toString())
      params.set("offset", (page * limit).toString())
      if (entidadFilter) params.set("entidad", entidadFilter)
      if (accionFilter) params.set("accion", accionFilter)
      if (searchEmail) params.set("usuarioEmail", searchEmail)

      const response = await fetch(`/api/audit-logs?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al cargar audit logs")
      }

      return result
    },
  })

  const logs: AuditLog[] = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [entidadFilter, accionFilter, searchEmail])

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Buscar por email..."
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-sm px-3 py-1.5">
                <Database size={16} className="mr-2" />
                {entidadFilter || "Todas las entidades"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setEntidadFilter("")}>
                Todas las entidades
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntidadFilter("OCChina")}>
                Órdenes de Compra
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntidadFilter("PagosChina")}>
                Pagos China
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntidadFilter("GastosLogisticos")}>
                Gastos Logísticos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntidadFilter("InventarioRecibido")}>
                Inventario Recibido
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntidadFilter("Proveedor")}>
                Proveedores
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-sm px-3 py-1.5">
                <Filter size={16} className="mr-2" />
                {accionFilter || "Todas las acciones"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setAccionFilter("")}>
                Todas las acciones
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAccionFilter("CREATE")}>
                ➕ Creaciones
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAccionFilter("UPDATE")}>
                ✏️ Actualizaciones
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAccionFilter("DELETE")}>
                🗑️ Eliminaciones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Logs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History size={20} />
              Historial de Auditoría
            </CardTitle>
            <span className="text-sm text-gray-500">{total} registros totales</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Cargando...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <History size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No hay registros de auditoría</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Icon */}
                      <span className="text-xl flex-shrink-0">
                        {ACTION_ICONS[log.accion] || "📝"}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              ACTION_COLORS[log.accion] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {log.accion}
                          </span>
                          <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                            {log.entidad}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {log.descripcion || `${log.accion} en ${log.entidad}`}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatTimeAgo(new Date(log.createdAt))}
                          </span>
                          {log.usuarioEmail && (
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              {log.usuarioEmail}
                            </span>
                          )}
                          {log.camposModificados.length > 0 && (
                            <span className="text-blue-600">
                              {log.camposModificados.length} campos modificados
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <Button
                      variant="ghost"
                      className="text-sm px-2 py-1"
                      onClick={() => setSelectedLog(log)}
                      title="Ver detalles"
                    >
                      <Eye size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-gray-500">
                Página {page + 1} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="text-sm px-3 py-1.5"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft size={16} />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  className="text-sm px-3 py-1.5"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Siguiente
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Detalles del Audit Log</h3>
              <Button variant="ghost" className="px-2 py-1" onClick={() => setSelectedLog(null)}>
                ✕
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Acción</label>
                  <p className="text-sm mt-1">{selectedLog.accion}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Entidad</label>
                  <p className="text-sm mt-1">{selectedLog.entidad}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Usuario</label>
                  <p className="text-sm mt-1">{selectedLog.usuarioEmail || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Fecha</label>
                  <p className="text-sm mt-1">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">IP</label>
                    <p className="text-sm mt-1">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>

              {/* Modified Fields */}
              {selectedLog.camposModificados.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Campos Modificados</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedLog.camposModificados.map(field => (
                      <span
                        key={field}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Changes Before/After */}
              {(selectedLog.cambiosAntes || selectedLog.cambiosDespues) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.cambiosAntes && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Antes</label>
                      <pre className="text-xs bg-gray-50 p-3 rounded mt-2 overflow-auto max-h-60">
                        {JSON.stringify(selectedLog.cambiosAntes, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.cambiosDespues && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Después</label>
                      <pre className="text-xs bg-gray-50 p-3 rounded mt-2 overflow-auto max-h-60">
                        {JSON.stringify(selectedLog.cambiosDespues, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
