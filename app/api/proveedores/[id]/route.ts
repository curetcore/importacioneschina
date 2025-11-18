import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { updateProveedorSchema } from "@/lib/validations/proveedor"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { auditUpdate, auditDelete } from "@/lib/audit-logger"
import { CacheInvalidator } from "@/lib/cache-helpers"

// GET /api/proveedores/[id] - Obtener proveedor por ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const proveedor = await db.proveedor.findUnique({
      where: { id: params.id },
    })

    if (!proveedor) {
      throw Errors.notFound("Proveedor", params.id)
    }

    return NextResponse.json({
      success: true,
      data: proveedor,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/proveedores/[id] - Actualizar proveedor
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const body = await request.json()

    // Validar datos
    const validatedData = updateProveedorSchema.parse(body)

    // Verificar que el proveedor existe
    const existingProveedor = await db.proveedor.findUnique({
      where: { id: params.id },
    })

    if (!existingProveedor) {
      throw Errors.notFound("Proveedor", params.id)
    }

    // Si se está cambiando el código, verificar que no exista
    if (validatedData.codigo && validatedData.codigo !== existingProveedor.codigo) {
      const codigoExists = await db.proveedor.findUnique({
        where: { codigo: validatedData.codigo },
      })

      if (codigoExists) {
        throw Errors.conflict("Ya existe un proveedor con ese código")
      }
    }

    // Actualizar proveedor
    const proveedor = await db.proveedor.update({
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

    // Audit log
    await auditUpdate("Proveedor", existingProveedor as any, proveedor as any, request)

    // Invalidar cache de proveedores
    await CacheInvalidator.invalidateProveedores()

    return NextResponse.json({
      success: true,
      data: proveedor,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/proveedores/[id] - Eliminar proveedor (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()

    // Verificar que el proveedor existe
    const proveedor = await db.proveedor.findUnique({
      where: { id: params.id },
    })

    if (!proveedor) {
      throw Errors.notFound("Proveedor", params.id)
    }

    // Soft delete: marcar como inactivo
    const proveedorDeleted = await db.proveedor.update({
      where: { id: params.id },
      data: { activo: false },
    })

    // Audit log
    await auditDelete("Proveedor", proveedor as any, request)

    // Invalidar cache de proveedores
    await CacheInvalidator.invalidateProveedores()

    return NextResponse.json({
      success: true,
      data: proveedorDeleted,
      message: "Proveedor marcado como inactivo exitosamente",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
