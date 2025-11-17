import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gastosLogisticosSchema } from "@/lib/validations";
import { softDelete } from "@/lib/db-helpers";

// GET /api/gastos-logisticos/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
    });

    if (!gasto) {
      return NextResponse.json(
        {
          success: false,
          error: "Gasto no encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: gasto,
    });
  } catch (error) {
    console.error("Error en GET /api/gastos-logisticos/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener gasto",
      },
      { status: 500 }
    );
  }
}

// PUT /api/gastos-logisticos/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const existing = await prisma.gastosLogisticos.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Gasto no encontrado",
        },
        { status: 404 }
      );
    }

    const validatedData = gastosLogisticosSchema.parse(body);

    // Extraer adjuntos (no validado por Zod)
    const { adjuntos } = body;

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
    });

    return NextResponse.json({
      success: true,
      data: updatedGasto,
    });
  } catch (error) {
    console.error("Error en PUT /api/gastos-logisticos/[id]:", error);

    if (error && typeof error === 'object' && 'errors' in error) {
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
        error: "Error al actualizar gasto",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/gastos-logisticos/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.gastosLogisticos.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Gasto no encontrado",
        },
        { status: 404 }
      );
    }

    // Soft delete del gasto
    await softDelete("gastosLogisticos", id);

    return NextResponse.json({
      success: true,
      message: "Gasto eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/gastos-logisticos/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar gasto",
      },
      { status: 500 }
    );
  }
}
