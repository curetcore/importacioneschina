import { prisma } from "@/lib/prisma"

/**
 * Soft delete helper - Marca un registro como eliminado sin borrarlo físicamente
 * @param model - Nombre del modelo de Prisma
 * @param id - ID del registro a eliminar
 * @returns El registro actualizado con deletedAt
 */
export async function softDelete(model: keyof typeof prisma, id: string): Promise<any> {
  const prismaModel = prisma[model] as any

  if (!prismaModel || typeof prismaModel.update !== "function") {
    throw new Error(`Modelo "${String(model)}" no encontrado o no soporta soft delete`)
  }

  const now = new Date()

  return await prismaModel.update({
    where: { id },
    data: { deletedAt: now },
  })
}

/**
 * Restaurar un registro soft-deleted
 * @param model - Nombre del modelo de Prisma
 * @param id - ID del registro a restaurar
 * @returns El registro actualizado con deletedAt = null
 */
export async function restoreSoftDelete(model: keyof typeof prisma, id: string): Promise<any> {
  const prismaModel = prisma[model] as any

  if (!prismaModel || typeof prismaModel.update !== "function") {
    throw new Error(`Modelo "${String(model)}" no encontrado o no soporta restore`)
  }

  return await prismaModel.update({
    where: { id },
    data: { deletedAt: null },
  })
}

/**
 * Obtener query filter para excluir registros eliminados
 * Usar en todas las queries para filtrar soft-deleted records
 *
 * NOTA IMPORTANTE SOBRE SOFT DELETE:
 * - El schema tiene `deletedAt` en todas las tablas principales
 * - Este filtro se aplica en todos los queries GET
 * - ESTADO ACTUAL (2025-01-17):
 *   ✅ Proveedores: DELETE endpoint implementado (soft delete)
 *   ⏸️ OC China, Pagos, Gastos, Inventario: DELETE no implementado
 * - PENDIENTE PARA PRODUCCIÓN:
 *   1. Implementar DELETE consistente en todos los módulos
 *   2. Agregar interfaz de "Papelera" para recuperar registros
 *   3. O decidir eliminar el campo si no se va a usar
 *
 * Uso:
 * ```typescript
 * await db.oCChina.findMany({
 *   where: {
 *     ...notDeletedFilter,  // Excluye registros borrados
 *     proveedor: "China 1"
 *   }
 * })
 * ```
 */
export const notDeletedFilter = {
  deletedAt: null,
}

/**
 * Obtener query filter para incluir SOLO registros eliminados
 * Útil para implementar una "Papelera" o vista de registros eliminados
 */
export const onlyDeletedFilter = {
  deletedAt: { not: null },
}

/**
 * Obtener el cliente Prisma de producción
 * @returns PrismaClient de producción
 */
export async function getPrismaClient() {
  return prisma
}
