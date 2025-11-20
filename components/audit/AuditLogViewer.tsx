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
  Calendar,
  User,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  FileText,
  type LucideIcon,
} from "lucide-react"
import { formatTimeAgo } from "@/lib/utils"

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

interface AuditLogViewerProps {
  limit?: number
  showFilters?: boolean
  defaultEntidad?: string
}

// Traducción de acciones
const ACCION_LABELS: Record<string, string> = {
  CREATE: "Creación",
  UPDATE: "Actualización",
  DELETE: "Eliminación",
  RESTORE: "Restauración",
}

// Traducción de entidades
const ENTIDAD_LABELS: Record<string, string> = {
  OCChina: "Órdenes de Compra",
  PagosChina: "Pagos",
  GastosLogisticos: "Gastos Logísticos",
  InventarioRecibido: "Inventario",
  Proveedor: "Proveedores",
  Configuracion: "Configuración",
  ConfiguracionDistribucionCostos: "Config. Distribución",
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  RESTORE: "bg-purple-100 text-purple-700",
}

// Mapeo de iconos lucide-react
const ACTION_ICON_MAP: Record<string, LucideIcon> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  RESTORE: RotateCcw,
}

// Componente para renderizar íconos de acción
function ActionIcon({ accion }: { accion: string }) {
  const IconComponent = ACTION_ICON_MAP[accion] || FileText
  return <IconComponent size={20} className="text-gray-600" />
}

// Función para obtener el label de una acción
function getAccionLabel(accion: string): string {
  return ACCION_LABELS[accion] || accion
}

// Función para obtener el label de una entidad
function getEntidadLabel(entidad: string): string {
  return ENTIDAD_LABELS[entidad] || entidad
}

// Función para formatear campos de forma legible
function formatCampoNombre(campo: string): string {
  // Convertir camelCase a palabras separadas
  const palabras = campo.replace(/([A-Z])/g, " $1").trim()
  // Capitalizar primera letra
  return palabras.charAt(0).toUpperCase() + palabras.slice(1)
}

// Función para formatear valores de forma legible
function formatValor(valor: any): string {
  if (valor === null || valor === undefined) return "N/A"
  if (typeof valor === "boolean") return valor ? "Sí" : "No"
  if (typeof valor === "object") {
    if (Array.isArray(valor)) {
      return `${valor.length} elementos`
    }
    return "Objeto complejo"
  }
  if (typeof valor === "string") {
    // Si es una fecha ISO
    if (/^\d{4}-\d{2}-\d{2}T/.test(valor)) {
      try {
        const fecha = new Date(valor)
        return fecha.toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      } catch {
        return valor
      }
    }
    // Limitar longitud
    return valor.length > 100 ? valor.substring(0, 100) + "..." : valor
  }
  return String(valor)
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
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                placeholder="Buscar por usuario..."
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-sm px-3 py-1.5">
                <Filter size={16} className="mr-2" />
                {getEntidadLabel(entidadFilter) || "Todas las secciones"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setEntidadFilter("")}>
                Todas las secciones
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntidadFilter("OCChina")}>
                Órdenes de Compra
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntidadFilter("PagosChina")}>
                Pagos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntidadFilter("GastosLogisticos")}>
                Gastos Logísticos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEntidadFilter("InventarioRecibido")}>
                Inventario
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
                {getAccionLabel(accionFilter) || "Todas las acciones"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setAccionFilter("")}>
                Todas las acciones
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAccionFilter("CREATE")}>
                Creaciones
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAccionFilter("UPDATE")}>
                Actualizaciones
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAccionFilter("DELETE")}>
                Eliminaciones
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
                  onClick={() => setSelectedLog(log)}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <ActionIcon accion={log.accion} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            ACTION_COLORS[log.accion] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {getAccionLabel(log.accion)}
                        </span>
                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                          {getEntidadLabel(log.entidad)}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {log.descripcion ||
                          `${getAccionLabel(log.accion)} en ${getEntidadLabel(log.entidad)}`}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatTimeAgo(new Date(log.createdAt))}
                        </span>
                        {log.usuarioNombre && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {log.usuarioNombre}
                          </span>
                        )}
                        {log.camposModificados.length > 0 && (
                          <span className="text-blue-600">
                            {log.camposModificados.length} cambios
                          </span>
                        )}
                      </div>
                    </div>
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

      {/* Details Modal - Simplificado */}
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
              <h3 className="font-semibold text-lg">Detalles del Registro</h3>
              <Button variant="ghost" className="px-2 py-1" onClick={() => setSelectedLog(null)}>
                ✕
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Acción</label>
                  <p className="text-sm mt-1 font-medium">{getAccionLabel(selectedLog.accion)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Sección</label>
                  <p className="text-sm mt-1 font-medium">{getEntidadLabel(selectedLog.entidad)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Usuario</label>
                  <p className="text-sm mt-1">{selectedLog.usuarioNombre || "Sistema"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Fecha</label>
                  <p className="text-sm mt-1">
                    {new Date(selectedLog.createdAt).toLocaleString("es-ES", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </p>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Dirección IP</label>
                    <p className="text-sm mt-1">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>

              {/* Cambios realizados */}
              {selectedLog.camposModificados.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-2">
                    Cambios Realizados ({selectedLog.camposModificados.length})
                  </label>
                  <div className="space-y-3 bg-gray-50 p-4 rounded">
                    {selectedLog.camposModificados.map(campo => {
                      const valorAntes = selectedLog.cambiosAntes?.[campo]
                      const valorDespues = selectedLog.cambiosDespues?.[campo]

                      return (
                        <div
                          key={campo}
                          className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0"
                        >
                          <div className="text-xs font-semibold text-gray-700 mb-1">
                            {formatCampoNombre(campo)}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-gray-500 mb-0.5">Antes:</div>
                              <div className="bg-red-50 text-red-700 p-2 rounded">
                                {formatValor(valorAntes)}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-0.5">Después:</div>
                              <div className="bg-green-50 text-green-700 p-2 rounded">
                                {formatValor(valorDespues)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Mensaje para creaciones/eliminaciones */}
              {selectedLog.accion === "CREATE" && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">
                    Se creó un nuevo registro en {getEntidadLabel(selectedLog.entidad)}
                  </p>
                </div>
              )}

              {selectedLog.accion === "DELETE" && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800">
                    Se eliminó un registro de {getEntidadLabel(selectedLog.entidad)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
