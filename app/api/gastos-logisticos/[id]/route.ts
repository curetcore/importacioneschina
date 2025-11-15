import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gastosLogisticosSchema } from "@/lib/validations";

// GET /api/gastos-logisticos/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const gasto = await prisma.gastosLogisticos.findUnique({
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

    if (validatedData.idGasto !== existing.idGasto) {
      const duplicate = await prisma.gastosLogisticos.findUnique({
        where: { idGasto: validatedData.idGasto },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: "Ya existe un gasto con ese ID",
          },
          { status: 400 }
        );
      }
    }

    const updatedGasto = await prisma.gastosLogisticos.update({
      where: { id },
      data: {
        idGasto: validatedData.idGasto,
        ocId: validatedData.ocId,
        fechaGasto: new Date(validatedData.fechaGasto),
        tipoGasto: validatedData.tipoGasto,
        proveedorServicio: validatedData.proveedorServicio,
        montoRD: validatedData.montoRD,
        notas: validatedData.notas,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedGasto,
    });
  } catch (error: any) {
    console.error("Error en PUT /api/gastos-logisticos/[id]:", error);

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

    await prisma.gastosLogisticos.delete({
      where: { id },
    });

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
