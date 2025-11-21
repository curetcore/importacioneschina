import { getPrismaClient } from "./db-helpers"
import { triggerPusherEvent, triggerNotification, isPusherEnabled } from "./pusher-server"

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
  actorId?: string // Usuario que realizó la acción
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
 * Mapeo de entidades a rutas base (para detalle)
 */
export const ENTITY_URLS: Record<string, string> = {
  OCChina: "/ordenes",
  PagosChina: "/pagos-china",
  GastosLogisticos: "/gastos-logisticos",
  InventarioRecibido: "/inventario-recibido",
  Proveedor: "/configuracion?tab=proveedores",
  Configuracion: "/configuracion",
  ConfiguracionDistribucionCostos: "/configuracion",
}

/**
 * Helper para obtener la URL base de una entidad
 */
export function getEntityUrl(entityType: string, entityId: string): string {
  const baseUrl = ENTITY_URLS[entityType] || "/"
  return `${baseUrl}/${entityId}`
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
        actorId: input.actorId,
        prioridad: input.prioridad || "normal",
        expiresAt: input.expiresAt,
      },
    })

    console.log("✅ [Notification] Created in DB:", notification.id)

    // Trigger Pusher notification broadcast
    await triggerNotification({
      id: notification.id,
      tipo: notification.tipo,
      titulo: notification.titulo,
      descripcion: notification.descripcion,
      icono: notification.icono,
      url: notification.url,
      usuarioId: notification.usuarioId,
      createdAt: notification.createdAt,
    })
  } catch (error) {
    console.error("❌ [Notification] Error creating notification:", error)
    console.error("❌ [Notification] Input was:", input)
    // No lanzar error para no bloquear operaciones principales
  }
}

/**
 * Crear notificación desde audit log
 * NUEVO COMPORTAMIENTO:
 * - NO crea notificaciones persistentes en BD
 * - Solo envía evento de Pusher para toast efímero (awareness en tiempo real)
 * - Todos los usuarios ven el toast por 3-5 segundos y desaparece
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

    // Generar URL de detalle
    let url: string | undefined
    if (ENTITY_URLS[entidad]) {
      if (entidadId) {
        // Entidades con página de detalle
        if (["OCChina", "PagosChina", "GastosLogisticos", "InventarioRecibido"].includes(entidad)) {
          url = `${ENTITY_URLS[entidad]}/${entidadId}`
        } else if (entidad === "Proveedor") {
          // Proveedor: abrir modal con ID específico
          url = `/configuracion?tab=proveedores&proveedorId=${entidadId}`
        } else {
          // Configuración y otras sin detalle
          url = ENTITY_URLS[entidad]
        }
      } else {
        url = ENTITY_URLS[entidad]
      }
    }

    // ========================================
    // ACTIVITY UPDATE (TOAST EFÍMERO)
    // ========================================
    // En lugar de crear notificaciones persistentes, solo enviamos
    // un evento de Pusher para mostrar toast efímero a todos

    if (isPusherEnabled()) {
      console.log("📡 [Activity] Triggering activity update for all users...")

      // Canal global de actividad (todos los usuarios conectados)
      await triggerPusherEvent("activity-feed", "activity-update", {
        id: `activity-${Date.now()}`, // ID único temporal
        tipo: "audit",
        titulo,
        descripcion,
        icono,
        entidad,
        entidadId,
        url,
        prioridad: accion === "DELETE" ? "high" : "normal",
        accion,
        timestamp: new Date().toISOString(),
      })

      console.log("✅ [Activity] Activity update broadcasted to all users")
    } else {
      console.log("⚠️ [Activity] Pusher disabled - activity update skipped")
    }
  } catch (error) {
    console.error("Error creating activity update from audit:", error)
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

/**
 * Obtener el dueño (owner) de una entidad
 * Útil para enviar notificaciones al usuario que creó la entidad
 */
export async function getEntityOwnerId(
  entityType: string,
  entityId: string
): Promise<string | null> {
  try {
    const db = await getPrismaClient()

    // Mapeo de entidades a su campo de usuario/owner
    const entityUserFields: Record<string, string> = {
      OCChina: "usuarioId",
      PagosChina: "usuarioId",
      GastosLogisticos: "usuarioId",
      InventarioRecibido: "usuarioId",
      Comment: "userId",
    }

    const userField = entityUserFields[entityType]

    if (!userField) {
      return null
    }

    // Obtener el owner de la entidad
    const modelName = entityType.charAt(0).toLowerCase() + entityType.slice(1)
    const entityData: any = await (db as any)[modelName]
      .findUnique({
        where: { id: entityId },
        select: { [userField]: true },
      })
      .catch(() => null)

    if (entityData) {
      return entityData[userField]
    }

    return null
  } catch (error) {
    console.error("⚠️ [Notification] Could not determine entity owner:", error)
    return null
  }
}
