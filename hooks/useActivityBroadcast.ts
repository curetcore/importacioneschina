"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useUserActivity } from "./useUserActivity"
import { isPusherEnabled } from "@/lib/pusher-client"

/**
 * Hook para broadcast de actividad del usuario actual en tiempo real
 *
 * Envía automáticamente la actividad del usuario cuando cambia de página
 * via Pusher para que otros usuarios vean la actualización en tiempo real.
 *
 * Fase 3 del sistema de user activity tracking.
 */
export function useActivityBroadcast() {
  const { data: session } = useSession()
  const activity = useUserActivity()
  const lastBroadcastRef = useRef<string>("")
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Solo broadcast si hay sesión activa y Pusher está habilitado
    if (!session?.user || !isPusherEnabled()) {
      return
    }

    // Crear un ID único para esta actividad para detectar cambios
    const activityId = `${activity.page}-${activity.pageName}`

    // Si la actividad no ha cambiado, no hacer nada
    if (activityId === lastBroadcastRef.current) {
      return
    }

    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Throttle: esperar 1 segundo antes de broadcast para evitar spam
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/user/activity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(activity),
        })

        if (response.ok) {
          lastBroadcastRef.current = activityId
          console.log(`✅ [Activity Broadcast] Sent: ${activity.pageIcon} ${activity.pageName}`)
        } else {
          console.warn("⚠️ [Activity Broadcast] Failed to send activity")
        }
      } catch (error) {
        console.error("❌ [Activity Broadcast] Error:", error)
      }
    }, 1000) // 1 segundo de throttle

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [activity, session?.user])
}
