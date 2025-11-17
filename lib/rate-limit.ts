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
  for (const [key, entry] of cache.entries()) {
    if (entry.resetTime < now) {
      cache.delete(key)
    }
  }
}, 60000)

/**
 * Middleware de rate limiting
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
        error: "Too Many Requests",
        message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        retryAfter: resetIn,
      },
      {
        status: 429,
        headers: {
          "Retry-After": resetIn.toString(),
          "X-RateLimit-Limit": config.uniqueTokenPerInterval.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": entry.resetTime.toString(),
        },
      }
    )
  }

  return null
}

/** Rate limit para escritura (POST, PUT, DELETE) - 10 requests/min */
export async function rateLimitWrite(request: Request): Promise<NextResponse | null> {
  return rateLimit(request, {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 10,
  })
}

/** Rate limit para lectura (GET) - 60 requests/min */
export async function rateLimitRead(request: Request): Promise<NextResponse | null> {
  return rateLimit(request, {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 60,
  })
}

/** Rate limit para auth - 5 intentos/15min */
export async function rateLimitAuth(request: Request): Promise<NextResponse | null> {
  return rateLimit(request, {
    interval: 15 * 60 * 1000,
    uniqueTokenPerInterval: 5,
  })
}

function getClientIP(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0].trim()

  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp

  const cfConnectingIp = request.headers.get("cf-connecting-ip")
  if (cfConnectingIp) return cfConnectingIp

  return null
}
