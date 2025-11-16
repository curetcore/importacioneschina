import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface FileAttachment {
  nombre: string;
  url: string;
  tipo: string;
  size: number;
  uploadedAt: string;
}

// PUT /api/gastos-logisticos/[id]/attachments - Agregar adjuntos a un gasto existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { adjuntos } = body as { adjuntos: FileAttachment[] };

    if (!adjuntos || !Array.isArray(adjuntos)) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere un array de adjuntos",
        },
        { status: 400 }
      );
    }

    // Verificar que el gasto existe
    const gasto = await prisma.gastosLogisticos.findUnique({
      where: { id },
      select: { adjuntos: true },
    });

    if (!gasto) {
      return NextResponse.json(
        {
          success: false,
          error: "Gasto logístico no encontrado",
        },
        { status: 404 }
      );
    }

    // Combinar adjuntos existentes con los nuevos
    const existingAttachments = (gasto.adjuntos as unknown as FileAttachment[]) || [];
    const updatedAttachments = [...existingAttachments, ...adjuntos];

    // Actualizar en la base de datos
    const updated = await prisma.gastosLogisticos.update({
      where: { id },
      data: {
        adjuntos: updatedAttachments as any,
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

    return NextResponse.json({
      success: true,
      data: updated,
      message: `${adjuntos.length} archivo(s) agregado(s) exitosamente`,
    });
  } catch (error) {
    console.error("Error en PUT /api/gastos-logisticos/[id]/attachments:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al agregar adjuntos",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/gastos-logisticos/[id]/attachments - Eliminar un adjunto específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere la URL del archivo a eliminar",
        },
        { status: 400 }
      );
    }

    // Verificar que el gasto existe
    const gasto = await prisma.gastosLogisticos.findUnique({
      where: { id },
      select: { adjuntos: true },
    });

    if (!gasto) {
      return NextResponse.json(
        {
          success: false,
          error: "Gasto logístico no encontrado",
        },
        { status: 404 }
      );
    }

    // Filtrar el adjunto a eliminar
    const existingAttachments = (gasto.adjuntos as unknown as FileAttachment[]) || [];
    const updatedAttachments = existingAttachments.filter(
      (att) => att.url !== fileUrl
    );

    // Actualizar en la base de datos
    const updated = await prisma.gastosLogisticos.update({
      where: { id },
      data: {
        adjuntos: updatedAttachments as any,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Archivo eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/gastos-logisticos/[id]/attachments:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar adjunto",
      },
      { status: 500 }
    );
  }
}
