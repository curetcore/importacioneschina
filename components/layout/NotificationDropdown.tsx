"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, CheckCheck, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatTimeAgo } from "@/lib/utils"
import { getPusherClient } from "@/lib/pusher-client"

interface Notification {
  id: string
  tipo: string
  titulo: string
  descripcion: string | null
  icono: string | null
  url: string | null
  leida: boolean
  createdAt: string
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch notificaciones
  const fetchNotificaciones = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notificaciones?limit=10")
      const data = await response.json()

      if (data.success) {
        setNotificaciones(data.data)
        setUnreadCount(data.totalUnread)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  // Marcar notificación como leída
  const markAsRead = async (id: string, url: string | null) => {
    try {
      await fetch(`/api/notificaciones/${id}`, {
        method: "PUT",
      })

      // Actualizar estado local
      setNotificaciones(prev => prev.map(n => (n.id === id ? { ...n, leida: true } : n)))
      setUnreadCount(prev => Math.max(0, prev - 1))

      // Navegar si hay URL
      if (url) {
        router.push(url)
        setIsOpen(false)
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
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

      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Fetch inicial y suscripción a Pusher para notificaciones en tiempo real
  useEffect(() => {
    fetchNotificaciones()

    // Suscribirse a Pusher para notificaciones en tiempo real
    const pusher = getPusherClient()
    const channel = pusher.subscribe("notifications")

    // Escuchar nuevas notificaciones
    channel.bind("new-notification", (data: { notification: Notification }) => {
      console.log("Nueva notificación recibida:", data.notification)

      // Agregar al inicio de la lista
      setNotificaciones(prev => [data.notification, ...prev])

      // Incrementar contador de no leídas
      setUnreadCount(prev => prev + 1)
    })

    // Polling como fallback cada 2 minutos (por si falla Pusher)
    const interval = setInterval(fetchNotificaciones, 120000) // 2 minutos

    return () => {
      clearInterval(interval)
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [])

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(prev => !prev)
    if (!isOpen) {
      fetchNotificaciones()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button con Badge */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              {unreadCount > 0 && <p className="text-xs text-gray-500">{unreadCount} sin leer</p>}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck size={14} />
                  Marcar todas
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Cargando...</p>
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay notificaciones</p>
              </div>
            ) : (
              notificaciones.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => markAsRead(notif.id, notif.url)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notif.leida ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{notif.icono || "📬"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm ${
                            !notif.leida ? "font-semibold text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {notif.titulo}
                        </p>
                        {!notif.leida && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      {notif.descripcion && (
                        <p className="text-xs text-gray-500 mt-0.5">{notif.descripcion}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(new Date(notif.createdAt))}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notificaciones.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  router.push("/notificaciones")
                  setIsOpen(false)
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
