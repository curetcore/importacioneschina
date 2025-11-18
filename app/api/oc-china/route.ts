import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { generateTimestampId } from "@/lib/id-generator"
import { TallaDistribucion } from "@/lib/calculations"
import type { InputJsonValue } from "@prisma/client/runtime/library"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"
import { notDeletedFilter, getPrismaClient } from "@/lib/db-helpers"
import { auditCreate } from "@/lib/audit-logger"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { loggers, logWarning } from "@/lib/logger"
import { QueryCache, CacheInvalidator } from "@/lib/cache-helpers"
import { CacheTTL } from "@/lib/redis"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

interface OCItemInput {
  sku: string
  nombre: string
  material?: string | null
  color?: string | null
  especificaciones?: string | null
  tallaDistribucion?: TallaDistribucion | null
  cantidadTotal: number | string
  precioUnitarioUSD: number | string
}

interface OCItemValidado {
  sku: string
  nombre: string
  material: string | null
  color: string | null
  especificaciones: string | null
  tallaDistribucion?: InputJsonValue
  cantidadTotal: number
  precioUnitarioUSD: number
  subtotalUSD: number
}

// Función de validación para tallaDistribucion
function validarTallaDistribucion(tallas: unknown): InputJsonValue | undefined {
  if (!tallas) return undefined

  // Validar que sea un objeto
  if (typeof tallas !== "object" || Array.isArray(tallas)) {
    logWarning("tallaDistribucion inválida: no es un objeto", { tallas })
    return undefined
  }

  // Validar que todos los valores sean números positivos
  const tallasObj = tallas as Record<string, unknown>
  const tallasValidadas: TallaDistribucion = {}

  for (const [talla, cantidad] of Object.entries(tallasObj)) {
    const cantidadNum = typeof cantidad === "number" ? cantidad : parseInt(String(cantidad))

    if (isNaN(cantidadNum) || cantidadNum < 0) {
      logWarning(`tallaDistribucion[${talla}] inválida`, { talla, cantidad })
      continue // Saltar tallas inválidas
    }

    tallasValidadas[talla] = cantidadNum
  }

  return Object.keys(tallasValidadas).length > 0 ? tallasValidadas : undefined
}

