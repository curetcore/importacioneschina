import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { z } from "zod"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { auditUpdate, auditDelete } from "@/lib/audit-logger"
import { CacheTags, invalidateCache } from "@/lib/cache"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

const updateSchema = z.object({
  valor: z.string().min(1, "El valor es requerido").optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
})

// PUT /api/configuracion/[id] - Actualizar configuración
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params
    const body = await request.json()

    // Verificar que existe
    const existing = await db.configuracion.findUnique({
      where: { id },
    })

    if (!existing) {
      throw Errors.notFound("Configuración", id)
    }

    const validatedData = updateSchema.parse(body)

    // Si se está cambiando el valor, verificar que no exista otro con ese valor
    if (validatedData.valor && validatedData.valor !== existing.valor) {
      const duplicate = await db.configuracion.findUnique({
        where: {
          categoria_valor: {
            categoria: existing.categoria,
            valor: validatedData.valor,
          },
        },
      })

      if (duplicate) {
        throw Errors.conflict("Ya existe una configuración con ese valor en esta categoría")
      }
    }

    const updated = await db.configuracion.update({
      where: { id },
      data: validatedData,
    })

    // Audit log
    await auditUpdate("Configuracion", existing as any, updated as any, request)

    // Invalidate cache after update
    invalidateCache(CacheTags.CONFIGURACION)

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/configuracion/[id] - Eliminar configuración (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params

    const existing = await db.configuracion.findUnique({
      where: { id },
    })

    if (!existing) {
      throw Errors.notFound("Configuración", id)
    }

    // Verificar si está en uso antes de eliminar
    const inUse = await checkConfigurationInUse(db, existing.categoria, existing.valor)

    if (inUse.isUsed) {
      throw Errors.conflict(
        `No se puede eliminar "${existing.valor}" porque está en uso en: ${inUse.usedIn.join(", ")}`
      )
    }

    // Soft delete - marcar como inactivo
    await db.configuracion.update({
      where: { id },
      data: { activo: false },
    })

    // Audit log
    await auditDelete("Configuracion", existing as any, request)

    // Invalidate cache after delete
    invalidateCache(CacheTags.CONFIGURACION)

    return NextResponse.json({
      success: true,
      message: "Configuración eliminada exitosamente",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// Función auxiliar para verificar si una configuración está en uso
async function checkConfigurationInUse(
  db: any,
  categoria: string,
  valor: string
): Promise<{ isUsed: boolean; usedIn: string[] }> {
  const usedIn: string[] = []

  try {
    switch (categoria) {
      case "proveedores":
        const ocsWithProveedor = await db.oCChina.count({
          where: {
            proveedor: valor,
            deletedAt: null, // Solo contar OCs activas
          },
        })
        if (ocsWithProveedor > 0) usedIn.push(`${ocsWithProveedor} órdenes de compra`)
        break

      case "categorias":
        const ocsWithCategoria = await db.oCChina.count({
          where: {
            categoriaPrincipal: valor,
            deletedAt: null, // Solo contar OCs activas
          },
        })
        if (ocsWithCategoria > 0) usedIn.push(`${ocsWithCategoria} órdenes de compra`)
        break

      case "tiposPago":
        const pagosWithTipo = await db.pagosChina.count({
          where: {
            tipoPago: valor,
            deletedAt: null, // Solo contar pagos activos
          },
        })
        if (pagosWithTipo > 0) usedIn.push(`${pagosWithTipo} pagos`)
        break

      case "metodosPago":
        const pagosWithMetodo = await db.pagosChina.count({
          where: {
            metodoPago: valor,
            deletedAt: null, // Solo contar pagos activos
          },
        })
        const gastosWithMetodo = await db.gastosLogisticos.count({
          where: {
            metodoPago: valor,
            deletedAt: null, // Solo contar gastos activos
          },
        })
        if (pagosWithMetodo > 0) usedIn.push(`${pagosWithMetodo} pagos`)
        if (gastosWithMetodo > 0) usedIn.push(`${gastosWithMetodo} gastos logísticos`)
        break

      case "tiposGasto":
        const gastosWithTipo = await db.gastosLogisticos.count({
          where: {
            tipoGasto: valor,
            deletedAt: null, // Solo contar gastos activos
          },
        })
        if (gastosWithTipo > 0) usedIn.push(`${gastosWithTipo} gastos logísticos`)
        break

      case "bodegas":
        const inventarioWithBodega = await db.inventarioRecibido.count({
          where: {
            bodegaInicial: valor,
            deletedAt: null, // Solo contar inventario activo
          },
        })
        if (inventarioWithBodega > 0)
          usedIn.push(`${inventarioWithBodega} recepciones de inventario`)
        break
    }
  } catch (error) {
    console.error("Error verificando uso de configuración:", error)
  }

  return {
    isUsed: usedIn.length > 0,
    usedIn,
  }
}
