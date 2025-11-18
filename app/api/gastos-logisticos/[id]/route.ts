import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { gastosLogisticosSchema } from "@/lib/validations"
import { auditUpdate, auditDelete } from "@/lib/audit-logger"
import { handleApiError, Errors } from "@/lib/api-error-handler"

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
                oc: true,
                proveedor: true,
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
                oc: true,
                proveedor: true,
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
    })

    if (!existing) {
      throw Errors.notFound("Gasto", id)
    }

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

    return NextResponse.json({
      success: true,
      message: "Gasto eliminado exitosamente",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
