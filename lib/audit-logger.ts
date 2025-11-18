import { getPrismaClient } from "@/lib/db-helpers"
import { createNotificationFromAudit } from "@/lib/notification-service"

/**
 * IMPORTANTE: Este módulo usa getPrismaClient() para garantizar que los logs
 * de auditoría se guarden en la base de datos correcta (producción o demo).
 *
 * Tipos de acciones auditables
 */
export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  RESTORE = "RESTORE",
}

/**
 * Opciones para crear un log de auditoría
 */
export interface AuditLogOptions {
  /** Nombre del modelo/entidad afectada (ej: "OCChina", "PagosChina") */
  entidad: string

  /** ID del registro afectado */
  entidadId: string

  /** Acción realizada */
  accion: AuditAction

  /** Estado anterior del registro (para UPDATE/DELETE) */
  cambiosAntes?: Record<string, any>

  /** Estado nuevo del registro (para CREATE/UPDATE) */
  cambiosDespues?: Record<string, any>

  /** Lista de campos que fueron modificados (para UPDATE) */
  camposModificados?: string[]

  /** Descripción legible de la acción */
  descripcion?: string

  /** Metadata adicional */
  metadata?: Record<string, any>

  /** ID del usuario que realizó la acción (opcional) */
  usuarioId?: string

  /** Email del usuario */
  usuarioEmail?: string

  /** IP del cliente */
  ipAddress?: string

  /** User agent del cliente */
  userAgent?: string
}

/**
 * Crea un registro de auditoría
 *
 * @example
 * await logAudit({
 *   entidad: "OCChina",
 *   entidadId: oc.id,
 *   accion: AuditAction.CREATE,
 *   cambiosDespues: oc,
 *   descripcion: `Creada OC ${oc.oc} para proveedor ${oc.proveedor}`,
 *   ipAddress: request.headers.get("x-forwarded-for"),
 * })
 */
export async function logAudit(options: AuditLogOptions): Promise<string | null> {
  try {
    // Obtener el cliente Prisma correcto (producción o demo según el usuario)
    const db = await getPrismaClient()

    const auditLog = await db.auditLog.create({
      data: {
        entidad: options.entidad,
        entidadId: options.entidadId,
        accion: options.accion,
        cambiosAntes: options.cambiosAntes || undefined,
        cambiosDespues: options.cambiosDespues || undefined,
        camposModificados: options.camposModificados || [],
        descripcion: options.descripcion || undefined,
        metadata: options.metadata || undefined,
        usuarioId: options.usuarioId || undefined,
        usuarioEmail: options.usuarioEmail || undefined,
        ipAddress: options.ipAddress || undefined,
        userAgent: options.userAgent || undefined,
      },
    })

    return auditLog.id
  } catch (error) {
    // No queremos que un error en el audit log rompa la operación principal
    console.error("[Audit Log Error]", error)
    return null
  }
}

/**
 * Helper para detectar campos modificados comparando dos objetos
 */
export function detectChangedFields(
  before: Record<string, any>,
  after: Record<string, any>
): string[] {
  const changed: string[] = []

  // Campos a ignorar en la comparación
  const ignoreFields = ["updatedAt", "createdAt", "deletedAt"]

  for (const key of Object.keys(after)) {
    if (ignoreFields.includes(key)) continue

    const beforeValue = before[key]
    const afterValue = after[key]

    // Comparación básica (no deep)
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changed.push(key)
    }
  }

  return changed
}

/**
 * Helper para extraer IP del cliente desde request
 */
export function getClientIP(request: Request): string | undefined {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  return undefined
}

/**
 * Helper para obtener user agent
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent") || undefined
}

/**
 * Helper para obtener el identificador legible de una entidad
 */
function getHumanReadableId(entidad: string, data?: Record<string, any>): string {
  if (!data) return ""

  // Mapeo de entidades a sus campos legibles
  const fieldMappings: Record<string, string[]> = {
    OCChina: ["oc"],
    PagosChina: ["idPago"],
    GastosLogisticos: ["idGasto"],
    InventarioRecibido: ["codigoRecepcion", "codigo"],
    Proveedor: ["nombre", "codigo"],
    Producto: ["nombre", "sku"],
    Configuracion: ["categoria", "clave"],
    ConfiguracionDistribucionCostos: ["nombre"],
    User: ["name", "email"],
  }

  const fields = fieldMappings[entidad] || []

  // Intentar usar el primer campo disponible
  for (const field of fields) {
    if (data[field]) {
      return data[field]
    }
  }

  // Fallback: usar el ID si no hay campo legible
  return data.id?.substring(0, 8) || ""
}

