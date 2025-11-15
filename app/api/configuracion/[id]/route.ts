import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  valor: z.string().min(1, "El valor es requerido").optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

// PUT /api/configuracion/[id] - Actualizar configuración
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Verificar que existe
    const existing = await prisma.configuracion.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuración no encontrada",
        },
        { status: 404 }
      );
    }

    const validatedData = updateSchema.parse(body);

    // Si se está cambiando el valor, verificar que no exista otro con ese valor
    if (validatedData.valor && validatedData.valor !== existing.valor) {
      const duplicate = await prisma.configuracion.findUnique({
        where: {
          categoria_valor: {
            categoria: existing.categoria,
            valor: validatedData.valor,
          },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: "Ya existe una configuración con ese valor en esta categoría",
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.configuracion.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error en PUT /api/configuracion/[id]:", error);

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
        error: "Error al actualizar configuración",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/configuracion/[id] - Eliminar configuración (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.configuracion.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuración no encontrada",
        },
        { status: 404 }
      );
    }

    // Soft delete - marcar como inactivo
    await prisma.configuracion.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({
      success: true,
      message: "Configuración eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/configuracion/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar configuración",
      },
      { status: 500 }
    );
  }
}
