import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { metodoPagoSchema } from "@/lib/validations/metodo-pago"
import { z } from "zod"

// GET /api/metodos-pago - Obtener todos los métodos de pago
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activo = searchParams.get("activo")
    const tipo = searchParams.get("tipo")
    const proveedorId = searchParams.get("proveedorId")

    const whereClause: any = {}
    if (activo !== null) whereClause.activo = activo === "true"
    if (tipo) whereClause.tipo = tipo
    if (proveedorId) whereClause.proveedorId = proveedorId

    const metodosPago = await prisma.metodoPago.findMany({
      where: whereClause,
      include: {
        proveedor: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        nombre: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      data: metodosPago,
    })
  } catch (error) {
    console.error("❌ Error al obtener métodos de pago:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al obtener métodos de pago",
      },
      { status: 500 }
    )
  }
}

// POST /api/metodos-pago - Crear nuevo método de pago
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar datos
    const validatedData = metodoPagoSchema.parse(body)

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

    // Crear método de pago
    const metodoPago = await prisma.metodoPago.create({
      data: {
        nombre: validatedData.nombre,
        tipo: validatedData.tipo,
        proveedorId: validatedData.proveedorId,
        moneda: validatedData.moneda,
        banco: validatedData.banco,
        numeroCuenta: validatedData.numeroCuenta,
        titular: validatedData.titular,
        swift: validatedData.swift,
        iban: validatedData.iban,
        ultimos4Digitos: validatedData.ultimos4Digitos || undefined,
        tipoTarjeta: validatedData.tipoTarjeta,
        email: validatedData.email || undefined,
        telefono: validatedData.telefono,
        idCuenta: validatedData.idCuenta,
        limiteTransaccion: validatedData.limiteTransaccion,
        comisionPorcentaje: validatedData.comisionPorcentaje,
        comisionFija: validatedData.comisionFija,
        balanceActual: validatedData.balanceActual,
        notas: validatedData.notas,
        activo: validatedData.activo,
      },
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

    return NextResponse.json(
      {
        success: true,
        data: metodoPago,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Error al crear método de pago:", error)

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
        error: error instanceof Error ? error.message : "Error desconocido al crear método de pago",
      },
      { status: 500 }
    )
  }
}
