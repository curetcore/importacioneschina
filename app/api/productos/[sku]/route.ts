import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"

/**
 * PATCH /api/productos/[sku]
 * Actualizar precio de venta de un producto
 */
export async function PATCH(request: Request, { params }: { params: { sku: string } }) {
  try {
    const prisma = getPrismaClient()
    const { sku } = params
    const body = await request.json()
    const { precioVenta } = body

    if (!sku) {
      return NextResponse.json(
        {
          success: false,
          error: "SKU es requerido",
        },
        { status: 400 }
      )
    }

    // Validar precio de venta
    if (precioVenta !== null && precioVenta !== undefined) {
      const precio = parseFloat(precioVenta)
      if (isNaN(precio) || precio < 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Precio de venta debe ser un número positivo",
          },
          { status: 400 }
        )
      }
    }

    // Buscar si ya existe el producto
    let producto = await prisma.producto.findUnique({
      where: { sku },
    })

    if (producto) {
      // Actualizar producto existente
      producto = await prisma.producto.update({
        where: { sku },
        data: {
          precioVenta: precioVenta ? parseFloat(precioVenta) : null,
        },
      })
    } else {
      // Obtener nombre del producto desde items
      const item = await prisma.oCChinaItem.findFirst({
        where: {
          sku,
          deletedAt: null,
        },
        select: {
          nombre: true,
        },
      })

      if (!item) {
        return NextResponse.json(
          {
            success: false,
            error: "Producto no encontrado en inventario",
          },
          { status: 404 }
        )
      }

      // Crear nuevo producto con precio de venta
      producto = await prisma.producto.create({
        data: {
          sku,
          nombre: item.nombre,
          precioVenta: precioVenta ? parseFloat(precioVenta) : null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: producto,
      message: "Precio de venta actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error updating producto:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar precio de venta",
      },
      { status: 500 }
    )
  }
}
