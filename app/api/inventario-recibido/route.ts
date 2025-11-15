import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/inventario-recibido - Obtener todos los inventarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const ocId = searchParams.get("ocId") || "";

    const skip = (page - 1) * limit;

    const where = ocId ? { ocId } : {};

    const [inventarios, total] = await Promise.all([
      prisma.inventarioRecibido.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          fechaLlegada: "desc",
        },
        include: {
          ocChina: {
            select: {
              oc: true,
              proveedor: true,
            },
          },
        },
      }),
      prisma.inventarioRecibido.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: inventarios,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/inventario-recibido:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener inventarios recibidos",
      },
      { status: 500 }
    );
  }
}

// POST /api/inventario-recibido - Crear nuevo inventario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const nuevoInventario = await prisma.inventarioRecibido.create({
      data: {
        idRecepcion: body.idRecepcion,
        ocId: body.ocId,
        fechaLlegada: new Date(body.fechaLlegada),
        bodegaInicial: body.bodegaInicial,
        cantidadRecibida: parseInt(body.cantidadRecibida),
        notas: body.notas,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: nuevoInventario,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/inventario-recibido:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear inventario recibido",
      },
      { status: 500 }
    );
  }
}
