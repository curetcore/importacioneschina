import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { gastosLogisticosSchema } from "@/lib/validations"
import { auditUpdate, auditDelete } from "@/lib/audit-logger"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { CacheInvalidator } from "@/lib/cache-helpers"
import { triggerRecordUpdated, triggerRecordDeleted, CHANNELS } from "@/lib/pusher-events"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

// GET /api/gastos-logisticos/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params

    const gasto = await db.gastosLogisticos.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        ordenesCompra: {
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
          },
        },
      },
    })

    if (!gasto) {
      throw Errors.notFound("Gasto", id)
    }

    return NextResponse.json({
      success: true,
      data: gasto,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/gastos-logisticos/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params
    const body = await request.json()

    const existing = await db.gastosLogisticos.findUnique({
      where: { id },
      include: {
        ordenesCompra: {
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
          },
        },
      },
    })

    if (!existing) {
      throw Errors.notFound("Gasto", id)
    }

    // Guardar estado anterior para audit log
    const estadoAnterior = { ...existing }

    // Extraer OC IDs antiguos para invalidación de cache
    const oldOcIds = existing.ordenesCompra.map(rel => rel.ocId)

    const validatedData = gastosLogisticosSchema.parse(body)

    // Extraer adjuntos (no validado por Zod)
    const { adjuntos } = body

    // Validar que todos los OC IDs existen
    for (const ocId of validatedData.ocIds) {
      const oc = await db.oCChina.findUnique({
        where: { id: ocId },
      })
      if (!oc) {
        throw Errors.notFound("Orden de compra", ocId)
      }
    }

    // Actualizar el gasto usando una transacción
    // NOTA: idGasto NO se puede modificar (es autogenerado e inmutable)
    const updatedGasto = await db.$transaction(async tx => {
      // 1. Actualizar datos principales del gasto
      const gasto = await tx.gastosLogisticos.update({
        where: { id },
        data: {
          // idGasto es inmutable - se mantiene el valor existente
          fechaGasto: new Date(validatedData.fechaGasto),
          tipoGasto: validatedData.tipoGasto,
          proveedorServicio: validatedData.proveedorServicio,
          metodoPago: validatedData.metodoPago,
          montoRD: validatedData.montoRD,
          notas: validatedData.notas,
          adjuntos: adjuntos || null,
        },
      })

      // 2. Eliminar todas las relaciones existentes con OCs
      await tx.gastoLogisticoOC.deleteMany({
        where: { gastoId: id },
      })

      // 3. Crear las nuevas relaciones con OCs
      await tx.gastoLogisticoOC.createMany({
        data: validatedData.ocIds.map(ocId => ({
          gastoId: id,
          ocId,
        })),
      })

      // 4. Retornar gasto con relaciones incluidas
      return tx.gastosLogisticos.findUnique({
        where: { id },
        include: {
          ordenesCompra: {
            include: {
              ocChina: {
                select: {
                  id: true,
                  oc: true,
                  proveedor: true,
                },
              },
            },
          },
        },
      })
    })

    // Audit log
    await auditUpdate("GastosLogisticos", estadoAnterior as any, updatedGasto as any, request)

    // Invalidar caché para OCs viejos y nuevos
    const allOcIds = [...new Set([...oldOcIds, ...validatedData.ocIds])]
    await CacheInvalidator.invalidateGastosLogisticos(allOcIds)

    // Trigger real-time event
    await triggerRecordUpdated(CHANNELS.EXPENSES, updatedGasto)

    return NextResponse.json({
      success: true,
      data: updatedGasto,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/gastos-logisticos/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params

    const existing = await db.gastosLogisticos.findUnique({
      where: { id },
      include: {
        ordenesCompra: {
          select: {
            ocId: true,
          },
        },
      },
    })

    if (!existing) {
      throw Errors.notFound("Gasto", id)
    }

    // Extraer OC IDs para invalidación de cache
    const ocIds = existing.ordenesCompra.map(rel => rel.ocId)

    // Guardar estado anterior para audit log
    const estadoAnterior = { ...existing }

    // Soft delete del gasto
    const now = new Date()
    await db.gastosLogisticos.update({
      where: { id },
      data: { deletedAt: now },
    })

    // Audit log
    await auditDelete("GastosLogisticos", estadoAnterior as any, request)

    // Invalidar caché
    await CacheInvalidator.invalidateGastosLogisticos(ocIds)

    // Trigger real-time event
    await triggerRecordDeleted(CHANNELS.EXPENSES, {
      id: estadoAnterior.id,
      idGasto: estadoAnterior.idGasto,
    })

    return NextResponse.json({
      success: true,
      message: "Gasto eliminado exitosamente",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
