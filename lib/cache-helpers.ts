import { redis, CacheTTL } from "./redis"
import { logger } from "./logger"

/**
 * Patrón Cache-Aside: Intenta obtener del cache, si no existe ejecuta la función y cachea el resultado
 *
 * @param key - Clave del cache
 * @param fn - Función a ejecutar si no hay cache
 * @param ttl - Time to live en segundos (opcional)
 * @returns El valor cacheado o el resultado de la función
 */
export async function cacheAside<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  try {
    // Intentar obtener del cache
    const cached = await redis.get<T>(key)
    if (cached !== null) {
      logger.debug(`Cache hit: ${key}`)
      return cached
    }

    // Cache miss - ejecutar función
    logger.debug(`Cache miss: ${key}`)
    const result = await fn()

    // Guardar en cache
    await redis.set(key, result, ttl)

    return result
  } catch (error: any) {
    logger.error("Error in cacheAside", { key, error: error.message })
    // En caso de error, ejecutar la función directamente
    return await fn()
  }
}

/**
 * Invalidar cache por patrón
 *
 * @param pattern - Patrón de claves a invalidar (ej: "oc-china:*")
 * @returns Número de claves eliminadas
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const count = await redis.delPattern(pattern)
    logger.info(`Cache invalidated: ${pattern} (${count} keys)`)
    return count
  } catch (error: any) {
    logger.error("Error invalidating cache", { pattern, error: error.message })
    return 0
  }
}

/**
 * Wrapper para cachear resultados de queries de base de datos
 */
export class QueryCache {
  /**
   * Cachear listado con paginación
   */
  static async list<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl = CacheTTL.LISTINGS
  ): Promise<T> {
    return cacheAside(cacheKey, queryFn, ttl)
  }

  /**
   * Cachear detalles de un registro
   */
  static async detail<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl = CacheTTL.DETAILS
  ): Promise<T> {
    return cacheAside(cacheKey, queryFn, ttl)
  }

  /**
   * Cachear stats/analytics
   */
  static async stats<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl = CacheTTL.ANALYTICS
  ): Promise<T> {
    return cacheAside(cacheKey, queryFn, ttl)
  }

  /**
   * Cachear datos estáticos (proveedores, configuración)
   */
  static async static<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl = CacheTTL.STATIC
  ): Promise<T> {
    return cacheAside(cacheKey, queryFn, ttl)
  }
}

/**
 * Helper para invalidación automática después de mutaciones
 */
export class CacheInvalidator {
  /**
   * Invalidar cache de OCs
   */
  static async invalidateOCChina(ocId?: string) {
    if (ocId) {
      await redis.del(`oc-china:detail:${ocId}`)
    }
    await invalidateCache("oc-china:list:*")
    await invalidateCache("dashboard:*")
    await invalidateCache("analisis-costos:*")
  }

  /**
   * Invalidar cache de Pagos
   */
  static async invalidatePagosChina(ocId?: string) {
    if (ocId) {
      await redis.del(`pagos-china:by-oc:${ocId}`)
    }
    await invalidateCache("pagos-china:list:*")
    await invalidateCache("dashboard:*")
    await invalidateCache("analisis-costos:*")
  }

  /**
   * Invalidar cache de Gastos Logísticos
   */
  static async invalidateGastosLogisticos(ocIds?: string[]) {
    if (ocIds && ocIds.length > 0) {
      for (const ocId of ocIds) {
        await redis.del(`gastos-logisticos:by-oc:${ocId}`)
      }
    }
    await invalidateCache("gastos-logisticos:list:*")
    await invalidateCache("dashboard:*")
    await invalidateCache("analisis-costos:*")
  }

  /**
   * Invalidar cache de Inventario
   */
  static async invalidateInventario(ocId?: string) {
    if (ocId) {
      await redis.del(`inventario:by-oc:${ocId}`)
    }
    await invalidateCache("inventario:list:*")
    await invalidateCache("dashboard:*")
  }

  /**
   * Invalidar cache de Proveedores
   */
  static async invalidateProveedores() {
    await invalidateCache("proveedores:*")
  }

  /**
   * Invalidar todo el cache (usar con precaución)
   */
  static async invalidateAll() {
    logger.warn("Invalidating ALL cache")
    await redis.flushAll()
  }
}
