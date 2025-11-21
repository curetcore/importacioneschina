"use client"

import { useEffect, useState } from "react"
import { usePusher } from "@/hooks/usePusher"

/**
 * Componente de diagnóstico para verificar el estado de Pusher
 * Mostrar esto temporalmente en el MainLayout para debugging
 */
export function PusherDiagnostics() {
  const pusher = usePusher()
  const [connectionState, setConnectionState] = useState<string>("unknown")
  const [channelState, setChannelState] = useState<string>("unknown")
  const [lastEvent, setLastEvent] = useState<any>(null)

  useEffect(() => {
    if (!pusher) {
      setConnectionState("Pusher not available (disabled or error)")
      return
    }

    // Monitor connection state
    const updateConnectionState = () => {
      setConnectionState(pusher.connection.state)
    }

    updateConnectionState()

    pusher.connection.bind("state_change", (states: any) => {
      console.log("🔄 [Pusher Diagnostics] State change:", states.previous, "->", states.current)
      setConnectionState(states.current)
    })

    // Subscribe to notifications channel
    const channel = pusher.subscribe("notifications")

    // Monitor channel state
    channel.bind("pusher:subscription_succeeded", () => {
      console.log("✅ [Pusher Diagnostics] Subscribed to notifications channel")
      setChannelState("subscribed")
    })

    channel.bind("pusher:subscription_error", (error: any) => {
      console.error("❌ [Pusher Diagnostics] Subscription error:", error)
      setChannelState(`error: ${JSON.stringify(error)}`)
    })

    // Listen for new notifications
    channel.bind("new-notification", (data: any) => {
      console.log("📬 [Pusher Diagnostics] Event received:", data)
      setLastEvent(data)
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe("notifications")
    }
  }, [pusher])

  if (!pusher) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
        <h3 className="font-bold mb-2">🔴 Pusher Diagnostics</h3>
        <p className="text-sm">
          Pusher is NOT available. Check NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS and
          NEXT_PUBLIC_PUSHER_KEY
        </p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
      <h3 className="font-bold mb-2">📡 Pusher Diagnostics</h3>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-semibold">Connection:</span>{" "}
          <span
            className={
              connectionState === "connected"
                ? "text-green-300"
                : connectionState === "connecting"
                  ? "text-yellow-300"
                  : "text-red-300"
            }
          >
            {connectionState}
          </span>
        </div>

        <div>
          <span className="font-semibold">Channel:</span>{" "}
          <span
            className={
              channelState === "subscribed"
                ? "text-green-300"
                : channelState === "unknown"
                  ? "text-yellow-300"
                  : "text-red-300"
            }
          >
            {channelState}
          </span>
        </div>

        {lastEvent && (
          <div className="mt-2 border-t border-white/20 pt-2">
            <span className="font-semibold">Last Event:</span>
            <pre className="text-xs mt-1 bg-black/20 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(lastEvent, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
