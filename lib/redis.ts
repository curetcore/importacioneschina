import Redis from "ioredis"
import { logger, loggers } from "./logger"

/**
 * Cliente Redis con fallback a cache en memoria
 *
 * Si Redis no está disponible (ej: desarrollo local),
 * usa un Map en memoria como fallback.
 */
class RedisClient {
  private client: Redis | null = null
  private memoryCache: Map<string, { value: string; expiry: number }> = new Map()
  private useMemoryFallback = false
  private connectionAttempted = false

  constructor() {
    this.initializeClient()
  }

  private async initializeClient() {
    if (this.connectionAttempted) return
    this.connectionAttempted = true

    const redisUrl = process.env.REDIS_URL

    if (!redisUrl) {
      logger.warn("REDIS_URL no configurado. Usando cache en memoria (solo desarrollo)")
      this.useMemoryFallback = true
      return
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        lazyConnect: true,
      })

      // Conectar con timeout
      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis connection timeout")), 5000)
        ),
      ])

      this.client.on("error", error => {
        logger.error("Redis connection error:", { error: error.message })
      })

      this.client.on("connect", () => {
        loggers.performance.slow("Redis", 0, 0, { status: "connected" })
      })

      logger.info("Redis conectado exitosamente")
    } catch (error: any) {
      logger.warn(`Redis no disponible: ${error.message}. Usando cache en memoria.`)
      this.useMemoryFallback = true
      this.client = null
    }
  }

  /**
   * Obtener valor del cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (this.useMemoryFallback) {
        return this.getFromMemory<T>(key)
      }

      if (!this.client) {
        await this.initializeClient()
        if (this.useMemoryFallback) {
          return this.getFromMemory<T>(key)
        }
      }

      const value = await this.client!.get(key)
      if (!value) return null

      return JSON.parse(value) as T
    } catch (error: any) {
      logger.error("Error getting from Redis cache", { key, error: error.message })
      return null
    }
  }

  /**
   * Guardar valor en cache con TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)

      if (this.useMemoryFallback) {
        return this.setInMemory(key, serialized, ttlSeconds)
      }

      if (!this.client) {
        await this.initializeClient()
        if (this.useMemoryFallback) {
          return this.setInMemory(key, serialized, ttlSeconds)
        }
      }

      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, serialized)
      } else {
        await this.client!.set(key, serialized)
      }

      return true
    } catch (error: any) {
      logger.error("Error setting Redis cache", { key, error: error.message })
      return false
    }
  }

  /**
   * Eliminar clave del cache
   */
  async del(key: string): Promise<boolean> {
    try {
      if (this.useMemoryFallback) {
        this.memoryCache.delete(key)
        return true
      }

      if (!this.client) return false

      await this.client.del(key)
      return true
    } catch (error: any) {
      logger.error("Error deleting from Redis cache", { key, error: error.message })
      return false
    }
  }

  /**
   * Eliminar todas las claves que coincidan con un patrón
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      if (this.useMemoryFallback) {
        let count = 0
        const regex = new RegExp(pattern.replace("*", ".*"))
        for (const key of Array.from(this.memoryCache.keys())) {
          if (regex.test(key)) {
            this.memoryCache.delete(key)
            count++
          }
        }
        return count
      }

      if (!this.client) return 0

      const keys = await this.client.keys(pattern)
      if (keys.length === 0) return 0

      await this.client.del(...keys)
      return keys.length
    } catch (error: any) {
      logger.error("Error deleting pattern from Redis", { pattern, error: error.message })
      return 0
    }
  }

  /**
   * Verificar si existe una clave
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.useMemoryFallback) {
        const cached = this.memoryCache.get(key)
        if (!cached) return false
        if (Date.now() > cached.expiry) {
          this.memoryCache.delete(key)
          return false
        }
        return true
      }

      if (!this.client) return false

      const result = await this.client.exists(key)
      return result === 1
    } catch (error: any) {
      logger.error("Error checking Redis key existence", { key, error: error.message })
      return false
    }
  }

  /**
   * Incrementar un contador
   */
  async incr(key: string): Promise<number> {
    try {
      if (this.useMemoryFallback) {
        const current = await this.get<number>(key)
        const newValue = (current || 0) + 1
        await this.set(key, newValue)
        return newValue
      }

      if (!this.client) return 0

      return await this.client.incr(key)
    } catch (error: any) {
      logger.error("Error incrementing Redis counter", { key, error: error.message })
      return 0
    }
  }

  /**
   * Establecer TTL a una clave existente
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (this.useMemoryFallback) {
        const cached = this.memoryCache.get(key)
        if (cached) {
          cached.expiry = Date.now() + seconds * 1000
          return true
        }
        return false
      }

      if (!this.client) return false

      const result = await this.client.expire(key, seconds)
      return result === 1
    } catch (error: any) {
      logger.error("Error setting TTL in Redis", { key, error: error.message })
      return false
    }
  }

  /**
   * Limpiar todo el cache (¡usar con precaución!)
   */
  async flushAll(): Promise<boolean> {
    try {
      if (this.useMemoryFallback) {
        this.memoryCache.clear()
        return true
      }

      if (!this.client) return false

      await this.client.flushall()
      return true
    } catch (error: any) {
      logger.error("Error flushing Redis cache", { error: error.message })
      return false
    }
  }

  // ============================================
  // MÉTODOS DE CACHE EN MEMORIA (FALLBACK)
  // ============================================

  private getFromMemory<T>(key: string): T | null {
    const cached = this.memoryCache.get(key)
    if (!cached) return null

    // Verificar si expiró
    if (Date.now() > cached.expiry) {
      this.memoryCache.delete(key)
      return null
    }

    try {
      return JSON.parse(cached.value) as T
    } catch {
      return null
    }
  }

  private setInMemory(key: string, value: string, ttlSeconds?: number): boolean {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Date.now() + 86400000 // 24h default
    this.memoryCache.set(key, { value, expiry })

    // Cleanup de entradas expiradas cada 100 sets
    if (this.memoryCache.size % 100 === 0) {
      this.cleanupMemoryCache()
    }

    return true
  }

  private cleanupMemoryCache() {
    const now = Date.now()
    for (const [key, { expiry }] of Array.from(this.memoryCache.entries())) {
      if (now > expiry) {
        this.memoryCache.delete(key)
      }
    }
  }

  /**
   * Desconectar cliente (para cleanup)
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit()
    }
  }
}

// Singleton instance
export const redis = new RedisClient()

// Helper para generar claves de cache consistentes
export const CacheKeys = {
  dashboard: (timeRange?: string) => `dashboard:stats:${timeRange || "all"}`,
  ocChina: {
    list: (page: number, limit: number) => `oc-china:list:${page}:${limit}`,
    detail: (id: string) => `oc-china:detail:${id}`,
    all: () => `oc-china:*`,
  },
  pagosChina: {
    list: (page: number, limit: number) => `pagos-china:list:${page}:${limit}`,
    byOC: (ocId: string) => `pagos-china:by-oc:${ocId}`,
    all: () => `pagos-china:*`,
  },
  gastosLogisticos: {
    list: (page: number, limit: number) => `gastos-logisticos:list:${page}:${limit}`,
    byOC: (ocId: string) => `gastos-logisticos:by-oc:${ocId}`,
    all: () => `gastos-logisticos:*`,
  },
  inventario: {
    list: (page: number, limit: number) => `inventario:list:${page}:${limit}`,
    byOC: (ocId: string) => `inventario:by-oc:${ocId}`,
    all: () => `inventario:*`,
  },
  proveedores: {
    list: () => `proveedores:list`,
    all: () => `proveedores:*`,
  },
  analisisCostos: {
    byOC: (ocId: string) => `analisis-costos:${ocId}`,
    all: () => `analisis-costos:*`,
  },
} as const

// TTL defaults (en segundos)
export const CacheTTL = {
  DASHBOARD: 5 * 60, // 5 minutos
  LISTINGS: 1 * 60, // 1 minuto
  DETAILS: 2 * 60, // 2 minutos
  STATIC: 30 * 60, // 30 minutos (proveedores, config)
  ANALYTICS: 10 * 60, // 10 minutos
} as const
