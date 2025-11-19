/**
 * Rate Limiting Middleware para Next.js App Router
 *
 * Protege las APIs contra abuso limitando el número de requests
 * por IP en una ventana de tiempo específica.
 */

import { NextResponse } from "next/server"

interface RateLimitConfig {
  interval: number // Ventana de tiempo en ms
  uniqueTokenPerInterval: number // Número máximo de tokens únicos
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Cache en memoria para almacenar contadores por IP
const cache = new Map<string, RateLimitEntry>()

// Limpiar entradas expiradas cada 60 segundos
setInterval(() => {
  const now = Date.now()
  Array.from(cache.entries()).forEach(([key, entry]) => {
    if (entry.resetTime < now) {
      cache.delete(key)
    }
  })
}, 60000)

/**
 * Middleware de rate limiting (API principal)
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig = {
    interval: 60 * 1000, // 1 minuto por defecto
    uniqueTokenPerInterval: 30, // 30 requests por minuto
  }
): Promise<NextResponse | null> {
  const ip = getClientIP(request) || "unknown"
  const now = Date.now()
  const entry = cache.get(ip)

  if (!entry || entry.resetTime < now) {
    cache.set(ip, {
      count: 1,
      resetTime: now + config.interval,
    })
    return null
  }

  entry.count++

  if (entry.count > config.uniqueTokenPerInterval) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000)

    return NextResponse.json(
      {
        success: false,
        error: "Demasiadas peticiones. Por favor, intenta más tarde.",
        retryAfter: resetIn,
      },
      {
        status: 429,
        headers: {
          "Retry-After": resetIn.toString(),
          "X-RateLimit-Limit": config.uniqueTokenPerInterval.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
        },
      }
    )
  }

  return null
}

/** Obtener IP del cliente desde headers */
function getClientIP(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0].trim()

  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp

  const cfConnectingIp = request.headers.get("cf-connecting-ip")
  if (cfConnectingIp) return cfConnectingIp

  return null
}

// ============================================================================
// PRESETS Y API SIMPLIFICADA
// ============================================================================

/**
 * Presets de rate limiting según tipo de operación
 */
export enum RateLimits {
  /** Uploads de archivos: 3 req/60s */
  upload = "upload",
  /** Operaciones de escritura: 20 req/10s */
  mutation = "mutation",
  /** Operaciones de lectura: 60 req/60s */
  query = "query",
  /** Autenticación: 5 req/15min */
  auth = "auth",
}

const RATE_LIMIT_CONFIGS: Record<RateLimits, RateLimitConfig> = {
  [RateLimits.upload]: {
    interval: 60 * 1000, // 60 segundos
    uniqueTokenPerInterval: 20, // Aumentado de 3 a 20
  },
  [RateLimits.mutation]: {
    interval: 10 * 1000, // 10 segundos
    uniqueTokenPerInterval: 20,
  },
  [RateLimits.query]: {
    interval: 60 * 1000, // 60 segundos
    uniqueTokenPerInterval: 60,
  },
  [RateLimits.auth]: {
    interval: 15 * 60 * 1000, // 15 minutos
    uniqueTokenPerInterval: 5,
  },
}

/**
 * Helper simplificado para aplicar rate limiting con presets
 *
 * @example
 * ```typescript
 * const rateLimitError = await withRateLimit(request, RateLimits.mutation)
 * if (rateLimitError) return rateLimitError
 * ```
 */
export async function withRateLimit(
  request: Request,
  preset: RateLimits
): Promise<NextResponse | null> {
  const config = RATE_LIMIT_CONFIGS[preset]
  return rateLimit(request, config)
}

// ============================================================================
// HELPERS ADICIONALES (para mantener compatibilidad con nueva API)
// ============================================================================

/** Rate limit para escritura (POST, PUT, DELETE) - 20 req/10s */
export async function rateLimitWrite(request: Request): Promise<NextResponse | null> {
  return withRateLimit(request, RateLimits.mutation)
}

/** Rate limit para lectura (GET) - 60 req/60s */
export async function rateLimitRead(request: Request): Promise<NextResponse | null> {
  return withRateLimit(request, RateLimits.query)
}

/** Rate limit para auth - 5 intentos/15min */
export async function rateLimitAuth(request: Request): Promise<NextResponse | null> {
  return withRateLimit(request, RateLimits.auth)
}

/** Rate limit para uploads - 3 req/60s */
export async function rateLimitUpload(request: Request): Promise<NextResponse | null> {
  return withRateLimit(request, RateLimits.upload)
}

/** Obtener identificador del cliente (alias de getClientIP para API pública) */
export function getClientIdentifier(request: Request): string {
  return getClientIP(request) || "unknown"
}
