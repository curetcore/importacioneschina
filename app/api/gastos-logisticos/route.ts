import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/gastos-logisticos - Obtener todos los gastos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const ocId = searchParams.get("ocId") || "";

    const skip = (page - 1) * limit;

    const where = ocId ? { ocId } : {};

    const [gastos, total] = await Promise.all([
      prisma.gastosLogisticos.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          fechaGasto: "desc",
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
      prisma.gastosLogisticos.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: gastos,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/gastos-logisticos:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener gastos logisticos",
      },
      { status: 500 }
    );
  }
}

// POST /api/gastos-logisticos - Crear nuevo gasto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const nuevoGasto = await prisma.gastosLogisticos.create({
      data: {
        idGasto: body.idGasto,
        ocId: body.ocId,
        fechaGasto: new Date(body.fechaGasto),
        tipoGasto: body.tipoGasto,
        proveedorServicio: body.proveedorServicio,
        montoRD: parseFloat(body.montoRD),
        notas: body.notas,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: nuevoGasto,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/gastos-logisticos:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear gasto logistico",
      },
      { status: 500 }
    );
  }
}
