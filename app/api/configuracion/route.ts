import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const configuracionSchema = z.object({
  categoria: z.enum(["categorias", "tiposPago", "metodosPago", "bodegas", "tiposGasto"]),
  valor: z.string().min(1, "El valor es requerido"),
  orden: z.number().int().default(0),
});

// GET /api/configuracion - Obtener todas las configuraciones o filtrar por categoría
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria");

    const whereClause = categoria
      ? { categoria, activo: true }
      : { activo: true };

    const configuraciones = await prisma.configuracion.findMany({
      where: whereClause,
      orderBy: [{ categoria: "asc" }, { orden: "asc" }, { valor: "asc" }],
    });

    // Agrupar por categoría
    const grouped = configuraciones.reduce((acc, config) => {
      if (!acc[config.categoria]) {
        acc[config.categoria] = [];
      }
      acc[config.categoria].push(config);
      return acc;
    }, {} as Record<string, typeof configuraciones>);

    return NextResponse.json({
      success: true,
      data: categoria ? configuraciones : grouped,
    });
  } catch (error) {
    console.error("Error en GET /api/configuracion:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener configuraciones",
      },
      { status: 500 }
    );
  }
}

// POST /api/configuracion - Crear nueva configuración
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = configuracionSchema.parse(body);

    // Verificar si ya existe
    const existing = await prisma.configuracion.findUnique({
      where: {
        categoria_valor: {
          categoria: validatedData.categoria,
          valor: validatedData.valor,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe una configuración con ese valor en esta categoría",
        },
        { status: 400 }
      );
    }

    const configuracion = await prisma.configuracion.create({
      data: {
        categoria: validatedData.categoria,
        valor: validatedData.valor,
        orden: validatedData.orden,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: configuracion,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error en POST /api/configuracion:", error);

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
        error: "Error al crear configuración",
      },
      { status: 500 }
    );
  }
}
