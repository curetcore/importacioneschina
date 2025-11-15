import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/oc-china - Obtener todas las órdenes de compra
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const proveedor = searchParams.get("proveedor") || "";

    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        oc: {
          contains: search,
          mode: "insensitive" as const,
        },
      }),
      ...(proveedor && {
        proveedor: proveedor,
      }),
    };

    const [ocs, total] = await Promise.all([
      prisma.oCChina.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          fechaOC: "desc",
        },
        include: {
          _count: {
            select: {
              pagosChina: true,
              gastosLogisticos: true,
              inventarioRecibido: true,
            },
          },
        },
      }),
      prisma.oCChina.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: ocs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/oc-china:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener órdenes de compra",
      },
      { status: 500 }
    );
  }
}

// POST /api/oc-china - Crear nueva orden de compra
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      oc,
      proveedor,
      fechaOC,
      descripcionLote,
      categoriaPrincipal,
      cantidadOrdenada,
      costoFOBTotalUSD,
    } = body;

    // Validaciones básicas
    if (!oc || !proveedor || !fechaOC || !categoriaPrincipal || !cantidadOrdenada || !costoFOBTotalUSD) {
      return NextResponse.json(
        {
          success: false,
          error: "Faltan campos requeridos",
        },
        { status: 400 }
      );
    }

    // Verificar que el OC sea único
    const existing = await prisma.oCChina.findUnique({
      where: { oc },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe una OC con ese código",
        },
        { status: 400 }
      );
    }

    const nuevaOC = await prisma.oCChina.create({
      data: {
        oc,
        proveedor,
        fechaOC: new Date(fechaOC),
        descripcionLote,
        categoriaPrincipal,
        cantidadOrdenada: parseInt(cantidadOrdenada),
        costoFOBTotalUSD: parseFloat(costoFOBTotalUSD),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: nuevaOC,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/oc-china:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear orden de compra",
      },
      { status: 500 }
    );
  }
}
