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
