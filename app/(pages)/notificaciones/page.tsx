"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { formatTimeAgo } from "@/lib/utils"
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Inbox,
  Mail,
  MailOpen,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Notification {
  id: string
  tipo: string
  titulo: string
  descripcion: string | null
  icono: string | null
  url: string | null
  leida: boolean
  createdAt: string
  entidad: string | null
  entidadId: string | null
  prioridad: string
  auditLogId: string | null
}

interface AuditLog {
  id: string
  entidad: string
  entidadId: string
  accion: string
  cambiosAntes: any
  cambiosDespues: any
  camposModificados: string[]
  usuarioEmail: string | null
  createdAt: string
  descripcion: string | null
}

export default function NotificacionesPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [auditDetails, setAuditDetails] = useState<AuditLog | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Fetch notificaciones
  const { data: notificaciones = [], isLoading } = useQuery({
    queryKey: ["notificaciones", filter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set("limit", "100")
      if (filter === "unread") {
        params.set("unread", "true")
      }

      const response = await fetch(`/api/notificaciones?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al cargar notificaciones")
      }

      let notifs = result.data || []

      // Client-side filter for read notifications
      if (filter === "read") {
        notifs = notifs.filter((n: Notification) => n.leida)
      }

      return notifs
    },
  })

  // Marcar como leída
  const markAsRead = async (id: string, url: string | null) => {
    try {
      console.log("🔔 Marcando notificación como leída:", { id, url })

      await fetch(`/api/notificaciones/${id}`, {
        method: "PUT",
      })

      queryClient.invalidateQueries({ queryKey: ["notificaciones"] })

      if (url) {
        console.log("🔔 Navegando a:", url)
        router.push(url)
      } else {
        console.log("🔔 No hay URL para navegar")
      }
    } catch (error) {
      console.error("🔔 Error:", error)
      addToast({
        type: "error",
        title: "Error al marcar notificación como leída",
      })
    }
  }

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notificaciones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      queryClient.invalidateQueries({ queryKey: ["notificaciones"] })

      addToast({
        type: "success",
        title: "Todas las notificaciones marcadas como leídas",
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Error al marcar todas como leídas",
      })
    }
  }

  const unreadCount = notificaciones.filter((n: Notification) => !n.leida).length

  // Ver detalles de la notificación
  const viewDetails = async (notif: Notification) => {
    setSelectedNotification(notif)

    if (!notif.auditLogId) {
      // Si no tiene audit log, solo mostrar la notificación básica
      setAuditDetails(null)
      return
    }

    // Cargar detalles del audit log
    setLoadingDetails(true)
    try {
      const response = await fetch(`/api/audit-logs/${notif.auditLogId}`)
      const result = await response.json()

      if (result.success) {
        setAuditDetails(result.data)
      }
    } catch (error) {
      console.error("Error loading audit details:", error)
    } finally {
      setLoadingDetails(false)
    }

    // Marcar como leída
    markAsRead(notif.id, null)
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell size={28} />
              Notificaciones
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} sin leer` : "No hay notificaciones sin leer"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-sm">
                  <Filter size={16} className="mr-2" />
                  {filter === "all" ? "Todas" : filter === "unread" ? "Sin leer" : "Leídas"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  <Inbox size={16} className="mr-2" />
                  Todas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("unread")}>
                  <Mail size={16} className="mr-2" />
                  Sin leer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("read")}>
                  <MailOpen size={16} className="mr-2" />
                  Leídas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" className="text-sm">
                <CheckCheck size={16} className="mr-2" />
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </div>

        {/* Notificaciones List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filter === "all"
                ? "Todas las notificaciones"
                : filter === "unread"
                  ? "Notificaciones sin leer"
                  : "Notificaciones leídas"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-500">Cargando notificaciones...</p>
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  {filter === "unread"
                    ? "No hay notificaciones sin leer"
                    : filter === "read"
                      ? "No hay notificaciones leídas"
                      : "No hay notificaciones"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notificaciones.map((notif: Notification) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notif.leida ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{notif.icono || "📬"}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={`text-sm font-medium ${
                                  !notif.leida ? "text-gray-900" : "text-gray-700"
                                }`}
                              >
                                {notif.titulo}
                              </h3>
                              {!notif.leida && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                              )}
                            </div>
                            {notif.descripcion && (
                              <p className="text-sm text-gray-600 mb-2">{notif.descripcion}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{formatTimeAgo(new Date(notif.createdAt))}</span>
                              {notif.tipo && (
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                                  {notif.tipo}
                                </span>
                              )}
                              {notif.prioridad && notif.prioridad !== "normal" && (
                                <span
                                  className={`px-2 py-0.5 rounded ${
                                    notif.prioridad === "high" || notif.prioridad === "urgent"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {notif.prioridad}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!notif.leida && (
                              <Button
                                onClick={() => markAsRead(notif.id, null)}
                                variant="ghost"
                                className="text-sm"
                                title="Marcar como leída"
                              >
                                <Check size={16} />
                              </Button>
                            )}
                            <Button
                              onClick={() => viewDetails(notif)}
                              variant="outline"
                              className="text-sm"
                            >
                              Ver detalles
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalles */}
        {selectedNotification && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setSelectedNotification(null)
              setAuditDetails(null)
            }}
          >
            <div
              className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedNotification.icono || "📬"}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedNotification.titulo}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatTimeAgo(new Date(selectedNotification.createdAt))}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="px-2 py-1"
                  onClick={() => {
                    setSelectedNotification(null)
                    setAuditDetails(null)
                  }}
                >
                  ✕
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {loadingDetails ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">Cargando detalles...</p>
                  </div>
                ) : auditDetails ? (
                  <>
                    {/* Información básica */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Acción
                        </label>
                        <p className="text-sm font-medium mt-1">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              auditDetails.accion === "CREATE"
                                ? "bg-green-100 text-green-700"
                                : auditDetails.accion === "UPDATE"
                                  ? "bg-blue-100 text-blue-700"
                                  : auditDetails.accion === "DELETE"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {auditDetails.accion === "CREATE"
                              ? "Creación"
                              : auditDetails.accion === "UPDATE"
                                ? "Modificación"
                                : auditDetails.accion === "DELETE"
                                  ? "Eliminación"
                                  : auditDetails.accion}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Usuario
                        </label>
                        <p className="text-sm mt-1">{auditDetails.usuarioEmail || "Sistema"}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Módulo
                        </label>
                        <p className="text-sm mt-1">
                          {auditDetails.entidad === "OCChina"
                            ? "Órdenes de Compra"
                            : auditDetails.entidad === "PagosChina"
                              ? "Pagos a China"
                              : auditDetails.entidad === "GastosLogisticos"
                                ? "Gastos Logísticos"
                                : auditDetails.entidad === "InventarioRecibido"
                                  ? "Inventario Recibido"
                                  : auditDetails.entidad}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Fecha y Hora
                        </label>
                        <p className="text-sm mt-1">
                          {new Date(auditDetails.createdAt).toLocaleString("es-DO", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Descripción */}
                    {auditDetails.descripcion && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Descripción
                        </label>
                        <p className="text-sm mt-2 p-3 bg-gray-50 rounded-lg">
                          {auditDetails.descripcion}
                        </p>
                      </div>
                    )}

                    {/* Campos Modificados (solo para UPDATE) */}
                    {auditDetails.accion === "UPDATE" &&
                      auditDetails.camposModificados &&
                      auditDetails.camposModificados.length > 0 && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase mb-3 block">
                            Campos Modificados
                          </label>
                          <div className="space-y-3">
                            {auditDetails.camposModificados.map(campo => (
                              <div
                                key={campo}
                                className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                              >
                                <div className="font-medium text-sm text-gray-900 mb-2">
                                  {campo}
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <span className="text-gray-500">Antes:</span>
                                    <p className="mt-1 font-mono text-red-600">
                                      {JSON.stringify(
                                        auditDetails.cambiosAntes?.[campo],
                                        null,
                                        2
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Después:</span>
                                    <p className="mt-1 font-mono text-green-600">
                                      {JSON.stringify(
                                        auditDetails.cambiosDespues?.[campo],
                                        null,
                                        2
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Datos Completos (para CREATE y DELETE) */}
                    {(auditDetails.accion === "CREATE" || auditDetails.accion === "DELETE") && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase mb-3 block">
                          {auditDetails.accion === "CREATE"
                            ? "Datos Creados"
                            : "Datos Eliminados"}
                        </label>
                        <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                          {JSON.stringify(
                            auditDetails.accion === "CREATE"
                              ? auditDetails.cambiosDespues
                              : auditDetails.cambiosAntes,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}

                    {/* Botón para ir al módulo */}
                    {selectedNotification.url && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => {
                            router.push(selectedNotification.url!)
                            setSelectedNotification(null)
                            setAuditDetails(null)
                          }}
                          className="w-full"
                        >
                          Ir al módulo →
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{selectedNotification.descripcion}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
