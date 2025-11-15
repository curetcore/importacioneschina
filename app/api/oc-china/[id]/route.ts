import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ocChinaSchema } from "@/lib/validations";

// GET /api/oc-china/[id] - Obtener una orden de compra específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const oc = await prisma.oCChina.findUnique({
      where: { id },
      include: {
        pagosChina: true,
        gastosLogisticos: true,
        inventarioRecibido: true,
        _count: {
          select: {
            pagosChina: true,
            gastosLogisticos: true,
            inventarioRecibido: true,
          },
        },
      },
    });

    if (!oc) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden de compra no encontrada",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: oc,
    });
  } catch (error) {
    console.error("Error en GET /api/oc-china/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener orden de compra",
      },
      { status: 500 }
    );
  }
}

// PUT /api/oc-china/[id] - Actualizar una orden de compra
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Verificar que la OC existe
    const existing = await prisma.oCChina.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden de compra no encontrada",
        },
        { status: 404 }
      );
    }

    // Validar datos con Zod
    const validatedData = ocChinaSchema.parse(body);

    // Si se está cambiando el código OC, verificar que no exista otro con ese código
    if (validatedData.oc !== existing.oc) {
      const duplicate = await prisma.oCChina.findUnique({
        where: { oc: validatedData.oc },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: "Ya existe una OC con ese código",
          },
          { status: 400 }
        );
      }
    }

    // Actualizar la OC
    const updatedOC = await prisma.oCChina.update({
      where: { id },
      data: {
        oc: validatedData.oc,
        proveedor: validatedData.proveedor,
        fechaOC: new Date(validatedData.fechaOC),
        descripcionLote: validatedData.descripcionLote,
        categoriaPrincipal: validatedData.categoriaPrincipal,
        cantidadOrdenada: validatedData.cantidadOrdenada,
        costoFOBTotalUSD: validatedData.costoFOBTotalUSD,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedOC,
    });
  } catch (error: any) {
    console.error("Error en PUT /api/oc-china/[id]:", error);

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
        error: "Error al actualizar orden de compra",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/oc-china/[id] - Eliminar una orden de compra
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar que la OC existe
    const existing = await prisma.oCChina.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pagosChina: true,
            gastosLogisticos: true,
            inventarioRecibido: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden de compra no encontrada",
        },
        { status: 404 }
      );
    }

    // Verificar que no tenga datos relacionados
    const hasRelatedData =
      existing._count.pagosChina > 0 ||
      existing._count.gastosLogisticos > 0 ||
      existing._count.inventarioRecibido > 0;

    if (hasRelatedData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se puede eliminar la OC porque tiene pagos, gastos o inventario asociado",
        },
        { status: 400 }
      );
    }

    // Eliminar la OC
    await prisma.oCChina.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Orden de compra eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/oc-china/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar orden de compra",
      },
      { status: 500 }
    );
  }
}
