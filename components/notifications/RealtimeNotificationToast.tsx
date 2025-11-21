"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { usePusher } from "@/hooks/usePusher"
import { toast } from "sonner"
import { Bell, FileText, AlertTriangle, XCircle, CheckCircle } from "lucide-react"

/**
 * Componente que escucha notificaciones en tiempo real via Pusher
 * y muestra toasts flotantes cuando llegan nuevas notificaciones
 */
export function RealtimeNotificationToast() {
  const pusher = usePusher()
  const router = useRouter()
  const lastNotificationIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pusher) {
      // console.log("📡 [RealtimeToast] Pusher not available, skipping toast notifications")
      return
    }

    // console.log("🚀 [RealtimeToast] Setting up realtime notification toasts")

    // Suscribirse al canal de notificaciones global
    const channel = pusher.subscribe("notifications")

    const handleNewNotification = (data: any) => {
      // console.log("📬 [RealtimeToast] New notification received:", data)

      // Prevenir duplicados (por si acaso)
      if (lastNotificationIdRef.current === data.id) {
        // console.log("⚠️ [RealtimeToast] Duplicate notification, skipping")
        return
      }

      lastNotificationIdRef.current = data.id

      // Mapear iconos de Lucide según el tipo
      const iconMap: Record<string, any> = {
        audit: FileText,
        alert: AlertTriangle,
        error: XCircle,
        success: CheckCircle,
        warning: AlertTriangle,
      }

      const Icon = iconMap[data.tipo] || Bell

      // Mostrar toast flotante
      toast(data.titulo, {
        description: data.descripcion || "Nueva actividad en el sistema",
        icon: <Icon className="h-5 w-5 text-blue-600" />,
        duration: 5000,
        action: data.url
          ? {
              label: "Ver",
              onClick: () => {
                // console.log("🔗 [RealtimeToast] Navigating to:", data.url)
                router.push(data.url)
              },
            }
          : undefined,
      })

      // console.log("✅ [RealtimeToast] Toast displayed successfully")
    }

    // Escuchar evento de nueva notificación
    channel.bind("new-notification", handleNewNotification)
    // console.log("✅ [RealtimeToast] Bound to 'new-notification' event")

    // Cleanup
    return () => {
      // console.log("📤 [RealtimeToast] Cleaning up realtime notification toasts")
      channel.unbind("new-notification", handleNewNotification)
      pusher.unsubscribe("notifications")
    }
  }, [pusher, router])

  // Este componente no renderiza nada visible
  return null
}
