import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET - Fetch distribution configuration
export async function GET(request: NextRequest) {
  try {
    const configs = await prisma.configuracionDistribucionCostos.findMany({
      where: { activo: true },
      orderBy: { tipoCosto: "asc" },
    })

    return NextResponse.json({
      success: true,
      data: configs,
    })
  } catch (error) {
    console.error("Error fetching distribution config:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar configuración de distribución",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

// PUT - Update distribution method for a cost type
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipoCosto, metodoDistribucion } = body

    if (!tipoCosto || !metodoDistribucion) {
      return NextResponse.json(
        {
          success: false,
          error: "tipoCosto y metodoDistribucion son requeridos",
        },
        { status: 400 }
      )
    }

    // Validate metodoDistribucion
    const validMethods = ["peso", "volumen", "valor_fob", "unidades"]
    if (!validMethods.includes(metodoDistribucion)) {
      return NextResponse.json(
        {
          success: false,
          error: "Método de distribución inválido",
        },
        { status: 400 }
      )
    }

    // Upsert the configuration
    const config = await prisma.configuracionDistribucionCostos.upsert({
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

    return NextResponse.json({
      success: true,
      data: config,
      message: "Configuración actualizada exitosamente",
    })
  } catch (error) {
    console.error("Error updating distribution config:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar configuración de distribución",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}
