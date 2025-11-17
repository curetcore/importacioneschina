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

// GET /api/pagos-china - Obtener todos los pagos
export async function GET(request: NextRequest) {
  // Rate limiting para queries (60 req/min)
  const rateLimitError = await withRateLimit(request, RateLimits.query)
  if (rateLimitError) return rateLimitError

  try {
    const db = await getPrismaClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const requestedLimit = parseInt(searchParams.get("limit") || "20")
    // Validación de límite máximo para prevenir ataques de denegación de servicio
    const limit = Math.min(requestedLimit, 100) // Máximo 100 registros por página
    const search = searchParams.get("search") || ""
    const ocId = searchParams.get("ocId") || ""
    const moneda = searchParams.get("moneda") || ""

    const skip = (page - 1) * limit

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

    return NextResponse.json({
      success: true,
      data: pagos,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
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

    const montoRDNeto = calcularMontoRDNeto(montoRD, validatedData.comisionBancoRD)

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
        comisionBancoRD: new Prisma.Decimal(validatedData.comisionBancoRD),
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