// GET /api/oc-china - Obtener todas las órdenes de compra
export async function GET(request: NextRequest) {
  // Rate limiting para queries (60 req/min)
  const rateLimitError = await withRateLimit(request, RateLimits.query)
  if (rateLimitError) return rateLimitError

  try {
    // Obtener el cliente Prisma apropiado (demo o producción)
    const db = await getPrismaClient()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const requestedLimit = parseInt(searchParams.get("limit") || "20")
    // Validación de límite máximo para prevenir ataques de denegación de servicio
    const limit = Math.min(requestedLimit, 100) // Máximo 100 registros por página
    const search = searchParams.get("search") || ""
    const proveedor = searchParams.get("proveedor") || ""

    const skip = (page - 1) * limit

    // Cache key incluye parámetros de búsqueda para diferentes caches
    const cacheKey = `oc-china:list:${page}:${limit}:${search}:${proveedor}`

    const result = await QueryCache.list(
      cacheKey,
      async () => {
        const db = await getPrismaClient()

        const where = {
          ...notDeletedFilter,
          ...(search && {
            oc: {
              contains: search,
              mode: "insensitive" as const,
            },
          }),
          ...(proveedor && {
            proveedor: proveedor,
          }),
        }

        const [ocs, total] = await Promise.all([
          db.oCChina.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
              fechaOC: "desc",
            },
            include: {
              items: true,
              _count: {
                select: {
                  items: true,
                  pagosChina: true,
                  gastosLogisticos: true,
                  inventarioRecibido: true,
                },
              },
            },
          }),
          db.oCChina.count({ where }),
        ])

        return {
          ocs,
          pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
            limit,
          },
        }
      },
      CacheTTL.LISTINGS
    )

    return NextResponse.json({
      success: true,
      data: result.ocs,
      pagination: result.pagination,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/oc-china - Crear nueva orden de compra con items
export async function POST(request: NextRequest) {
  // Rate limiting para mutations (20 req/10s)
  const rateLimitError = await withRateLimit(request, RateLimits.mutation)
  if (rateLimitError) return rateLimitError

  try {
    // Obtener el cliente Prisma apropiado (demo o producción)
    const db = await getPrismaClient()

    const body = await request.json()

    const { proveedor, fechaOC, descripcionLote, categoriaPrincipal, items, adjuntos } = body

    // Validaciones básicas
    if (!proveedor || !fechaOC || !categoriaPrincipal) {
      throw Errors.badRequest("Faltan campos requeridos: proveedor, fechaOC o categoriaPrincipal")
    }

    // Validar que haya al menos un item
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw Errors.badRequest("Debe agregar al menos un producto a la orden")
    }

    // Validar y normalizar cada item (Problemas #1 y #2)
    const itemsValidados: OCItemValidado[] = []
    for (const item of items) {
      // Validaciones básicas
      if (!item.sku || !item.nombre) {
        return NextResponse.json(
          {
            success: false,
            error: "Cada producto debe tener SKU y nombre",
          },
          { status: 400 }
        )
      }

      // Validar cantidadTotal
      const cantidad = parseInt(item.cantidadTotal)
      if (isNaN(cantidad) || cantidad <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Cantidad inválida para ${item.sku}. Debe ser un número entero mayor a 0`,
          },
          { status: 400 }
        )
      }

      // Validar precioUnitarioUSD
      const precio = parseFloat(item.precioUnitarioUSD)
      if (isNaN(precio) || precio <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Precio inválido para ${item.sku}. Debe ser un número mayor a 0`,
          },
          { status: 400 }
        )
      }

      // Calcular subtotal
      const subtotal = precio * cantidad

      // Validar overflow (máximo razonable: $999,999.99)
      if (subtotal > 999999.99) {
        return NextResponse.json(
          {
            success: false,
            error: `Subtotal excede límite máximo para ${item.sku}: $${subtotal.toFixed(2)}`,
          },
          { status: 400 }
        )
      }

      // Validar tallaDistribucion de manera segura (Problema #9)
      const tallasValidadas = validarTallaDistribucion(item.tallaDistribucion)

      itemsValidados.push({
        sku: item.sku,
        nombre: item.nombre,
        material: item.material || null,
        color: item.color || null,
        especificaciones: item.especificaciones || null,
        tallaDistribucion: tallasValidadas,
        cantidadTotal: cantidad,
        precioUnitarioUSD: precio,
        subtotalUSD: subtotal,
      })
    }

    // Crear OC con items validados (con ID único basado en timestamp)
    let nuevaOC
    let retries = 0
    const maxRetries = 3

    while (retries < maxRetries) {
      try {
        // Generar ID único con timestamp (previene duplicados en concurrencia)
        const oc = generateTimestampId("OC")

        nuevaOC = await db.oCChina.create({
          data: {
            oc,
            proveedor,
            fechaOC: new Date(fechaOC),
            descripcionLote,
            categoriaPrincipal,
            adjuntos: adjuntos || null,
            items: {
              create: itemsValidados,
            },
          },
          include: {
            items: true,
          },
        })

        break // Éxito, salir del loop
      } catch (error: any) {
        // Si es error de duplicado, reintentar
        if (error.code === "P2002" && error.meta?.target?.includes("oc")) {
          retries++
          if (retries >= maxRetries) {
            throw Errors.conflict(
              "No se pudo generar un número de OC único después de varios intentos"
            )
          }
          // Esperar un poco antes de reintentar (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 100 * retries))
          continue
        }
        // Si es otro error, lanzarlo
        throw error
      }
    }

    if (!nuevaOC) {
      throw Errors.internal("Error inesperado al crear la orden")
    }

    // Audit log
    await auditCreate("OCChina", nuevaOC as any, request)

    // Invalidar cache
    await CacheInvalidator.invalidateOCChina(nuevaOC.id)

    return NextResponse.json(
      {
        success: true,
        data: nuevaOC,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
