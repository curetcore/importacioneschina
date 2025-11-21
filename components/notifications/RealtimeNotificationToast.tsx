"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { usePusher } from "@/hooks/usePusher"
import { toast } from "sonner"
import { Bell, FileText, AlertTriangle, XCircle, CheckCircle } from "lucide-react"

/**
 * Componente que escucha notificaciones en tiempo real via Pusher
 * y muestra toasts flotantes cuando llegan nuevas notificaciones
 *
 * Escucha 2 canales:
 * 1. "notifications" → Notificaciones persistentes del usuario (comentarios, menciones)
 * 2. "activity-feed" → Activity feed efímero (acciones de audit de todos los usuarios)
 */
export function RealtimeNotificationToast() {
  const pusher = usePusher()
  const router = useRouter()
  const lastNotificationIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pusher) {
      return
    }

    // Mapear iconos de Lucide según el tipo
    const iconMap: Record<string, any> = {
      audit: FileText,
      alert: AlertTriangle,
      error: XCircle,
      success: CheckCircle,
      warning: AlertTriangle,
    }

    // =========================================
    // CANAL 1: Notificaciones Persistentes
    // =========================================
    // Para notificaciones que requieren acción (comentarios, menciones, replies)
    const notificationsChannel = pusher.subscribe("notifications")

    const handleNewNotification = (data: any) => {
      // Prevenir duplicados
      if (lastNotificationIdRef.current === data.id) {
        return
      }

      lastNotificationIdRef.current = data.id

      const Icon = iconMap[data.tipo] || Bell

      // Toast con estilo de notificación importante
      toast(data.titulo, {
        description: data.descripcion || "Nueva actividad en el sistema",
        icon: <Icon className="h-5 w-5 text-blue-600" />,
        duration: 5000,
        action: data.url
          ? {
              label: "Ver",
              onClick: () => {
                router.push(data.url)
              },
            }
          : undefined,
      })
    }

    notificationsChannel.bind("new-notification", handleNewNotification)

    // =========================================
    // CANAL 2: Activity Feed (Toasts Efímeros)
    // =========================================
    // Para awareness de lo que otros usuarios están haciendo (audit logs)
    const activityChannel = pusher.subscribe("activity-feed")

    const handleActivityUpdate = (data: any) => {
      // Prevenir duplicados
      if (lastNotificationIdRef.current === data.id) {
        return
      }

      lastNotificationIdRef.current = data.id

      const Icon = iconMap[data.tipo] || Bell

      // Toast más discreto, se auto-cierra rápido
      toast(data.titulo, {
        description: data.descripcion || "Actividad reciente",
        icon: <Icon className="h-4 w-4 text-gray-500" />,
        duration: 3000, // 3 segundos (más corto que notificaciones)
        action: data.url
          ? {
              label: "Ver",
              onClick: () => {
                router.push(data.url)
              },
            }
          : undefined,
      })
    }

    activityChannel.bind("activity-update", handleActivityUpdate)

    // Cleanup
    return () => {
      notificationsChannel.unbind("new-notification", handleNewNotification)
      activityChannel.unbind("activity-update", handleActivityUpdate)
      pusher.unsubscribe("notifications")
      pusher.unsubscribe("activity-feed")
    }
  }, [pusher, router])

  // Este componente no renderiza nada visible
  return null
}
