import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { gastosLogisticosSchema } from "@/lib/validations"
import { generateUniqueId } from "@/lib/id-generator"
import { Prisma } from "@prisma/client"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"
import { notDeletedFilter } from "@/lib/db-helpers"
import { auditCreate } from "@/lib/audit-logger"
import { handleApiError, Errors } from "@/lib/api-error-handler"

// GET /api/gastos-logisticos - Obtener todos los gastos
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
    const tipoGasto = searchParams.get("tipoGasto") || ""

    const skip = (page - 1) * limit

    const where: Prisma.GastosLogisticosWhereInput = {
      ...notDeletedFilter,
      ...(search && {
        idGasto: {
          contains: search,
          mode: "insensitive",
        },
      }),
      ...(ocId && {
        ordenesCompra: {
          some: {
            ocId: ocId,
          },
        },
      }),
      ...(tipoGasto && {
        tipoGasto: tipoGasto,
      }),
    }

    const [gastos, total] = await Promise.all([
      db.gastosLogisticos.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          fechaGasto: "desc",
        },
        include: {
          ordenesCompra: {
            include: {
              ocChina: {
                select: {
                  oc: true,
                  proveedor: true,
                },
              },
            },
          },
        },
      }),
      db.gastosLogisticos.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: gastos,
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

// POST /api/gastos-logisticos - Crear nuevo gasto
export async function POST(request: NextRequest) {
  // Rate limiting para mutations (20 req/10s)
  const rateLimitError = await withRateLimit(request, RateLimits.mutation)
  if (rateLimitError) return rateLimitError

  try {
    const db = await getPrismaClient()
    const body = await request.json()

    // Generar ID automático secuencial (thread-safe)
    const idGasto = await generateUniqueId("gastosLogisticos", "idGasto", "GASTO")

    // Validar con Zod (sin necesidad de idGasto en el body)
    const validatedData = gastosLogisticosSchema.parse(body)

    // Extraer adjuntos (no validado por Zod)
    const { adjuntos } = body

    // Verificar que TODAS las OCs existen
    for (const ocId of validatedData.ocIds) {
      const oc = await db.oCChina.findUnique({
        where: { id: ocId },
      })

      if (!oc) {
        throw Errors.notFound("Orden de compra", ocId)
      }
    }

    // Crear el gasto
    const nuevoGasto = await db.gastosLogisticos.create({
      data: {
        idGasto,
        fechaGasto: validatedData.fechaGasto,
        tipoGasto: validatedData.tipoGasto,
        proveedorServicio: validatedData.proveedorServicio,
        metodoPago: validatedData.metodoPago,
        montoRD: new Prisma.Decimal(validatedData.montoRD),
        notas: validatedData.notas,
        adjuntos: adjuntos || null,
        ordenesCompra: {
          create: validatedData.ocIds.map((ocId) => ({
            ocId,
          })),
        },
      },
      include: {
        ordenesCompra: {
          include: {
            ocChina: {
              select: {
                oc: true,
                proveedor: true,
              },
            },
          },
        },
      },
    })

    // Audit log
    await auditCreate("GastosLogisticos", nuevoGasto as any, request)

    return NextResponse.json(
      {
        success: true,
        data: nuevoGasto,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
