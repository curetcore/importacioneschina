import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { pagosChinaSchema } from "@/lib/validations"
import { calcularMontoRD, calcularMontoRDNeto } from "@/lib/calculations"
import { Prisma } from "@prisma/client"
import { auditUpdate, auditDelete } from "@/lib/audit-logger"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { CacheInvalidator } from "@/lib/cache-helpers"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

// GET /api/pagos-china/[id] - Obtener un pago específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params

    const pago = await db.pagosChina.findFirst({
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

    if (!pago) {
      throw Errors.notFound("Pago", id)
    }

    return NextResponse.json({
      success: true,
      data: pago,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/pagos-china/[id] - Actualizar un pago
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params
    const body = await request.json()

    // Verificar que el pago existe
    const existing = await db.pagosChina.findUnique({
      where: { id },
    })

    if (!existing) {
      throw Errors.notFound("Pago", id)
    }

    // Guardar estado anterior para audit log
    const estadoAnterior = { ...existing }

    // Validar datos con Zod
    const validatedData = pagosChinaSchema.parse(body)

    // Extraer adjuntos (no validado por Zod)
    const { adjuntos } = body

    // Verificar que la OC existe
    const oc = await db.oCChina.findUnique({
      where: { id: validatedData.ocId },
    })

    if (!oc) {
      throw Errors.notFound("Orden de compra", validatedData.ocId)
    }

    // Recalcular montoRD y montoRDNeto (Problema #4)
    const montoRD = calcularMontoRD(
      validatedData.montoOriginal,
      validatedData.moneda,
      validatedData.tasaCambio
    )

    // Convertir comisión USD a RD$ usando la tasa de cambio
    const comisionRD = validatedData.comisionBancoUSD * validatedData.tasaCambio

    const montoRDNeto = calcularMontoRDNeto(montoRD, comisionRD)

    // Actualizar el pago con campos recalculados
    // NOTA: idPago NO se puede modificar (es autogenerado e inmutable)
    const updatedPago = await db.pagosChina.update({
      where: { id },
      data: {
        // idPago es inmutable - se mantiene el valor existente
        ocId: validatedData.ocId,
        fechaPago: new Date(validatedData.fechaPago),
        tipoPago: validatedData.tipoPago,
        metodoPago: validatedData.metodoPago,
        moneda: validatedData.moneda,
        montoOriginal: validatedData.montoOriginal,
        tasaCambio: validatedData.tasaCambio,
        comisionBancoUSD: validatedData.comisionBancoUSD,
        montoRD: new Prisma.Decimal(montoRD),
        montoRDNeto: new Prisma.Decimal(montoRDNeto),
        adjuntos: adjuntos || null,
      },
    })

    // Audit log
    await auditUpdate("PagosChina", estadoAnterior as any, updatedPago as any, request)

    return NextResponse.json({
      success: true,
      data: updatedPago,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/pagos-china/[id] - Eliminar un pago
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params

    // Verificar que el pago existe
    const existing = await db.pagosChina.findUnique({
      where: { id },
    })

    if (!existing) {
      throw Errors.notFound("Pago", id)
    }

    // Guardar estado anterior para audit log
    const estadoAnterior = { ...existing }

    // Soft delete del pago
    const now = new Date()
    await db.pagosChina.update({
      where: { id },
      data: { deletedAt: now },
    })

    // Audit log
    await auditDelete("PagosChina", estadoAnterior as any, request)

    // Invalidar caché de la lista de pagos
    await CacheInvalidator.invalidatePagosChina(existing.ocId)

    return NextResponse.json({
      success: true,
      message: "Pago eliminado exitosamente",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
