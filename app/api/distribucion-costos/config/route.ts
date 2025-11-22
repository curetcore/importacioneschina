import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { auditUpdate } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

// GET - Fetch distribution configuration
export async function GET(request: NextRequest) {
  try {
    const db = await getPrismaClient()
    const configs = await db.configuracionDistribucionCostos.findMany({
      where: { activo: true },
      orderBy: { tipoCosto: "asc" },
    })

    return NextResponse.json({
      success: true,
      data: configs,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT - Update distribution method for a cost type
export async function PUT(request: NextRequest) {
  try {
    const db = await getPrismaClient()
    const body = await request.json()
    const { tipoCosto, metodoDistribucion } = body

    if (!tipoCosto || !metodoDistribucion) {
      throw Errors.badRequest("tipoCosto y metodoDistribucion son requeridos")
    }

    // Validate metodoDistribucion
    const validMethods = ["peso", "volumen", "valor_fob", "unidades", "cajas"]
    if (!validMethods.includes(metodoDistribucion)) {
      throw Errors.badRequest("Método de distribución inválido")
    }

    // Get existing config for audit
    const existing = await db.configuracionDistribucionCostos.findUnique({
      where: { tipoCosto },
    })

    // Upsert the configuration
    const config = await db.configuracionDistribucionCostos.upsert({
      where: { tipoCosto },
      create: {
        tipoCosto,
        metodoDistribucion,
        activo: true,
      },
      update: {
        metodoDistribucion,
        updatedAt: new Date(),
      },
    })

    // Audit log
    if (existing) {
      await auditUpdate("ConfiguracionDistribucionCostos", existing as any, config as any, request)
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: "Configuración actualizada exitosamente",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
