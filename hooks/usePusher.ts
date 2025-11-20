import { useEffect, useState } from "react"
import { getPusherClient, isPusherEnabled } from "@/lib/pusher-client"
import type PusherClient from "pusher-js"

/**
 * Hook para usar Pusher en componentes React
 * Maneja la inicialización y limpieza del cliente de Pusher
 *
 * @returns Instancia del cliente de Pusher o null si está deshabilitado
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const pusher = usePusher()
 *
 *   useEffect(() => {
 *     if (!pusher) return
 *
 *     const channel = pusher.subscribe('my-channel')
 *     channel.bind('my-event', (data) => {
 *       console.log('Event received:', data)
 *     })
 *
 *     return () => {
 *       channel.unbind('my-event')
 *       pusher.unsubscribe('my-channel')
 *     }
 *   }, [pusher])
 * }
 * ```
 */
export function usePusher(): PusherClient | null {
  const [pusher, setPusher] = useState<PusherClient | null>(null)

  useEffect(() => {
    // Solo inicializar Pusher si está habilitado
    if (!isPusherEnabled()) {
      console.log("📡 [usePusher] Pusher is disabled via NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS")
      return
    }

    try {
      const pusherClient = getPusherClient()
      setPusher(pusherClient)
      console.log("✅ [usePusher] Pusher client initialized")
    } catch (error) {
      console.error("❌ [usePusher] Failed to initialize Pusher:", error)
      setPusher(null)
    }

    // Cleanup: No desconectamos aquí porque Pusher es singleton global
    // Se desconecta cuando el usuario cierra sesión o la app se cierra
    return () => {
      console.log("🔌 [usePusher] Component unmounting, but keeping Pusher connection")
    }
  }, [])

  return pusher
}
