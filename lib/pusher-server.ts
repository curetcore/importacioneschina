import Pusher from "pusher"

/**
 * Pusher Server Instance
 * Usado para emitir eventos desde el servidor
 */
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

/**
 * Eventos disponibles para notificaciones
 */
export enum PusherEvent {
  NEW_NOTIFICATION = "new-notification",
  NOTIFICATION_READ = "notification-read",
  NOTIFICATION_DELETED = "notification-deleted",
}

/**
 * Canales disponibles
 */
export enum PusherChannel {
  NOTIFICATIONS = "notifications",
  PRESENCE = "presence-users",
  ACTIVITY = "activity-feed",
}

/**
 * Emitir nueva notificación
 */
export async function emitNewNotification(notificationData: any) {
  try {
    await pusherServer.trigger(PusherChannel.NOTIFICATIONS, PusherEvent.NEW_NOTIFICATION, {
      notification: notificationData,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error emitting notification via Pusher:", error)
  }
}

/**
 * Emitir notificación leída
 */
export async function emitNotificationRead(notificationId: string) {
  try {
    await pusherServer.trigger(PusherChannel.NOTIFICATIONS, PusherEvent.NOTIFICATION_READ, {
      notificationId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error emitting notification read via Pusher:", error)
  }
}

/**
 * Emitir actualización de tabla
 */
export async function emitTableUpdate(tableName: string, action: string, data: any) {
  try {
    await pusherServer.trigger(`table-${tableName}`, `${action}-record`, {
      action,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error emitting table update via Pusher:", error)
  }
}
