import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { productoSchema, validarTallasDisponibles, validarImagenesAdicionales } from "@/lib/validations/producto"
import { z } from "zod"

// GET /api/productos - Obtener todos los productos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activo = searchParams.get("activo")
    const proveedorId = searchParams.get("proveedorId")

    const whereClause: any = {}
    if (activo !== null) whereClause.activo = activo === "true"
    if (proveedorId) whereClause.proveedorId = proveedorId

    const productos = await prisma.producto.findMany({
      where: whereClause,
      include: {
        proveedor: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        nombre: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      data: productos,
    })
  } catch (error) {
    console.error("❌ Error al obtener productos:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al obtener productos",
      },
      { status: 500 }
    )
  }
}

// POST /api/productos - Crear nuevo producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar datos
    const validatedData = productoSchema.parse(body)

    // Verificar que el SKU no exista
    const existingProducto = await prisma.producto.findUnique({
      where: { sku: validatedData.sku },
    })

    if (existingProducto) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe un producto con ese SKU",
        },
        { status: 400 }
      )
    }

    // Si tiene proveedorId, verificar que exista
    if (validatedData.proveedorId) {
      const proveedor = await prisma.proveedor.findUnique({
        where: { id: validatedData.proveedorId },
      })

      if (!proveedor) {
        return NextResponse.json(
          {
            success: false,
            error: "Proveedor no encontrado",
          },
          { status: 400 }
        )
      }
    }

    // Crear producto
    const producto = await prisma.producto.create({
      data: {
        sku: validatedData.sku,
        nombre: validatedData.nombre,
        proveedorId: validatedData.proveedorId,
        descripcion: validatedData.descripcion,
        material: validatedData.material,
        color: validatedData.color,
        categoria: validatedData.categoria,
        precioReferenciaUSD: validatedData.precioReferenciaUSD,
        precioReferenciaCNY: validatedData.precioReferenciaCNY,
        ultimaActualizacionPrecio: validatedData.precioReferenciaUSD || validatedData.precioReferenciaCNY ? new Date() : undefined,
        especificaciones: validatedData.especificaciones,
        tallasDisponibles: validarTallasDisponibles(validatedData.tallasDisponibles),
        imagenPrincipal: validatedData.imagenPrincipal || undefined,
        imagenesAdicionales: validarImagenesAdicionales(validatedData.imagenesAdicionales),
        fichatecnica: validatedData.fichatecnica || undefined,
        activo: validatedData.activo,
      },
      include: {
        proveedor: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: producto,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Error al crear producto:", error)

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
        error: error instanceof Error ? error.message : "Error desconocido al crear producto",
      },
      { status: 500 }
    )
  }
}
