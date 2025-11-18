import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { z } from "zod"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { auditCreate } from "@/lib/audit-logger"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

const configuracionSchema = z.object({
  categoria: z.enum([
    "categorias",
    "tiposPago",
    "metodosPago",
    "bodegas",
    "tiposGasto",
    "proveedores",
  ]),
  valor: z.string().min(1, "El valor es requerido"),
  orden: z.number().int().default(0),
})

// GET /api/configuracion - Obtener todas las configuraciones o filtrar por categoría
export async function GET(request: NextRequest) {
  try {
    // Rate limiting para queries - 60 req/60s
    const rateLimitError = await withRateLimit(request, RateLimits.query)
    if (rateLimitError) return rateLimitError

    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get("categoria")

    // Get Prisma client OUTSIDE of cache (because it uses headers())
    const db = await getPrismaClient()

    // Fetch configurations (no cache needed for config - changes rarely and is small)
    const whereClause = categoria ? { categoria, activo: true } : { activo: true }

    const configuraciones = await db.configuracion.findMany({
      where: whereClause,
      orderBy: [{ categoria: "asc" }, { orden: "asc" }, { valor: "asc" }],
    })

    // Agrupar por categoría si no hay filtro específico
    const data = categoria
      ? configuraciones
      : configuraciones.reduce(
          (acc, config) => {
            if (!acc[config.categoria]) {
              acc[config.categoria] = []
            }
            acc[config.categoria].push(config)
            return acc
          },
          {} as Record<string, typeof configuraciones>
        )

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/configuracion - Crear nueva configuración
export async function POST(request: NextRequest) {
  try {
    // Rate limiting para mutations - 20 req/10s
    const rateLimitError = await withRateLimit(request, RateLimits.mutation)
    if (rateLimitError) return rateLimitError

    const db = await getPrismaClient()
    const body = await request.json()
    const validatedData = configuracionSchema.parse(body)

    // Verificar si ya existe
    const existing = await db.configuracion.findUnique({
      where: {
        categoria_valor: {
          categoria: validatedData.categoria,
          valor: validatedData.valor,
        },
      },
    })

    if (existing) {
      throw Errors.conflict("Ya existe una configuración con ese valor en esta categoría")
    }

    const configuracion = await db.configuracion.create({
      data: {
        categoria: validatedData.categoria,
        valor: validatedData.valor,
        orden: validatedData.orden,
      },
    })

    // Audit log
    await auditCreate("Configuracion", configuracion as any, request)

    return NextResponse.json(
      {
        success: true,
        data: configuracion,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
