"use client"

import { useState, useEffect, useRef } from "react"
import {
  Bell,
  CheckCheck,
  X,
  Zap,
  FileText,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { formatTimeAgo } from "@/lib/utils"
import { useNotifications } from "@/hooks/useNotifications"

// Mapeo de nombres de íconos a componentes lucide-react
const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Zap,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
}

// Componente para renderizar íconos dinámicamente
function NotificationIcon({ iconName }: { iconName: string | null }) {
  if (!iconName) {
    return <Bell size={20} className="text-gray-400" />
  }

  const IconComponent = ICON_MAP[iconName]

  if (IconComponent) {
    return <IconComponent size={20} className="text-gray-600" />
  }

  // Fallback: Si el ícono no está en el mapa (notificaciones antiguas con emojis), mostrar ícono por defecto
  return <FileText size={20} className="text-gray-500" />
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Usar el hook de notificaciones con Pusher
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refetch,
    markAsRead: markAsReadHook,
    markAllAsRead: markAllAsReadHook,
    isRealtimeEnabled,
  } = useNotifications({
    pollingInterval: 30000, // 30 segundos de fallback
  })

  // Marcar notificación como leída y navegar
  const handleNotificationClick = async (id: string, url: string | null) => {
    await markAsReadHook(id)

    // Navegar si hay URL
    if (url) {
      router.push(url)
      setIsOpen(false)
    }
  }

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    await markAllAsReadHook()
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

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(prev => !prev)
    if (!isOpen) {
      refetch()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button con Badge */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
        title={isRealtimeEnabled ? "Notificaciones en tiempo real" : "Notificaciones"}
      >
        <Bell size={20} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {/* Indicador de tiempo real */}
        {isRealtimeEnabled && (
          <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full h-2.5 w-2.5 border-2 border-white"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                {isRealtimeEnabled && (
                  <span
                    className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"
                    title="Actualizaciones en tiempo real activas"
                  >
                    <Zap size={10} />
                    <span>Tiempo real</span>
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">{unreadCount} sin leer</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
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
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <Bell size={32} className="mx-auto mb-2 text-red-300" />
                <p className="text-sm">{error}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Intentar de nuevo
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay notificaciones</p>
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.id, notif.url)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notif.leida ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <NotificationIcon iconName={notif.icono} />
                    </div>
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
          {notifications.length > 0 && (
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
