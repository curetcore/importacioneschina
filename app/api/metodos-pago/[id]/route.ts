import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateMetodoPagoSchema } from "@/lib/validations/metodo-pago"
import { z } from "zod"

// GET /api/metodos-pago/[id] - Obtener método de pago por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const metodoPago = await prisma.metodoPago.findUnique({
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

    if (!metodoPago) {
      return NextResponse.json(
        {
          success: false,
          error: "Método de pago no encontrado",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: metodoPago,
    })
  } catch (error) {
    console.error("❌ Error al obtener método de pago:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al obtener método de pago",
      },
      { status: 500 }
    )
  }
}

// PUT /api/metodos-pago/[id] - Actualizar método de pago
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validar datos
    const validatedData = updateMetodoPagoSchema.parse(body)

    // Verificar que el método de pago existe
    const existingMetodoPago = await prisma.metodoPago.findUnique({
      where: { id: params.id },
    })

    if (!existingMetodoPago) {
      return NextResponse.json(
        {
          success: false,
          error: "Método de pago no encontrado",
        },
        { status: 404 }
      )
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

    if (validatedData.nombre) updateData.nombre = validatedData.nombre
    if (validatedData.tipo) updateData.tipo = validatedData.tipo
    if (validatedData.proveedorId !== undefined) updateData.proveedorId = validatedData.proveedorId
    if (validatedData.moneda) updateData.moneda = validatedData.moneda
    if (validatedData.banco !== undefined) updateData.banco = validatedData.banco
    if (validatedData.numeroCuenta !== undefined) updateData.numeroCuenta = validatedData.numeroCuenta
    if (validatedData.titular !== undefined) updateData.titular = validatedData.titular
    if (validatedData.swift !== undefined) updateData.swift = validatedData.swift
    if (validatedData.iban !== undefined) updateData.iban = validatedData.iban
    if (validatedData.ultimos4Digitos !== undefined) updateData.ultimos4Digitos = validatedData.ultimos4Digitos || undefined
    if (validatedData.tipoTarjeta !== undefined) updateData.tipoTarjeta = validatedData.tipoTarjeta
    if (validatedData.email !== undefined) updateData.email = validatedData.email || undefined
    if (validatedData.telefono !== undefined) updateData.telefono = validatedData.telefono
    if (validatedData.idCuenta !== undefined) updateData.idCuenta = validatedData.idCuenta
    if (validatedData.limiteTransaccion !== undefined) updateData.limiteTransaccion = validatedData.limiteTransaccion
    if (validatedData.comisionPorcentaje !== undefined) updateData.comisionPorcentaje = validatedData.comisionPorcentaje
    if (validatedData.comisionFija !== undefined) updateData.comisionFija = validatedData.comisionFija
    if (validatedData.balanceActual !== undefined) updateData.balanceActual = validatedData.balanceActual
    if (validatedData.notas !== undefined) updateData.notas = validatedData.notas
    if (validatedData.activo !== undefined) updateData.activo = validatedData.activo

    // Actualizar método de pago
    const metodoPago = await prisma.metodoPago.update({
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
      data: metodoPago,
    })
  } catch (error) {
    console.error("❌ Error al actualizar método de pago:", error)

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
        error: error instanceof Error ? error.message : "Error desconocido al actualizar método de pago",
      },
      { status: 500 }
    )
  }
}

// DELETE /api/metodos-pago/[id] - Eliminar método de pago (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el método de pago existe
    const metodoPago = await prisma.metodoPago.findUnique({
      where: { id: params.id },
    })

    if (!metodoPago) {
      return NextResponse.json(
        {
          success: false,
          error: "Método de pago no encontrado",
        },
        { status: 404 }
      )
    }

    // Soft delete: marcar como inactivo
    const metodoPagoDeleted = await prisma.metodoPago.update({
      where: { id: params.id },
      data: { activo: false },
    })

    return NextResponse.json({
      success: true,
      data: metodoPagoDeleted,
    })
  } catch (error) {
    console.error("❌ Error al eliminar método de pago:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al eliminar método de pago",
      },
      { status: 500 }
    )
  }
}
