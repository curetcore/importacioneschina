import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { proveedorSchema } from "@/lib/validations/proveedor"
import { z } from "zod"

// GET /api/proveedores - Obtener todos los proveedores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activo = searchParams.get("activo")

    const whereClause = activo !== null ? { activo: activo === "true" } : {}

    const proveedores = await prisma.proveedor.findMany({
      where: whereClause,
      orderBy: {
        nombre: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      data: proveedores,
    })
  } catch (error) {
    console.error("❌ Error al obtener proveedores:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al obtener proveedores",
      },
      { status: 500 }
    )
  }
}

// POST /api/proveedores - Crear nuevo proveedor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar datos
    const validatedData = proveedorSchema.parse(body)

    // Auto-generar código si no se proporciona
    let codigo = validatedData.codigo
    if (!codigo) {
      // Obtener el último proveedor para generar el siguiente código
      const lastProveedor = await prisma.proveedor.findFirst({
        orderBy: { codigo: "desc" },
        select: { codigo: true },
      })

      if (lastProveedor) {
        // Extraer el número del código (ej: "PROV-005" -> 5)
        const match = lastProveedor.codigo.match(/PROV-(\d+)/)
        const nextNumber = match ? parseInt(match[1]) + 1 : 1
        codigo = `PROV-${String(nextNumber).padStart(3, "0")}`
      } else {
        codigo = "PROV-001"
      }
    }

    // Crear proveedor
    const proveedor = await prisma.proveedor.create({
      data: {
        codigo,
        nombre: validatedData.nombre,
        contactoPrincipal: validatedData.contactoPrincipal,
        email: validatedData.email || undefined,
        telefono: validatedData.telefono,
        whatsapp: validatedData.whatsapp,
        wechat: validatedData.wechat,
        pais: validatedData.pais,
        ciudad: validatedData.ciudad,
        direccion: validatedData.direccion,
        sitioWeb: validatedData.sitioWeb || undefined,
        categoriaProductos: validatedData.categoriaProductos,
        tiempoEntregaDias: validatedData.tiempoEntregaDias,
        monedaPreferida: validatedData.monedaPreferida,
        terminosPago: validatedData.terminosPago,
        minimoOrden: validatedData.minimoOrden,
        notas: validatedData.notas,
        calificacion: validatedData.calificacion,
        activo: validatedData.activo,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: proveedor,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Error al crear proveedor:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos inválidos",
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al crear proveedor",
      },
      { status: 500 }
    )
  }
}
