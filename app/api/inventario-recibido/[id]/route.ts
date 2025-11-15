import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inventarioRecibidoSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const inventario = await prisma.inventarioRecibido.findUnique({
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

    if (!inventario) {
      return NextResponse.json(
        { success: false, error: "Inventario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: inventario,
    });
  } catch (error) {
    console.error("Error en GET /api/inventario-recibido/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener inventario" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const existing = await prisma.inventarioRecibido.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Inventario no encontrado" },
        { status: 404 }
      );
    }

    const validatedData = inventarioRecibidoSchema.parse(body);

    const oc = await prisma.oCChina.findUnique({
      where: { id: validatedData.ocId },
    });

    if (!oc) {
      return NextResponse.json(
        { success: false, error: "La OC especificada no existe" },
        { status: 400 }
      );
    }

    if (validatedData.idRecepcion !== existing.idRecepcion) {
      const duplicate = await prisma.inventarioRecibido.findUnique({
        where: { idRecepcion: validatedData.idRecepcion },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "Ya existe una recepción con ese ID" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.inventarioRecibido.update({
      where: { id },
      data: {
        idRecepcion: validatedData.idRecepcion,
        ocId: validatedData.ocId,
        fechaLlegada: new Date(validatedData.fechaLlegada),
        bodegaInicial: validatedData.bodegaInicial,
        cantidadRecibida: validatedData.cantidadRecibida,
        notas: validatedData.notas,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error en PUT /api/inventario-recibido/[id]:", error);

    if (error.errors) {
      return NextResponse.json(
        { success: false, error: "Datos de entrada inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Error al actualizar inventario" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.inventarioRecibido.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Inventario no encontrado" },
        { status: 404 }
      );
    }

    await prisma.inventarioRecibido.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Inventario eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/inventario-recibido/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar inventario" },
      { status: 500 }
    );
  }
}
