/**
 * Cliente API con manejo robusto de errores y timeouts
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface FetchOptions extends RequestInit {
  timeout?: number
}

/**
 * Realiza una petición fetch con timeout y manejo de errores mejorado
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      throw new ApiError('La solicitud ha excedido el tiempo de espera', 408)
    }

    if (error instanceof TypeError) {
      throw new ApiError('Error de red. Por favor verifica tu conexión.', 0)
    }

    throw error
  }
}

/**
 * Realiza una petición GET con manejo de errores
 */
export async function apiGet<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'GET',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      error.error || `Error ${response.status}: ${response.statusText}`,
      response.status,
      error.details
    )
  }

  return response.json()
}

/**
 * Realiza una petición POST con manejo de errores
 */
export async function apiPost<T = any>(
  url: string,
  data: any,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      error.error || `Error ${response.status}: ${response.statusText}`,
      response.status,
      error.details
    )
  }

  return response.json()
}

/**
 * Realiza una petición PUT con manejo de errores
 */
export async function apiPut<T = any>(
  url: string,
  data: any,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      error.error || `Error ${response.status}: ${response.statusText}`,
      response.status,
      error.details
    )
  }

  return response.json()
}

/**
 * Realiza una petición DELETE con manejo de errores
 */
export async function apiDelete<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      error.error || `Error ${response.status}: ${response.statusText}`,
      response.status,
      error.details
    )
  }

  return response.json()
}

/**
 * Convierte un ApiError a un mensaje amigable para el usuario
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'Error de red. Por favor verifica tu conexión a internet.'
    }
    if (error.status === 408) {
      return 'La solicitud ha tardado demasiado. Por favor intenta de nuevo.'
    }
    if (error.status === 404) {
      return 'El recurso solicitado no fue encontrado.'
    }
    if (error.status === 500) {
      return 'Error en el servidor. Por favor intenta de nuevo más tarde.'
    }
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Ha ocurrido un error inesperado. Por favor intenta de nuevo.'
}

/**
 * Extrae detalles técnicos completos del error para debugging en desarrollo
 */
export function getErrorDetails(error: unknown): string | undefined {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
    return undefined
  }

  const details: Record<string, any> = {}

  if (error instanceof ApiError) {
    details.type = 'ApiError'
    details.message = error.message
    details.status = error.status
    details.details = error.details
    details.stack = error.stack
  } else if (error instanceof Error) {
    details.type = error.name
    details.message = error.message
    details.stack = error.stack
  } else {
    details.type = 'Unknown'
    details.raw = error
  }

  return JSON.stringify(details, null, 2)
}
