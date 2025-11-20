import PusherClient from "pusher-js"

// Singleton instance para el cliente de Pusher
let pusherClientInstance: PusherClient | null = null

/**
 * Obtiene la instancia del cliente de Pusher para el navegador
 * Crea una nueva instancia si no existe
 */
export function getPusherClient(): PusherClient {
  // Validar que las variables de entorno estén configuradas
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2"

  if (!key) {
    throw new Error(
      "Pusher client key is not configured. Please set NEXT_PUBLIC_PUSHER_KEY in your environment variables."
    )
  }

  // Crear nueva instancia si no existe
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(key, {
      cluster,
      forceTLS: true, // Siempre usar conexión segura
      enabledTransports: ["ws", "wss"], // WebSocket y WebSocket Secure
      disabledTransports: ["sockjs", "xhr_polling", "xhr_streaming"], // Deshabilitar fallbacks lentos
    })

    // Eventos de conexión (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      pusherClientInstance.connection.bind("connected", () => {
        console.log("✅ Pusher Client connected")
      })

      pusherClientInstance.connection.bind("disconnected", () => {
        console.log("⚠️ Pusher Client disconnected")
      })

      pusherClientInstance.connection.bind("error", (error: any) => {
        console.error("❌ Pusher Client error:", error)
      })
    }
  }

  return pusherClientInstance
}

/**
 * Desconectar y limpiar la instancia de Pusher
 * Útil cuando el usuario cierra sesión
 */
export function disconnectPusher(): void {
  if (pusherClientInstance) {
    pusherClientInstance.disconnect()
    pusherClientInstance = null

    if (process.env.NODE_ENV === "development") {
      console.log("🔌 Pusher Client disconnected and cleaned up")
    }
  }
}

/**
 * Suscribirse a un canal
 * @param channelName - Nombre del canal (ej: "private-notifications-userId123")
 * @returns Canal de Pusher
 */
export function subscribeToChannel(channelName: string) {
  const pusher = getPusherClient()
  return pusher.subscribe(channelName)
}

/**
 * Desuscribirse de un canal
 * @param channelName - Nombre del canal
 */
export function unsubscribeFromChannel(channelName: string): void {
  if (pusherClientInstance) {
    pusherClientInstance.unsubscribe(channelName)

    if (process.env.NODE_ENV === "development") {
      console.log(`📤 Unsubscribed from channel: ${channelName}`)
    }
  }
}

/**
 * Verificar si Pusher está habilitado vía feature flag
 */
export function isPusherEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS === "true"
}
