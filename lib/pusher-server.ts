import Pusher from "pusher"

// Singleton instance para evitar múltiples conexiones
let pusherInstance: Pusher | null = null

/**
 * Obtiene la instancia de Pusher para el servidor
 * Crea una nueva instancia si no existe o si las credenciales han cambiado
 */
export function getPusherServer(): Pusher {
  // Validar que las variables de entorno estén configuradas
  const appId = process.env.PUSHER_APP_ID
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const secret = process.env.PUSHER_SECRET
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2"

  if (!appId || !key || !secret) {
    throw new Error(
      "Pusher credentials are not configured. Please set PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, and PUSHER_SECRET in your environment variables."
    )
  }

  // Crear nueva instancia si no existe
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true, // Siempre usar conexión segura
    })

    // Log de inicialización (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Pusher Server initialized", {
        appId,
        cluster,
        key: `${key.substring(0, 8)}...`,
      })
    }
  }

  return pusherInstance
}

/**
 * Trigger un evento en un canal específico
 * @param channel - Nombre del canal (ej: "private-notifications-userId123")
 * @param event - Nombre del evento (ej: "new-notification")
 * @param data - Datos a enviar
 */
export async function triggerPusherEvent(channel: string, event: string, data: any): Promise<void> {
  try {
    const pusher = getPusherServer()
    await pusher.trigger(channel, event, data)

    if (process.env.NODE_ENV === "development") {
      console.log(`📡 Pusher event triggered: ${channel}/${event}`, {
        dataSize: JSON.stringify(data).length,
      })
    }
  } catch (error) {
    console.error("❌ Error triggering Pusher event:", error)
    // No lanzar error - el sistema debe seguir funcionando aunque Pusher falle
  }
}

/**
 * Verificar si Pusher está habilitado vía feature flag
 */
export function isPusherEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS === "true"
}
