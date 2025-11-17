import { NextResponse } from "next/server"

/**
 * Códigos de error estándar de la API
 */
export enum ErrorCode {
  // Errores de cliente (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  CONFLICT = "CONFLICT",

  // Errores de servidor (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

/**
 * Mapeo de códigos de error a status HTTP
 */
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
}

/**
 * Clase de error personalizada para la API
 */
export class ApiError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: any

  constructor(code: ErrorCode, message: string, details?: any) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.statusCode = ERROR_STATUS_MAP[code]
    this.details = details

    // Mantener stack trace en desarrollo
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }

  /**
   * Convierte el error a respuesta JSON
   */
  toResponse(): NextResponse {
    const isDevelopment = process.env.NODE_ENV === "development"

    return NextResponse.json(
      {
        success: false,
        error: this.message,
        code: this.code,
        ...(this.details && { details: this.details }),
        ...(isDevelopment && { stack: this.stack }),
      },
      { status: this.statusCode }
    )
  }
}

/**
 * Helper para crear errores comunes
 */
export const Errors = {
  badRequest: (message: string, details?: any) =>
    new ApiError(ErrorCode.BAD_REQUEST, message, details),

  unauthorized: (message = "No autorizado") => new ApiError(ErrorCode.UNAUTHORIZED, message),

  forbidden: (message = "Acceso denegado") => new ApiError(ErrorCode.FORBIDDEN, message),

  notFound: (resource: string, id?: string) =>
    new ApiError(
      ErrorCode.NOT_FOUND,
      id ? `${resource} con ID ${id} no encontrado` : `${resource} no encontrado`
    ),

  validation: (message: string, details?: any) =>
    new ApiError(ErrorCode.VALIDATION_ERROR, message, details),

  conflict: (message: string, details?: any) => new ApiError(ErrorCode.CONFLICT, message, details),

  internal: (message = "Error interno del servidor") =>
    new ApiError(ErrorCode.INTERNAL_ERROR, message),

  database: (message = "Error de base de datos", details?: any) =>
    new ApiError(ErrorCode.DATABASE_ERROR, message, details),
}

/**
 * Handler global de errores para API routes
 * Usar en todos los try/catch de API endpoints
 */
export function handleApiError(error: unknown): NextResponse {
  // Si ya es un ApiError, retornar su respuesta
  if (error instanceof ApiError) {
    console.error(`[API Error ${error.code}]`, error.message, error.details)
    return error.toResponse()
  }

  // Errores de Prisma
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as any

    // P2002: Unique constraint violation
    if (prismaError.code === "P2002") {
      const field = prismaError.meta?.target?.[0] || "campo"
      return Errors.conflict(`Ya existe un registro con ese ${field}`, {
        field,
        code: prismaError.code,
      }).toResponse()
    }

    // P2025: Record not found
    if (prismaError.code === "P2025") {
      return Errors.notFound("Registro").toResponse()
    }

    // P2003: Foreign key constraint
    if (prismaError.code === "P2003") {
      return Errors.badRequest("No se puede eliminar: existen registros relacionados", {
        code: prismaError.code,
      }).toResponse()
    }

    // Otros errores de Prisma
    console.error("[Prisma Error]", prismaError)
    return Errors.database("Error de base de datos", {
      code: prismaError.code,
    }).toResponse()
  }

  // Error genérico de JavaScript
  if (error instanceof Error) {
    console.error("[Unexpected Error]", error.message, error.stack)
    return Errors.internal(
      process.env.NODE_ENV === "development" ? error.message : "Error interno del servidor"
    ).toResponse()
  }

  // Error desconocido
  console.error("[Unknown Error]", error)
  return Errors.internal().toResponse()
}

/**
 * Wrapper para API routes que maneja errores automáticamente
 *
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await prisma.user.findMany()
 *   return NextResponse.json({ success: true, data })
 * })
 */
export function withErrorHandler<T extends any[]>(handler: (...args: T) => Promise<NextResponse>) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
