import { getPrismaClient } from "./db-helpers"
import { triggerPusherEvent, isPusherEnabled } from "./pusher-server"

/**
 * Tipos de notificación
 */
export type NotificationType = "audit" | "alert" | "error" | "success" | "warning"

/**
 * Prioridad de notificación
 */
export type NotificationPriority = "low" | "normal" | "high" | "urgent"

/**
 * Interfaz para crear una notificación
 */
export interface CreateNotificationInput {
  tipo: NotificationType
  titulo: string
  descripcion?: string
  icono?: string
  entidad?: string
  entidadId?: string
  url?: string
  auditLogId?: string
  usuarioId?: string
  prioridad?: NotificationPriority
  expiresAt?: Date
}

/**
 * Mapeo de íconos por tipo de notificación (lucide-react)
 */
const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  audit: "FileText",
  alert: "AlertTriangle",
  error: "XCircle",
  success: "CheckCircle",
  warning: "Zap",
}

/**
 * Mapeo de íconos por acción de audit (lucide-react)
 */
const AUDIT_ACTION_ICONS: Record<string, string> = {
  CREATE: "Plus",
  UPDATE: "Edit",
  DELETE: "Trash2",
  RESTORE: "RotateCcw",
}

/**
 * Mapeo de entidades a URLs
 */
const ENTITY_URLS: Record<string, string> = {
  OCChina: "/ordenes",
  PagosChina: "/pagos-china",
  GastosLogisticos: "/gastos-logisticos",
  InventarioRecibido: "/inventario-recibido",
  Proveedor: "/configuracion?tab=proveedores",
  Configuracion: "/configuracion",
  ConfiguracionDistribucionCostos: "/configuracion?tab=distribucion",
}

/**
 * Crear una notificación
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    console.log("📝 [Notification] Creating notification:", {
      tipo: input.tipo,
      titulo: input.titulo,
      entidad: input.entidad,
      pusherEnabled: isPusherEnabled(),
    })

    const db = await getPrismaClient()

    // Usar ícono por defecto si no se proporciona
    const icono = input.icono || NOTIFICATION_ICONS[input.tipo]

    const notification = await db.notificacion.create({
      data: {
        tipo: input.tipo,
        titulo: input.titulo,
        descripcion: input.descripcion,
        icono,
        entidad: input.entidad,
        entidadId: input.entidadId,
        url: input.url,
        auditLogId: input.auditLogId,
        usuarioId: input.usuarioId,
        prioridad: input.prioridad || "normal",
        expiresAt: input.expiresAt,
      },
    })

    console.log("✅ [Notification] Created in DB:", notification.id)

    // Trigger Pusher event si está habilitado
    if (isPusherEnabled()) {
      console.log("📡 [Pusher] Triggering event...")

      // Canal: notificaciones globales o por usuario
      const channel = input.usuarioId ? `private-notifications-${input.usuarioId}` : "notifications"

      await triggerPusherEvent(channel, "new-notification", {
        id: notification.id,
        tipo: notification.tipo,
        titulo: notification.titulo,
        descripcion: notification.descripcion,
        icono: notification.icono,
        entidad: notification.entidad,
        entidadId: notification.entidadId,
        url: notification.url,
        prioridad: notification.prioridad,
        createdAt: notification.createdAt.toISOString(),
      })

      console.log("✅ [Pusher] Event triggered successfully on channel:", channel)
    } else {
      console.log("⚠️ [Pusher] Disabled - notification saved to DB only")
    }
  } catch (error) {
    console.error("❌ [Notification] Error creating notification:", error)
    console.error("❌ [Notification] Input was:", input)
    // No lanzar error para no bloquear operaciones principales
  }
}

/**
 * Crear notificación desde audit log
 */
export async function createNotificationFromAudit(
  auditLogId: string,
  entidad: string,
  entidadId: string,
  accion: string,
  usuarioEmail?: string
): Promise<void> {
  try {
    const db = await getPrismaClient()

    // Generar título basado en la acción y entidad
    const actionVerb = getActionVerb(accion)
    const entityName = getEntityDisplayName(entidad)

    const titulo = `${entityName} ${actionVerb}`

    // Obtener el nombre del usuario si existe
    let descripcion = "Hace un momento"
    if (usuarioEmail) {
      const user = await db.user.findUnique({
        where: { email: usuarioEmail },
        select: { name: true, lastName: true },
      })

      if (user) {
        const userName = [user.name, user.lastName].filter(Boolean).join(" ")
        descripcion = `Por ${userName} hace un momento`
      } else {
        descripcion = `Por ${usuarioEmail} hace un momento`
      }
    }

    // Determinar ícono
    const icono = AUDIT_ACTION_ICONS[accion] || NOTIFICATION_ICONS.audit

    // Generar URL
    const url = ENTITY_URLS[entidad]
      ? `${ENTITY_URLS[entidad]}${entidadId ? `?highlight=${entidadId}` : ""}`
      : undefined

    await createNotification({
      tipo: "audit",
      titulo,
      descripcion,
      icono,
      entidad,
      entidadId,
      url,
      auditLogId,
      prioridad: accion === "DELETE" ? "high" : "normal",
    })
  } catch (error) {
    console.error("Error creating notification from audit:", error)
  }
}

/**
 * Marcar notificación como leída
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const db = await getPrismaClient()

    await db.notificacion.update({
      where: { id: notificationId },
      data: {
        leida: true,
        leidaAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
  }
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function markAllNotificationsAsRead(usuarioId?: string): Promise<void> {
  try {
    const db = await getPrismaClient()

    await db.notificacion.updateMany({
      where: {
        leida: false,
        ...(usuarioId && { usuarioId }),
      },
      data: {
        leida: true,
        leidaAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
  }
}

/**
 * Obtener notificaciones no leídas
 */
export async function getUnreadNotifications(usuarioId?: string, limit = 10) {
  try {
    const db = await getPrismaClient()

    return await db.notificacion.findMany({
      where: {
        leida: false,
        ...(usuarioId && { usuarioId }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })
  } catch (error) {
    console.error("Error getting unread notifications:", error)
    return []
  }
}

/**
 * Obtener count de notificaciones no leídas
 */
export async function getUnreadCount(usuarioId?: string): Promise<number> {
  try {
    const db = await getPrismaClient()

    return await db.notificacion.count({
      where: {
        leida: false,
        ...(usuarioId && { usuarioId }),
      },
    })
  } catch (error) {
    console.error("Error getting unread count:", error)
    return 0
  }
}

/**
 * Limpiar notificaciones antiguas
 */
export async function cleanupOldNotifications(daysOld = 30): Promise<void> {
  try {
    const db = await getPrismaClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    await db.notificacion.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        leida: true,
      },
    })
  } catch (error) {
    console.error("Error cleaning up old notifications:", error)
  }
}

// ============================================
// HELPERS INTERNOS
// ============================================

function getActionVerb(accion: string): string {
  const verbs: Record<string, string> = {
    CREATE: "creada",
    UPDATE: "modificada",
    DELETE: "eliminada",
    RESTORE: "restaurada",
  }
  return verbs[accion] || "actualizada"
}

function getEntityDisplayName(entidad: string): string {
  const names: Record<string, string> = {
    OCChina: "Orden de compra",
    PagosChina: "Pago",
    GastosLogisticos: "Gasto logístico",
    InventarioRecibido: "Inventario",
    Proveedor: "Proveedor",
    Configuracion: "Configuración",
    ConfiguracionDistribucionCostos: "Config. distribución",
  }
  return names[entidad] || entidad
}
