import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { gastosLogisticosSchema } from "@/lib/validations"
import { softDelete } from "@/lib/db-helpers"
import { auditUpdate, auditDelete } from "@/lib/audit-logger"
import { handleApiError, Errors } from "@/lib/api-error-handler"

// GET /api/gastos-logisticos/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const gasto = await prisma.gastosLogisticos.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        ocChina: {
          select: {
            oc: true,
            proveedor: true,
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
    const { id } = params
    const body = await request.json()

    const existing = await prisma.gastosLogisticos.findUnique({
      where: { id },
    })

    if (!existing) {
      throw Errors.notFound("Gasto", id)
    }

    // Guardar estado anterior para audit log
    const estadoAnterior = { ...existing }

    const validatedData = gastosLogisticosSchema.parse(body)

    // Extraer adjuntos (no validado por Zod)
    const { adjuntos } = body

    const oc = await prisma.oCChina.findUnique({
      where: { id: validatedData.ocId },
    })

    if (!oc) {
      throw Errors.notFound("Orden de compra", validatedData.ocId)
    }

    // Actualizar el gasto
    // NOTA: idGasto NO se puede modificar (es autogenerado e inmutable)
    const updatedGasto = await prisma.gastosLogisticos.update({
      where: { id },
      data: {
        // idGasto es inmutable - se mantiene el valor existente
        ocId: validatedData.ocId,
        fechaGasto: new Date(validatedData.fechaGasto),
        tipoGasto: validatedData.tipoGasto,
        proveedorServicio: validatedData.proveedorServicio,
        metodoPago: validatedData.metodoPago,
        montoRD: validatedData.montoRD,
        notas: validatedData.notas,
        adjuntos: adjuntos || null,
      },
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
    const { id } = params

    const existing = await prisma.gastosLogisticos.findUnique({
      where: { id },
    })

    if (!existing) {
      throw Errors.notFound("Gasto", id)
    }

    // Guardar estado anterior para audit log
    const estadoAnterior = { ...existing }

    // Soft delete del gasto
    await softDelete("gastosLogisticos", id)

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
