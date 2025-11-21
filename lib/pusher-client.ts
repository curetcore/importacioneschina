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
      authEndpoint: "/api/pusher/auth", // Endpoint para autenticar presence y private channels
      auth: {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        params: {
          // Forzar que las cookies se incluyan en la petición
        },
      },
      // Configurar authorizer personalizado para incluir credentials
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authorizer: ((channel: { name: string }) => {
        return {
          authorize: (socketId: string, callback: (error: Error | null, data: any) => void) => {
            fetch("/api/pusher/auth", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              credentials: "same-origin", // Incluir cookies de sesión
              body: new URLSearchParams({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            })
              .then(res => {
                if (!res.ok) {
                  console.error("❌ [Pusher Auth] HTTP error:", {
                    status: res.status,
                    statusText: res.statusText,
                    channel: channel.name,
                  })
                  throw new Error(`HTTP ${res.status}: ${res.statusText}`)
                }
                return res.json()
              })
              .then(data => {
                // console.log("✅ [Pusher Auth] Authorization successful for:", channel.name)
                callback(null, data)
              })
              .catch(err => {
                console.error("❌ [Pusher Auth] Authorization failed:", {
                  error: err,
                  message: err.message,
                  channel: channel.name,
                })
                callback(err as Error, null)
              })
          },
        }
      }) as any,
    })

    // Eventos de conexión - Logs comentados para producción
    // pusherClientInstance.connection.bind("connected", () => {
    //   console.log("✅ [PUSHER CLIENT] Connected successfully")
    // })

    // pusherClientInstance.connection.bind("disconnected", () => {
    //   console.log("⚠️ [PUSHER CLIENT] Disconnected")
    // })

    pusherClientInstance.connection.bind("error", (error: any) => {
      // Solo log de errores críticos
      if (process.env.NODE_ENV === "development") {
        console.error("❌ [PUSHER CLIENT] Connection error:", error)
      }
    })

    // pusherClientInstance.connection.bind("connecting", () => {
    //   console.log("🔄 [PUSHER CLIENT] Attempting to connect...")
    // })

    // pusherClientInstance.connection.bind("unavailable", () => {
    //   console.error("❌ [PUSHER CLIENT] Connection unavailable")
    // })

    // pusherClientInstance.connection.bind("failed", () => {
    //   console.error("❌ [PUSHER CLIENT] Connection failed")
    // })
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
  // console.log(`📡 [PUSHER CLIENT] Subscribing to channel: ${channelName}`)
  const channel = pusher.subscribe(channelName)

  // Log subscription events - Solo en desarrollo
  // channel.bind("pusher:subscription_succeeded", () => {
  //   console.log(`✅ [PUSHER CLIENT] Successfully subscribed to: ${channelName}`)
  // })

  channel.bind("pusher:subscription_error", (error: any) => {
    if (process.env.NODE_ENV === "development") {
      console.error(`❌ [PUSHER CLIENT] Subscription error for ${channelName}:`, error)
    }
  })

  return channel
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
