import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateProductoSchema, validarTallasDisponibles, validarImagenesAdicionales } from "@/lib/validations/producto"
import { z } from "zod"

// GET /api/productos/[id] - Obtener producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const producto = await prisma.producto.findUnique({
      where: { id: params.id },
      include: {
        proveedor: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            email: true,
            telefono: true,
          },
        },
      },
    })

    if (!producto) {
      return NextResponse.json(
        {
          success: false,
          error: "Producto no encontrado",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: producto,
    })
  } catch (error) {
    console.error("❌ Error al obtener producto:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al obtener producto",
      },
      { status: 500 }
    )
  }
}

// PUT /api/productos/[id] - Actualizar producto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validar datos
    const validatedData = updateProductoSchema.parse(body)

    // Verificar que el producto existe
    const existingProducto = await prisma.producto.findUnique({
      where: { id: params.id },
    })

    if (!existingProducto) {
      return NextResponse.json(
        {
          success: false,
          error: "Producto no encontrado",
        },
        { status: 404 }
      )
    }

    // Si se está cambiando el SKU, verificar que no exista
    if (validatedData.sku && validatedData.sku !== existingProducto.sku) {
      const skuExists = await prisma.producto.findUnique({
        where: { sku: validatedData.sku },
      })

      if (skuExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Ya existe un producto con ese SKU",
          },
          { status: 400 }
        )
      }
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

    // Preparar datos para actualización
    const updateData: any = {}

    if (validatedData.sku) updateData.sku = validatedData.sku
    if (validatedData.nombre) updateData.nombre = validatedData.nombre
    if (validatedData.proveedorId !== undefined) updateData.proveedorId = validatedData.proveedorId
    if (validatedData.descripcion !== undefined) updateData.descripcion = validatedData.descripcion
    if (validatedData.material !== undefined) updateData.material = validatedData.material
    if (validatedData.color !== undefined) updateData.color = validatedData.color
    if (validatedData.categoria !== undefined) updateData.categoria = validatedData.categoria
    if (validatedData.precioReferenciaUSD !== undefined) {
      updateData.precioReferenciaUSD = validatedData.precioReferenciaUSD
      updateData.ultimaActualizacionPrecio = new Date()
    }
    if (validatedData.precioReferenciaCNY !== undefined) {
      updateData.precioReferenciaCNY = validatedData.precioReferenciaCNY
      updateData.ultimaActualizacionPrecio = new Date()
    }
    if (validatedData.especificaciones !== undefined) updateData.especificaciones = validatedData.especificaciones
    if (validatedData.tallasDisponibles !== undefined) {
      updateData.tallasDisponibles = validarTallasDisponibles(validatedData.tallasDisponibles)
    }
    if (validatedData.imagenPrincipal !== undefined) updateData.imagenPrincipal = validatedData.imagenPrincipal || undefined
    if (validatedData.imagenesAdicionales !== undefined) {
      updateData.imagenesAdicionales = validarImagenesAdicionales(validatedData.imagenesAdicionales)
    }
    if (validatedData.fichatecnica !== undefined) updateData.fichatecnica = validatedData.fichatecnica || undefined
    if (validatedData.activo !== undefined) updateData.activo = validatedData.activo

    // Actualizar producto
    const producto = await prisma.producto.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: producto,
    })
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error)

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
        error: error instanceof Error ? error.message : "Error desconocido al actualizar producto",
      },
      { status: 500 }
    )
  }
}

// DELETE /api/productos/[id] - Eliminar producto (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el producto existe
    const producto = await prisma.producto.findUnique({
      where: { id: params.id },
    })

    if (!producto) {
      return NextResponse.json(
        {
          success: false,
          error: "Producto no encontrado",
        },
        { status: 404 }
      )
    }

    // Soft delete: marcar como inactivo
    const productoDeleted = await prisma.producto.update({
      where: { id: params.id },
      data: { activo: false },
    })

    return NextResponse.json({
      success: true,
      data: productoDeleted,
    })
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al eliminar producto",
      },
      { status: 500 }
    )
  }
}
