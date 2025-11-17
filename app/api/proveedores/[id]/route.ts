import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateProveedorSchema } from "@/lib/validations/proveedor"
import { z } from "zod"

// GET /api/proveedores/[id] - Obtener proveedor por ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: params.id },
    })

    if (!proveedor) {
      return NextResponse.json(
        {
          success: false,
          error: "Proveedor no encontrado",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: proveedor,
    })
  } catch (error) {
    console.error("❌ Error al obtener proveedor:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al obtener proveedor",
      },
      { status: 500 }
    )
  }
}

// PUT /api/proveedores/[id] - Actualizar proveedor
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    // Validar datos
    const validatedData = updateProveedorSchema.parse(body)

    // Verificar que el proveedor existe
    const existingProveedor = await prisma.proveedor.findUnique({
      where: { id: params.id },
    })

    if (!existingProveedor) {
      return NextResponse.json(
        {
          success: false,
          error: "Proveedor no encontrado",
        },
        { status: 404 }
      )
    }

    // Si se está cambiando el código, verificar que no exista
    if (validatedData.codigo && validatedData.codigo !== existingProveedor.codigo) {
      const codigoExists = await prisma.proveedor.findUnique({
        where: { codigo: validatedData.codigo },
      })

      if (codigoExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Ya existe un proveedor con ese código",
          },
          { status: 400 }
        )
      }
    }

    // Actualizar proveedor
    const proveedor = await prisma.proveedor.update({
      where: { id: params.id },
      data: {
        ...(validatedData.codigo && { codigo: validatedData.codigo }),
        ...(validatedData.nombre && { nombre: validatedData.nombre }),
        ...(validatedData.contactoPrincipal !== undefined && {
          contactoPrincipal: validatedData.contactoPrincipal,
        }),
        ...(validatedData.email !== undefined && { email: validatedData.email || undefined }),
        ...(validatedData.telefono !== undefined && { telefono: validatedData.telefono }),
        ...(validatedData.whatsapp !== undefined && { whatsapp: validatedData.whatsapp }),
        ...(validatedData.wechat !== undefined && { wechat: validatedData.wechat }),
        ...(validatedData.pais !== undefined && { pais: validatedData.pais }),
        ...(validatedData.ciudad !== undefined && { ciudad: validatedData.ciudad }),
        ...(validatedData.direccion !== undefined && { direccion: validatedData.direccion }),
        ...(validatedData.sitioWeb !== undefined && {
          sitioWeb: validatedData.sitioWeb || undefined,
        }),
        ...(validatedData.categoriaProductos !== undefined && {
          categoriaProductos: validatedData.categoriaProductos,
        }),
        ...(validatedData.tiempoEntregaDias !== undefined && {
          tiempoEntregaDias: validatedData.tiempoEntregaDias,
        }),
        ...(validatedData.monedaPreferida !== undefined && {
          monedaPreferida: validatedData.monedaPreferida,
        }),
        ...(validatedData.terminosPago !== undefined && {
          terminosPago: validatedData.terminosPago,
        }),
        ...(validatedData.minimoOrden !== undefined && { minimoOrden: validatedData.minimoOrden }),
        ...(validatedData.notas !== undefined && { notas: validatedData.notas }),
        ...(validatedData.calificacion !== undefined && {
          calificacion: validatedData.calificacion,
        }),
        ...(validatedData.activo !== undefined && { activo: validatedData.activo }),
      },
    })

    return NextResponse.json({
      success: true,
      data: proveedor,
    })
  } catch (error) {
    console.error("❌ Error al actualizar proveedor:", error)

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
        error: error instanceof Error ? error.message : "Error desconocido al actualizar proveedor",
      },
      { status: 500 }
    )
  }
}

// DELETE /api/proveedores/[id] - Eliminar proveedor (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar que el proveedor existe
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: params.id },
    })

    if (!proveedor) {
      return NextResponse.json(
        {
          success: false,
          error: "Proveedor no encontrado",
        },
        { status: 404 }
      )
    }

    // Soft delete: marcar como inactivo
    const proveedorDeleted = await prisma.proveedor.update({
      where: { id: params.id },
      data: { activo: false },
    })

    return NextResponse.json({
      success: true,
      data: proveedorDeleted,
    })
  } catch (error) {
    console.error("❌ Error al eliminar proveedor:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al eliminar proveedor",
      },
      { status: 500 }
    )
  }
}
