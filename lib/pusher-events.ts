import { triggerPusherEvent, isPusherEnabled } from "./pusher-server"

/**
 * Tipos de eventos para actualizaciones en tiempo real
 */
export type RealtimeEventType = "created" | "updated" | "deleted"

/**
 * Estructura de evento en tiempo real
 */
export interface RealtimeEvent<T = any> {
  type: RealtimeEventType
  data: T
  timestamp: string
}

/**
 * Canales disponibles
 */
export const CHANNELS = {
  ORDERS: "orders-table",
  PAYMENTS: "payments-table",
  EXPENSES: "expenses-table",
  INVENTORY: "inventory-table",
} as const

/**
 * Trigger evento de tabla actualizada
 * Envía notificación en tiempo real a todos los clientes
 *
 * @param channel - Canal de Pusher (ej: 'orders-table')
 * @param type - Tipo de evento ('created', 'updated', 'deleted')
 * @param data - Datos del registro
 */
export async function triggerTableUpdate<T = any>(
  channel: string,
  type: RealtimeEventType,
  data: T
): Promise<void> {
  // Si Pusher está deshabilitado, no hacer nada
  if (!isPusherEnabled()) {
    console.log("⚠️ [Pusher] Disabled - skipping table update event")
    return
  }

  try {
    const event: RealtimeEvent<T> = {
      type,
      data,
      timestamp: new Date().toISOString(),
    }

    console.log(`📡 [Pusher] Triggering table update:`, {
      channel,
      type,
      dataId: (data as any)?.id || "unknown",
    })

    await triggerPusherEvent(channel, "table-update", event)

    console.log(`✅ [Pusher] Table update sent successfully`)
  } catch (error) {
    // No lanzar error para no bloquear operaciones principales
    console.error("❌ [Pusher] Error triggering table update:", error)
  }
}

/**
 * Helper para enviar evento de creación
 */
export async function triggerRecordCreated<T = any>(channel: string, data: T): Promise<void> {
  await triggerTableUpdate(channel, "created", data)
}

/**
 * Helper para enviar evento de actualización
 */
export async function triggerRecordUpdated<T = any>(channel: string, data: T): Promise<void> {
  await triggerTableUpdate(channel, "updated", data)
}

/**
 * Helper para enviar evento de eliminación
 */
export async function triggerRecordDeleted<T = any>(channel: string, data: T): Promise<void> {
  await triggerTableUpdate(channel, "deleted", data)
}
