import PusherJS from "pusher-js"

/**
 * Pusher Client Instance
 * Usado para recibir eventos en el cliente (navegador)
 */
let pusherClient: PusherJS | null = null

export function getPusherClient(): PusherJS {
  if (!pusherClient) {
    const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    // Debug: verificar que las variables existen
    console.log("🔧 Pusher Config:", {
      appKey: appKey ? "✅ Configurada" : "❌ NO ENCONTRADA",
      cluster: cluster ? "✅ Configurada" : "❌ NO ENCONTRADA",
      appKeyValue: appKey,
      clusterValue: cluster,
    })

    if (!appKey || !cluster) {
      throw new Error(
        "Pusher configuration missing. Make sure NEXT_PUBLIC_PUSHER_APP_KEY and NEXT_PUBLIC_PUSHER_CLUSTER are set in .env"
      )
    }

    pusherClient = new PusherJS(appKey, {
      cluster: cluster,
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
