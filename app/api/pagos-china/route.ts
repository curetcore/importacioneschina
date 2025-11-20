import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { pagosChinaSchema } from "@/lib/validations"
import { calcularMontoRD, calcularMontoRDNeto } from "@/lib/calculations"
import { generateUniqueId } from "@/lib/id-generator"
import { Prisma } from "@prisma/client"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"
import { notDeletedFilter } from "@/lib/db-helpers"
import { auditCreate } from "@/lib/audit-logger"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { QueryCache, CacheInvalidator } from "@/lib/cache-helpers"
import { CacheTTL } from "@/lib/redis"
import { triggerRecordCreated, CHANNELS } from "@/lib/pusher-events"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

// GET /api/pagos-china - Obtener todos los pagos
export async function GET(request: NextRequest) {
  // Rate limiting para queries (60 req/min)
  const rateLimitError = await withRateLimit(request, RateLimits.query)
  if (rateLimitError) return rateLimitError

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const requestedLimit = parseInt(searchParams.get("limit") || "20")
    // Validación de límite máximo para prevenir ataques de denegación de servicio
    const limit = Math.min(requestedLimit, 100) // Máximo 100 registros por página
    const search = searchParams.get("search") || ""
    const ocId = searchParams.get("ocId") || ""
    const moneda = searchParams.get("moneda") || ""

    const skip = (page - 1) * limit

    // Cache key incluye parámetros de búsqueda para diferentes caches
    const cacheKey = `pagos-china:list:${page}:${limit}:${search}:${ocId}:${moneda}`

    const result = await QueryCache.list(
      cacheKey,
      async () => {
        const db = await getPrismaClient()

        const where: Prisma.PagosChinaWhereInput = {
          ...notDeletedFilter,
          ...(search && {
            idPago: {
              contains: search,
              mode: "insensitive",
            },
          }),
          ...(ocId && {
            ocId: ocId,
          }),
          ...(moneda && {
            moneda: moneda,
          }),
        }

        const [pagos, total] = await Promise.all([
          db.pagosChina.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
              fechaPago: "desc",
            },
            include: {
              ocChina: {
                select: {
                  oc: true,
                  proveedor: true,
                },
              },
            },
          }),
          db.pagosChina.count({ where }),
        ])

        return {
          pagos,
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
      data: result.pagos,
      pagination: result.pagination,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/pagos-china - Crear nuevo pago
export async function POST(request: NextRequest) {
  // Rate limiting para mutations (20 req/10s)
  const rateLimitError = await withRateLimit(request, RateLimits.mutation)
  if (rateLimitError) return rateLimitError

  try {
    const db = await getPrismaClient()
    const body = await request.json()

    // Generar ID automático secuencial (thread-safe)
    const idPago = await generateUniqueId("pagosChina", "idPago", "PAG")

    // Validar con Zod (sin necesidad de idPago en el body)
    const validatedData = pagosChinaSchema.parse(body)

    // Extraer adjuntos (no validado por Zod)
    const { adjuntos } = body

    // Verificar que la OC existe
    const oc = await db.oCChina.findUnique({
      where: { id: validatedData.ocId },
    })

    if (!oc) {
      throw Errors.notFound("Orden de compra", validatedData.ocId)
    }

    // Calcular montoRD y montoRDNeto
    const montoRD = calcularMontoRD(
      validatedData.montoOriginal,
      validatedData.moneda,
      validatedData.tasaCambio
    )

    // Convertir comisión USD a RD$ usando la tasa de cambio
    const comisionRD = validatedData.comisionBancoUSD * validatedData.tasaCambio

    const montoRDNeto = calcularMontoRDNeto(montoRD, comisionRD)

    // Crear el pago
    const nuevoPago = await db.pagosChina.create({
      data: {
        idPago,
        ocId: validatedData.ocId,
        fechaPago: validatedData.fechaPago,
        tipoPago: validatedData.tipoPago,
        metodoPago: validatedData.metodoPago,
        moneda: validatedData.moneda,
        montoOriginal: new Prisma.Decimal(validatedData.montoOriginal),
        tasaCambio: new Prisma.Decimal(validatedData.tasaCambio),
        comisionBancoUSD: new Prisma.Decimal(validatedData.comisionBancoUSD),
        montoRD: new Prisma.Decimal(montoRD),
        montoRDNeto: new Prisma.Decimal(montoRDNeto),
        adjuntos: adjuntos || null,
      },
      include: {
        ocChina: {
          select: {
            oc: true,
            proveedor: true,
          },
        },
      },
    })

    // Audit log
    await auditCreate("PagosChina", nuevoPago as any, request)

    // Invalidar cache
    await CacheInvalidator.invalidatePagosChina(validatedData.ocId)

    // Trigger real-time event (fail-safe, won't block if Pusher is down)
    await triggerRecordCreated(CHANNELS.PAYMENTS, nuevoPago)

    return NextResponse.json(
      {
        success: true,
        data: nuevoPago,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
