import PusherJS from "pusher-js"

/**
 * Pusher Client Instance
 * Usado para recibir eventos en el cliente (navegador)
 */
let pusherClient: PusherJS | null = null

export function getPusherClient(): PusherJS {
  if (!pusherClient) {
    pusherClient = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth", // Para canales privados/presence (futuro)
    })

    // Debug en desarrollo
    if (process.env.NODE_ENV === "development") {
      PusherJS.logToConsole = true
    }
  }

  return pusherClient
}

/**
 * Hook para limpiar conexión al desmontar
 */
export function disconnectPusher() {
  if (pusherClient) {
    pusherClient.disconnect()
    pusherClient = null
  }
}
