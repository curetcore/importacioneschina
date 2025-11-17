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
}

export default function NotificacionesPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

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
      await fetch(`/api/notificaciones/${id}`, {
        method: "PUT",
      })

      queryClient.invalidateQueries({ queryKey: ["notificaciones"] })

      if (url) {
        router.push(url)
      }
    } catch (error) {
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
                            {notif.url && (
                              <Button
                                onClick={() => markAsRead(notif.id, notif.url)}
                                variant="outline"
                                className="text-sm"
                              >
                                Ver detalles
                              </Button>
                            )}
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
      </div>
    </MainLayout>
  )
}
