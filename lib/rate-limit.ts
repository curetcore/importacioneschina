/**
 * Rate Limiting sin dependencias externas
 * Usa Map en memoria (para desarrollo/low-traffic)
 *
 * Para producción, considerar:
 * - @upstash/ratelimit + Redis
 * - Vercel Edge Config
 * - upstash/redis
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Store en memoria (resetea al reiniciar el servidor)
const store = new Map<string, RateLimitEntry>()

// Cleanup cada 5 minutos para evitar memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of Array.from(store.entries())) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /**
   * Número máximo de requests permitidos
   * @default 10
   */
  limit?: number

  /**
   * Ventana de tiempo en segundos
   * @default 10
   */
  windowSeconds?: number

  /**
   * Identificador único del cliente (IP, user ID, etc.)
   */
  identifier: string
}

export interface RateLimitResult {
  /**
   * Si el request está permitido
   */
  success: boolean

  /**
   * Número de requests restantes en la ventana actual
   */
  remaining: number

  /**
   * Límite máximo de requests
   */
  limit: number

  /**
   * Timestamp (ms) cuando se resetea el contador
   */
  reset: number

  /**
   * Segundos hasta el reset
   */
  retryAfter?: number
}

/**
 * Verificar rate limit para un identificador
 *
 * @example
 * // En un API route:
 * const ip = request.headers.get("x-forwarded-for") || "unknown"
 * const result = await rateLimit({ identifier: ip, limit: 10, windowSeconds: 60 })
 *
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: "Too many requests" },
 *     {
 *       status: 429,
 *       headers: {
 *         "X-RateLimit-Limit": result.limit.toString(),
 *         "X-RateLimit-Remaining": "0",
 *         "X-RateLimit-Reset": new Date(result.reset).toISOString(),
 *         "Retry-After": result.retryAfter!.toString(),
 *       }
 *     }
 *   )
 * }
 */
export async function rateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const {
    limit = 10,
    windowSeconds = 10,
    identifier,
  } = config

  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const key = `ratelimit:${identifier}`

  // Obtener entrada existente
  let entry = store.get(key)

  // Si no existe o ya expiró, crear nueva ventana
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    }
    store.set(key, entry)
  }

  // Incrementar contador
  entry.count++

  // Calcular valores de respuesta
  const success = entry.count <= limit
  const remaining = Math.max(0, limit - entry.count)
  const retryAfter = success ? undefined : Math.ceil((entry.resetAt - now) / 1000)

  return {
    success,
    remaining,
    limit,
    reset: entry.resetAt,
    retryAfter,
  }
}

/**
 * Rate limit presets para diferentes tipos de endpoints
 */
export const RateLimits = {
  /**
   * Rate limit estricto para uploads de archivos
   * 3 requests por minuto
   */
  upload: (identifier: string) =>
    rateLimit({ identifier, limit: 3, windowSeconds: 60 }),

  /**
   * Rate limit moderado para operaciones de escritura (POST/PUT/DELETE)
   * 20 requests cada 10 segundos
   */
  mutation: (identifier: string) =>
    rateLimit({ identifier, limit: 20, windowSeconds: 10 }),

  /**
   * Rate limit permisivo para lecturas (GET)
   * 60 requests por minuto
   */
  query: (identifier: string) =>
    rateLimit({ identifier, limit: 60, windowSeconds: 60 }),

  /**
   * Rate limit muy estricto para autenticación
   * 5 intentos cada 15 minutos
   */
  auth: (identifier: string) =>
    rateLimit({ identifier, limit: 5, windowSeconds: 15 * 60 }),
}

/**
 * Helper para obtener identificador del cliente desde request
 * Usa IP del header X-Forwarded-For o X-Real-IP
 */
export function getClientIdentifier(request: Request): string {
  // Intentar obtener IP real (detrás de proxy/CDN)
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    // x-forwarded-for puede ser "client, proxy1, proxy2"
    return forwardedFor.split(",")[0].trim()
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  // Fallback a IP del socket (menos confiable con proxies)
  return "unknown"
}

/**
 * Middleware helper para aplicar rate limiting fácilmente
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await withRateLimit(request, RateLimits.upload)
 *   if (rateLimitResult) return rateLimitResult  // 429 response
 *
 *   // Continuar con la lógica normal...
 * }
 */
export async function withRateLimit(
  request: Request,
  rateLimitFn: (identifier: string) => Promise<RateLimitResult>
): Promise<Response | null> {
  const identifier = getClientIdentifier(request)
  const result = await rateLimitFn(identifier)

  if (!result.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Demasiadas peticiones. Por favor, intenta más tarde.",
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(result.reset).toISOString(),
          "Retry-After": result.retryAfter!.toString(),
        },
      }
    )
  }

  // Rate limit OK, continuar
  return null
}
