import winston from "winston"
import DailyRotateFile from "winston-daily-rotate-file"

const { combine, timestamp, printf, colorize, errors } = winston.format

/**
 * Formato personalizado para logs
 */
const customFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : ""
  const stackStr = stack ? `\n${stack}` : ""
  return `${timestamp} [${level}]: ${message}${metaStr}${stackStr}`
})

/**
 * Logger estructurado con Winston
 *
 * Niveles de log:
 * - error: Errores críticos que requieren atención
 * - warn: Advertencias que pueden ser problemáticas
 * - info: Información general del flujo de la aplicación
 * - http: Logs de peticiones HTTP
 * - debug: Información detallada para debugging
 */
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    customFormat
  ),
  transports: [
    // Console output (solo en desarrollo)
    ...(process.env.NODE_ENV !== "production"
      ? [
          new winston.transports.Console({
            format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), customFormat),
          }),
        ]
      : []),

    // Archivo de errores (todos los ambientes)
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "30d",
      format: combine(timestamp(), errors({ stack: true }), winston.format.json()),
    }),

    // Archivo de logs combinados (todos los ambientes)
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: combine(timestamp(), winston.format.json()),
    }),
  ],
})

/**
 * Helper para log de peticiones HTTP
 */
export function logRequest(method: string, url: string, statusCode: number, duration: number) {
  logger.http(`${method} ${url} - ${statusCode} - ${duration}ms`)
}

/**
 * Helper para log de errores
 */
export function logError(error: Error | unknown, context?: Record<string, any>) {
  if (error instanceof Error) {
    logger.error(error.message, { stack: error.stack, ...context })
  } else {
    logger.error("Unknown error", { error, ...context })
  }
}

/**
 * Helper para log de eventos importantes
 */
export function logEvent(event: string, data?: Record<string, any>) {
  logger.info(event, data)
}

/**
 * Helper para log de debugging
 */
export function logDebug(message: string, data?: Record<string, any>) {
  logger.debug(message, data)
}

/**
 * Helper para log de advertencias
 */
export function logWarning(message: string, data?: Record<string, any>) {
  logger.warn(message, data)
}

// Stream para Morgan (HTTP request logger middleware)
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim())
  },
}

/**
 * Loggers específicos por dominio
 */
export const loggers = {
  /**
   * Log de operaciones de base de datos
   */
  db: {
    query: (operation: string, model: string, metadata?: object) => {
      logger.debug(`DB Query: ${operation} on ${model}`, metadata)
    },
    error: (operation: string, model: string, error: Error, metadata?: object) => {
      logger.error(`DB Error: ${operation} on ${model}`, {
        error: error.message,
        stack: error.stack,
        ...metadata,
      })
    },
  },

  /**
   * Log de requests HTTP/API
   */
  api: {
    request: (method: string, path: string, metadata?: object) => {
      logger.http(`${method} ${path}`, metadata)
    },
    response: (method: string, path: string, statusCode: number, duration: number) => {
      const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "http"
      logger.log(level, `${method} ${path} - ${statusCode}`, { duration: `${duration}ms` })
    },
    error: (method: string, path: string, error: Error, metadata?: object) => {
      logger.error(`API Error: ${method} ${path}`, {
        error: error.message,
        stack: error.stack,
        ...metadata,
      })
    },
  },

  /**
   * Log de operaciones de negocio
   */
  business: {
    ordenCreada: (ordenId: number, metadata?: object) => {
      logger.info("Orden de compra creada", { ordenId, ...metadata })
    },
    pagoRegistrado: (pagoId: number, monto: number, metadata?: object) => {
      logger.info("Pago registrado", { pagoId, monto, ...metadata })
    },
    inventarioRecibido: (inventarioId: number, metadata?: object) => {
      logger.info("Inventario recibido", { inventarioId, ...metadata })
    },
    gastoRegistrado: (gastoId: number, tipo: string, monto: number, metadata?: object) => {
      logger.info("Gasto logístico registrado", { gastoId, tipo, monto, ...metadata })
    },
  },

  /**
   * Log de autenticación y seguridad
   */
  security: {
    login: (userId: string, metadata?: object) => {
      logger.info("Usuario autenticado", { userId, ...metadata })
    },
    loginFailed: (email: string, reason: string, metadata?: object) => {
      logger.warn("Intento de login fallido", { email, reason, ...metadata })
    },
    unauthorized: (path: string, metadata?: object) => {
      logger.warn("Acceso no autorizado", { path, ...metadata })
    },
    rateLimitExceeded: (ip: string, path: string, metadata?: object) => {
      logger.warn("Rate limit excedido", { ip, path, ...metadata })
    },
  },

  /**
   * Log de performance
   */
  performance: {
    slow: (operation: string, duration: number, threshold: number, metadata?: object) => {
      logger.warn(`Operación lenta: ${operation}`, {
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
        ...metadata,
      })
    },
  },
}

/**
 * Middleware para logging de requests
 *
 * Uso en API routes:
 * ```typescript
 * import { withRequestLogging } from '@/lib/logger';
 *
 * export const GET = withRequestLogging(async (req) => {
 *   // tu código
 * });
 * ```
 */
export function withRequestLogging(handler: (req: Request, ...args: any[]) => Promise<any>) {
  return async (req: Request, ...args: any[]) => {
    const start = Date.now()
    const method = req.method
    const path = new URL(req.url).pathname

    try {
      loggers.api.request(method, path)
      const response = await handler(req, ...args)
      const duration = Date.now() - start

      // Obtener status code si es Response
      const status = response instanceof Response ? response.status : 200
      loggers.api.response(method, path, status, duration)

      // Alertar si es lento (>2s)
      if (duration > 2000) {
        loggers.performance.slow(path, duration, 2000)
      }

      return response
    } catch (error: any) {
      const duration = Date.now() - start
      loggers.api.error(method, path, error, { duration: `${duration}ms` })
      throw error
    }
  }
}
