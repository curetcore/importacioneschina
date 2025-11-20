import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { Prisma } from "@prisma/client"
import { inventarioRecibidoSchema } from "@/lib/validations"
import { distribuirGastosLogisticos } from "@/lib/calculations"
import { auditUpdate, auditDelete } from "@/lib/audit-logger"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { CacheInvalidator } from "@/lib/cache-helpers"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params

    const inventario = await db.inventarioRecibido.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        ocChina: {
          select: {
            id: true,
            oc: true,
            proveedor: true,
            fechaOC: true,
            categoriaPrincipal: true,
          },
        },
        item: {
          select: {
            sku: true,
            nombre: true,
            cantidadTotal: true,
          },
        },
      },
    })

    if (!inventario) {
      throw Errors.notFound("Inventario", id)
    }

    return NextResponse.json({
      success: true,
      data: inventario,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params
    const body = await request.json()

    // Verificar que el registro existe
    const existing = await db.inventarioRecibido.findUnique({
      where: { id },
    })

    if (!existing) {
      throw Errors.notFound("Inventario", id)
    }

    // Guardar estado anterior para audit log
    const estadoAnterior = { ...existing }

    // Validar datos con Zod
    const validatedData = inventarioRecibidoSchema.parse(body)

    // Extraer adjuntos (no validado por Zod)
    const { adjuntos } = body

    // Verificar que la OC existe y cargar datos necesarios
    const oc = await db.oCChina.findUnique({
      where: { id: validatedData.ocId },
      include: {
        items: true,
        pagosChina: true,
        gastosLogisticos: {
          include: {
            gasto: true,
          },
        },
      },
    })

    if (!oc) {
      throw Errors.notFound("Orden de compra", validatedData.ocId)
    }

    // Validar que hay items en la OC
    if (!oc.items || oc.items.length === 0) {
      throw Errors.badRequest("La OC no tiene productos registrados")
    }

    // Si se especificó un itemId, validar sobre-recepción (Problema #5)
    if (validatedData.itemId) {
      const item = oc.items.find(i => i.id === validatedData.itemId)
      if (!item) {
        throw Errors.badRequest("El producto especificado no pertenece a esta OC")
      }

      // Validar sobre-recepción (excluyendo el registro actual)
      const cantidadYaRecibida = await db.inventarioRecibido.aggregate({
        where: {
          ocId: validatedData.ocId,
          itemId: validatedData.itemId,
          id: { not: id }, // EXCLUIR el registro actual
        },
        _sum: {
          cantidadRecibida: true,
        },
      })

      const totalRecibido =
        (cantidadYaRecibida._sum.cantidadRecibida || 0) + validatedData.cantidadRecibida

      // Bloquear sobre-recepción
      if (totalRecibido > item.cantidadTotal) {
        throw Errors.badRequest(
          `Sobre-recepción detectada: ${item.nombre} (SKU: ${item.sku}). ` +
            `Ordenado: ${item.cantidadTotal}, Ya recibido: ${cantidadYaRecibida._sum.cantidadRecibida || 0}, ` +
            `Intentando recibir: ${validatedData.cantidadRecibida}, Total: ${totalRecibido}`
        )
      }

      // Warning si está cerca del límite (> 95%)
      if (totalRecibido > item.cantidadTotal * 0.95) {
        console.warn(
          `⚠️ Recepción cerca del límite: ${item.sku} - ${totalRecibido}/${item.cantidadTotal}`
        )
      }
    }

    // Recalcular costos distribuidos por producto
    // Transform gastosLogisticos from junction table to flat gasto objects
    const gastosTransformed =
      oc.gastosLogisticos?.map(gl => gl.gasto).filter(g => g.deletedAt === null) || []
    const itemsConCostos = distribuirGastosLogisticos(oc.items, gastosTransformed, oc.pagosChina)

    let costoUnitarioFinalRD: number
    let costoTotalRecepcionRD: number

    if (validatedData.itemId) {
      // Caso 1: Se especificó un producto - usar su costo exacto
      const itemConCosto = itemsConCostos.find(item => item.id === validatedData.itemId)

      if (!itemConCosto) {
        throw Errors.internal("No se pudo calcular el costo del producto")
      }

      costoUnitarioFinalRD = itemConCosto.costoUnitarioRD
      costoTotalRecepcionRD = costoUnitarioFinalRD * validatedData.cantidadRecibida
    } else {
      // Caso 2: No se especificó producto - calcular promedio ponderado
      const totalUnidades = itemsConCostos.reduce((sum, item) => sum + item.cantidadTotal, 0)
      const totalCosto = itemsConCostos.reduce((sum, item) => sum + item.costoTotalRD, 0)

      costoUnitarioFinalRD = totalUnidades > 0 ? totalCosto / totalUnidades : 0
      costoTotalRecepcionRD = costoUnitarioFinalRD * validatedData.cantidadRecibida
    }

    // Actualizar la recepción con todos los campos y costos recalculados
    // NOTA: idRecepcion NO se puede modificar (es autogenerado e inmutable)
    const updated = await db.inventarioRecibido.update({
      where: { id },
      data: {
        // idRecepcion es inmutable - se mantiene el valor existente
        ocId: validatedData.ocId,
        itemId: validatedData.itemId || null,
        fechaLlegada: validatedData.fechaLlegada,
        bodegaInicial: validatedData.bodegaInicial,
        cantidadRecibida: validatedData.cantidadRecibida,
        costoUnitarioFinalRD: new Prisma.Decimal(costoUnitarioFinalRD),
        costoTotalRecepcionRD: new Prisma.Decimal(costoTotalRecepcionRD),
        notas: validatedData.notas,
        adjuntos: adjuntos || null,
      },
      include: {
        ocChina: {
          select: {
            oc: true,
            proveedor: true,
          },
        },
        item: true,
      },
    })

    // Audit log
    await auditUpdate("InventarioRecibido", estadoAnterior as any, updated as any, request)

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params

    const existing = await db.inventarioRecibido.findUnique({
      where: { id },
    })

    if (!existing) {
      throw Errors.notFound("Inventario", id)
    }

    // Guardar estado anterior para audit log
    const estadoAnterior = { ...existing }

    // Soft delete del inventario
    const now = new Date()
    await db.inventarioRecibido.update({
      where: { id },
      data: { deletedAt: now },
    })

    // Audit log
    await auditDelete("InventarioRecibido", estadoAnterior as any, request)

    // Invalidar caché
    await CacheInvalidator.invalidateInventario(existing.ocId)

    return NextResponse.json({
      success: true,
      message: "Inventario eliminado exitosamente",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
