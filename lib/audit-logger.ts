import { prisma } from "@/lib/prisma"

/**
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
export async function logAudit(options: AuditLogOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entidad: options.entidad,
        entidadId: options.entidadId,
        accion: options.accion,
        cambiosAntes: options.cambiosAntes || null,
        cambiosDespues: options.cambiosDespues || null,
        camposModificados: options.camposModificados || [],
        descripcion: options.descripcion || null,
        metadata: options.metadata || null,
        usuarioId: options.usuarioId || null,
        usuarioEmail: options.usuarioEmail || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      },
    })
  } catch (error) {
    // No queremos que un error en el audit log rompa la operación principal
    console.error("[Audit Log Error]", error)
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
 * Helper para crear descripción legible automáticamente
 */
export function createAuditDescription(
  action: AuditAction,
  entidad: string,
  data?: Record<string, any>
): string {
  switch (action) {
    case AuditAction.CREATE:
      return `Creado ${entidad} ${data?.id || ""}`

    case AuditAction.UPDATE:
      return `Actualizado ${entidad} ${data?.id || ""}`

    case AuditAction.DELETE:
      return `Eliminado ${entidad} ${data?.id || ""}`

    case AuditAction.RESTORE:
      return `Restaurado ${entidad} ${data?.id || ""}`

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
  request?: Request
): Promise<void> {
  await logAudit({
    entidad,
    entidadId: data.id,
    accion: AuditAction.CREATE,
    cambiosDespues: data,
    descripcion: createAuditDescription(AuditAction.CREATE, entidad, data),
    ipAddress: request ? getClientIP(request) : undefined,
    userAgent: request ? getUserAgent(request) : undefined,
  })
}

/**
 * Helper para auditar actualizaciones
 */
export async function auditUpdate(
  entidad: string,
  before: Record<string, any>,
  after: Record<string, any>,
  request?: Request
): Promise<void> {
  const camposModificados = detectChangedFields(before, after)

  if (camposModificados.length === 0) {
    // No hubo cambios reales, no auditar
    return
  }

  await logAudit({
    entidad,
    entidadId: after.id,
    accion: AuditAction.UPDATE,
    cambiosAntes: before,
    cambiosDespues: after,
    camposModificados,
    descripcion: createAuditDescription(AuditAction.UPDATE, entidad, after),
    ipAddress: request ? getClientIP(request) : undefined,
    userAgent: request ? getUserAgent(request) : undefined,
  })
}

/**
 * Helper para auditar eliminaciones
 */
export async function auditDelete(
  entidad: string,
  data: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAudit({
    entidad,
    entidadId: data.id,
    accion: AuditAction.DELETE,
    cambiosAntes: data,
    descripcion: createAuditDescription(AuditAction.DELETE, entidad, data),
    ipAddress: request ? getClientIP(request) : undefined,
    userAgent: request ? getUserAgent(request) : undefined,
  })
}