/**
 * Helper para crear descripción legible automáticamente
 */
export function createAuditDescription(
  action: AuditAction,
  entidad: string,
  data?: Record<string, any>
): string {
  const identifier = getHumanReadableId(entidad, data)
  const displayIdentifier = identifier ? ` ${identifier}` : ""

  switch (action) {
    case AuditAction.CREATE:
      return `Creado ${entidad}${displayIdentifier}`

    case AuditAction.UPDATE:
      return `Actualizado ${entidad}${displayIdentifier}`

    case AuditAction.DELETE:
      return `Eliminado ${entidad}${displayIdentifier}`

    case AuditAction.RESTORE:
      return `Restaurado ${entidad}${displayIdentifier}`

    default:
      return `Acción ${action} en ${entidad}`
  }
}

/**
 * Helper para auditar creaciones
 */
export async function auditCreate(
  entidad: string,
  data: Record<string, any>,
  request?: Request,
  usuarioEmail?: string
): Promise<void> {
  // Si no se proporciona usuarioEmail, intentar obtenerlo del request
  let email = usuarioEmail
  if (!email && request) {
    email = await extractUserEmailFromRequest(request)
  }

  const auditLogId = await logAudit({
    entidad,
    entidadId: data.id,
    accion: AuditAction.CREATE,
    cambiosDespues: data,
    descripcion: createAuditDescription(AuditAction.CREATE, entidad, data),
    usuarioEmail: email,
    ipAddress: request ? getClientIP(request) : undefined,
    userAgent: request ? getUserAgent(request) : undefined,
  })

  // Crear notificación automáticamente
  if (auditLogId) {
    await createNotificationFromAudit(auditLogId, entidad, data.id, AuditAction.CREATE, email)
  }
}

/**
 * Helper para auditar actualizaciones
 */
export async function auditUpdate(
  entidad: string,
  before: Record<string, any>,
  after: Record<string, any>,
  request?: Request,
  usuarioEmail?: string
): Promise<void> {
  const camposModificados = detectChangedFields(before, after)

  if (camposModificados.length === 0) {
    // No hubo cambios reales, no auditar
    return
  }

  // Si no se proporciona usuarioEmail, intentar obtenerlo del request
  let email = usuarioEmail
  if (!email && request) {
    email = await extractUserEmailFromRequest(request)
  }

  const auditLogId = await logAudit({
    entidad,
    entidadId: after.id,
    accion: AuditAction.UPDATE,
    cambiosAntes: before,
    cambiosDespues: after,
    camposModificados,
    descripcion: createAuditDescription(AuditAction.UPDATE, entidad, after),
    usuarioEmail: email,
    ipAddress: request ? getClientIP(request) : undefined,
    userAgent: request ? getUserAgent(request) : undefined,
  })

  // Crear notificación automáticamente
  if (auditLogId) {
    await createNotificationFromAudit(auditLogId, entidad, after.id, AuditAction.UPDATE, email)
  }
}

/**
 * Helper para auditar eliminaciones
 */
export async function auditDelete(
  entidad: string,
  data: Record<string, any>,
  request?: Request,
  usuarioEmail?: string
): Promise<void> {
  // Si no se proporciona usuarioEmail, intentar obtenerlo del request
  let email = usuarioEmail
  if (!email && request) {
    email = await extractUserEmailFromRequest(request)
  }

  const auditLogId = await logAudit({
    entidad,
    entidadId: data.id,
    accion: AuditAction.DELETE,
    cambiosAntes: data,
    descripcion: createAuditDescription(AuditAction.DELETE, entidad, data),
    usuarioEmail: email,
    ipAddress: request ? getClientIP(request) : undefined,
    userAgent: request ? getUserAgent(request) : undefined,
  })

  // Crear notificación automáticamente
  if (auditLogId) {
    await createNotificationFromAudit(auditLogId, entidad, data.id, AuditAction.DELETE, email)
  }
}

/**
 * Helper para extraer el email del usuario autenticado desde el request
 */
async function extractUserEmailFromRequest(request: Request): Promise<string | undefined> {
  try {
    const { getServerSession } = await import("next-auth")
    const { authOptions } = await import("@/lib/auth-options")

    const session = await getServerSession(authOptions)
    return session?.user?.email || undefined
  } catch (error) {
    console.error("[Audit] Error extracting user email from request:", error)
    return undefined
  }
}
