import { useEffect, useCallback } from "react"
import { usePusher } from "./usePusher"
import type { RealtimeEvent, RealtimeEventType } from "@/lib/pusher-events"

/**
 * Callback para manejar eventos de tabla en tiempo real
 */
export type TableUpdateCallback<T = any> = (event: RealtimeEvent<T>) => void

/**
 * Opciones para useRealtimeTable
 */
export interface UseRealtimeTableOptions<T = any> {
  channel: string
  onCreated?: (data: T) => void
  onUpdated?: (data: T) => void
  onDeleted?: (data: T) => void
  onAnyUpdate?: TableUpdateCallback<T>
  enabled?: boolean
}

/**
 * Hook para escuchar actualizaciones de tabla en tiempo real
 * Usa Pusher para recibir eventos cuando otros usuarios crean/editan/eliminan registros
 *
 * @param options - Configuración del hook
 * @returns Estado de conexión de Pusher
 *
 * @example
 * ```tsx
 * useRealtimeTable({
 *   channel: "orders-table",
 *   onCreated: (newOrder) => {
 *     // Agregar orden a la lista
 *     setOrders(prev => [newOrder, ...prev])
 *   },
 *   onUpdated: (updatedOrder) => {
 *     // Actualizar orden en la lista
 *     setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
 *   },
 *   onDeleted: (deletedOrder) => {
 *     // Remover orden de la lista
 *     setOrders(prev => prev.filter(o => o.id !== deletedOrder.id))
 *   }
 * })
 * ```
 */
export function useRealtimeTable<T = any>(options: UseRealtimeTableOptions<T>) {
  const { channel, onCreated, onUpdated, onDeleted, onAnyUpdate, enabled = true } = options

  const pusher = usePusher()

  const handleTableUpdate = useCallback(
    (event: RealtimeEvent<T>) => {
      console.log(`📨 [Realtime] Received ${event.type} event on ${channel}:`, event.data)

      // Llamar callback general si existe
      if (onAnyUpdate) {
        onAnyUpdate(event)
      }

      // Llamar callback específico según el tipo
      switch (event.type) {
        case "created":
          if (onCreated) onCreated(event.data)
          break
        case "updated":
          if (onUpdated) onUpdated(event.data)
          break
        case "deleted":
          if (onDeleted) onDeleted(event.data)
          break
      }
    },
    [channel, onCreated, onUpdated, onDeleted, onAnyUpdate]
  )

  useEffect(() => {
    // Solo suscribirse si está habilitado y Pusher está disponible
    if (!enabled || !pusher) {
      return
    }

    try {
      console.log(`🔌 [Realtime] Subscribing to channel: ${channel}`)

      const pusherChannel = pusher.subscribe(channel)

      // Escuchar eventos de actualización de tabla
      pusherChannel.bind("table-update", handleTableUpdate)

      // Cleanup: Desuscribirse cuando se desmonte el componente
      return () => {
        console.log(`🔌 [Realtime] Unsubscribing from channel: ${channel}`)
        pusherChannel.unbind("table-update", handleTableUpdate)
        pusher.unsubscribe(channel)
      }
    } catch (error) {
      console.error(`❌ [Realtime] Error subscribing to ${channel}:`, error)
    }
  }, [enabled, pusher, channel, handleTableUpdate])

  return {
    isConnected: pusher?.connection.state === "connected",
    connectionState: pusher?.connection.state,
  }
}
