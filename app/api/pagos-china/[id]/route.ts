import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pagosChinaSchema } from "@/lib/validations";
import { calcularMontoRD, calcularMontoRDNeto } from "@/lib/calculations";
import { Prisma } from "@prisma/client";

// GET /api/pagos-china/[id] - Obtener un pago específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const pago = await prisma.pagosChina.findUnique({
      where: { id },
      include: {
        ocChina: {
          select: {
            oc: true,
            proveedor: true,
          },
        },
      },
    });

    if (!pago) {
      return NextResponse.json(
        {
          success: false,
          error: "Pago no encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pago,
    });
  } catch (error) {
    console.error("Error en GET /api/pagos-china/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener pago",
      },
      { status: 500 }
    );
  }
}

// PUT /api/pagos-china/[id] - Actualizar un pago
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Verificar que el pago existe
    const existing = await prisma.pagosChina.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Pago no encontrado",
        },
        { status: 404 }
      );
    }

    // Validar datos con Zod
    const validatedData = pagosChinaSchema.parse(body);

    // Extraer adjuntos (no validado por Zod)
    const { adjuntos } = body;

    // Verificar que la OC existe
    const oc = await prisma.oCChina.findUnique({
      where: { id: validatedData.ocId },
    });

    if (!oc) {
      return NextResponse.json(
        {
          success: false,
          error: "La OC especificada no existe",
        },
        { status: 400 }
      );
    }

    // Recalcular montoRD y montoRDNeto (Problema #4)
    const montoRD = calcularMontoRD(
      validatedData.montoOriginal,
      validatedData.moneda,
      validatedData.tasaCambio
    );

    const montoRDNeto = calcularMontoRDNeto(
      montoRD,
      validatedData.comisionBancoRD
    );

    // Actualizar el pago con campos recalculados
    // NOTA: idPago NO se puede modificar (es autogenerado e inmutable)
    const updatedPago = await prisma.pagosChina.update({
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
        comisionBancoRD: validatedData.comisionBancoRD,
        montoRD: new Prisma.Decimal(montoRD),
        montoRDNeto: new Prisma.Decimal(montoRDNeto),
        adjuntos: adjuntos || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPago,
    });
  } catch (error) {
    console.error("Error en PUT /api/pagos-china/[id]:", error);

    // Errores de validación Zod
    if (error.errors) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos de entrada inválidos",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar pago",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/pagos-china/[id] - Eliminar un pago
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar que el pago existe
    const existing = await prisma.pagosChina.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Pago no encontrado",
        },
        { status: 404 }
      );
    }

    // Eliminar el pago
    await prisma.pagosChina.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Pago eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/pagos-china/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar pago",
      },
      { status: 500 }
    );
  }
}
