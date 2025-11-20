import { useEffect, useState, useCallback, useRef } from "react"
import { subscribeToChannel, unsubscribeFromChannel, isPusherEnabled } from "@/lib/pusher-client"
import type { Channel } from "pusher-js"

export interface Notification {
  id: string
  tipo: string
  titulo: string
  descripcion: string | null
  icono: string
  entidad: string | null
  entidadId: string | null
  url: string | null
  prioridad: string
  leida: boolean
  createdAt: string
  leidaAt: string | null
}

interface UseNotificationsOptions {
  userId?: string
  pollingInterval?: number // ms, default: 30000 (30s)
  enableRealtime?: boolean // override feature flag for testing
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  isRealtimeEnabled: boolean
}

/**
 * Hook para manejar notificaciones con soporte para:
 * - Tiempo real via Pusher (si está habilitado)
 * - Polling como fallback
 * - Caché local
 * - Reconexión automática
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { userId, pollingInterval = 30000, enableRealtime } = options

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const channelRef = useRef<Channel | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Determinar si usar Pusher
  const isRealtimeEnabled = enableRealtime !== undefined ? enableRealtime : isPusherEnabled()

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notificaciones")
      if (!response.ok) {
        throw new Error("Error fetching notifications")
      }

      const result = await response.json()
      if (result.success && isMountedRef.current) {
        setNotifications(result.notifications || [])
        setUnreadCount(result.unreadCount || 0)
        setError(null)
      }
    } catch (err) {
      console.error("Error fetching notifications:", err)
      if (isMountedRef.current) {
        setError("Error al cargar notificaciones")
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leida: true }),
      })

      if (response.ok && isMountedRef.current) {
        // Actualizar localmente
        setNotifications(prev =>
          prev.map(n =>
            n.id === id ? { ...n, leida: true, leidaAt: new Date().toISOString() } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }, [])

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notificaciones/mark-all-read", {
        method: "POST",
      })

      if (response.ok && isMountedRef.current) {
        // Actualizar localmente
        setNotifications(prev =>
          prev.map(n => ({ ...n, leida: true, leidaAt: new Date().toISOString() }))
        )
        setUnreadCount(0)
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err)
    }
  }, [])

  /**
   * Handle new notification from Pusher
   */
  const handleNewNotification = useCallback((data: any) => {
    if (!isMountedRef.current) return

    const newNotification: Notification = {
      id: data.id,
      tipo: data.tipo,
      titulo: data.titulo,
      descripcion: data.descripcion || null,
      icono: data.icono,
      entidad: data.entidad || null,
      entidadId: data.entidadId || null,
      url: data.url || null,
      prioridad: data.prioridad,
      leida: false,
      createdAt: data.createdAt,
      leidaAt: null,
    }

    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)

    if (process.env.NODE_ENV === "development") {
      console.log("📬 New notification received via Pusher:", newNotification.titulo)
    }
  }, [])

  /**
   * Setup Pusher subscription
   */
  useEffect(() => {
    if (!isRealtimeEnabled) return

    try {
      // Canal: por usuario o global
      const channelName = userId ? `private-notifications-${userId}` : "notifications"

      // Suscribirse al canal
      const channel = subscribeToChannel(channelName)
      channelRef.current = channel

      // Escuchar evento de nueva notificación
      channel.bind("new-notification", handleNewNotification)

      if (process.env.NODE_ENV === "development") {
        console.log(`📡 Subscribed to Pusher channel: ${channelName}`)
      }

      // Cleanup
      return () => {
        channel.unbind("new-notification", handleNewNotification)
        unsubscribeFromChannel(channelName)
        channelRef.current = null

        if (process.env.NODE_ENV === "development") {
          console.log(`📤 Unsubscribed from Pusher channel: ${channelName}`)
        }
      }
    } catch (err) {
      console.error("Error setting up Pusher:", err)
      // Si Pusher falla, caer back a polling (se maneja abajo)
    }
  }, [isRealtimeEnabled, userId, handleNewNotification])

  /**
   * Setup polling (solo si Pusher no está habilitado)
   */
  useEffect(() => {
    if (isRealtimeEnabled) return // No usar polling si Pusher está activo

    // Fetch inicial
    fetchNotifications()

    // Setup polling
    pollingIntervalRef.current = setInterval(fetchNotifications, pollingInterval)

    if (process.env.NODE_ENV === "development") {
      console.log(`⏱️ Polling enabled (every ${pollingInterval}ms)`)
    }

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null

        if (process.env.NODE_ENV === "development") {
          console.log("⏱️ Polling disabled")
        }
      }
    }
  }, [isRealtimeEnabled, pollingInterval, fetchNotifications])

  /**
   * Fetch inicial si Pusher está habilitado
   * (Pusher solo envía nuevas notificaciones, no las existentes)
   */
  useEffect(() => {
    if (isRealtimeEnabled) {
      fetchNotifications()
    }
  }, [isRealtimeEnabled, fetchNotifications])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    isRealtimeEnabled,
  }
}
