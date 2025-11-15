import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inventarioRecibidoSchema } from "@/lib/validations";
import { calcularCostoUnitarioFinal, calcularCostoTotalRecepcion } from "@/lib/calculations";
import { Prisma } from "@prisma/client";

// GET /api/inventario-recibido - Obtener todos los inventarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const ocId = searchParams.get("ocId") || "";
    const bodega = searchParams.get("bodega") || "";

    const skip = (page - 1) * limit;

    const where: Prisma.InventarioRecibidoWhereInput = {
      ...(search && {
        idRecepcion: {
          contains: search,
          mode: "insensitive",
        },
      }),
      ...(ocId && {
        ocId: ocId,
      }),
      ...(bodega && {
        bodegaInicial: bodega,
      }),
    };

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
              cantidadOrdenada: true,
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
        error: "Error al obtener inventario recibido",
      },
      { status: 500 }
    );
  }
}

// POST /api/inventario-recibido - Crear nueva recepción
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar con Zod
    const validatedData = inventarioRecibidoSchema.parse(body);

    // Verificar que la OC existe
    const oc = await prisma.oCChina.findUnique({
      where: { id: validatedData.ocId },
      include: {
        pagosChina: true,
        gastosLogisticos: true,
        inventarioRecibido: true,
      },
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

    // Verificar que el ID de recepción sea único
    const existingRecepcion = await prisma.inventarioRecibido.findUnique({
      where: { idRecepcion: validatedData.idRecepcion },
    });

    if (existingRecepcion) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe una recepción con ese ID",
        },
        { status: 400 }
      );
    }

    // Calcular totales de pagos y gastos
    const totalPagosRD = oc.pagosChina.reduce(
      (sum, p) => sum + (p.montoRDNeto ? parseFloat(p.montoRDNeto.toString()) : 0),
      0
    );

    const totalGastosRD = oc.gastosLogisticos.reduce(
      (sum, g) => sum + parseFloat(g.montoRD.toString()),
      0
    );

    // Calcular cantidad total recibida (incluyendo esta nueva recepción)
    const cantidadPreviaRecibida = oc.inventarioRecibido.reduce(
      (sum, i) => sum + i.cantidadRecibida,
      0
    );
    const cantidadTotalRecibida = cantidadPreviaRecibida + validatedData.cantidadRecibida;

    // Calcular inversión total
    const totalInversionRD = totalPagosRD + totalGastosRD;

    // Calcular costo unitario final
    const costoUnitarioFinalRD = calcularCostoUnitarioFinal(
      totalInversionRD,
      cantidadTotalRecibida
    );

    // Calcular costo total de esta recepción
    const costoTotalRecepcionRD = calcularCostoTotalRecepcion(
      validatedData.cantidadRecibida,
      costoUnitarioFinalRD
    );

    // Crear la recepción
    const nuevaRecepcion = await prisma.inventarioRecibido.create({
      data: {
        idRecepcion: validatedData.idRecepcion,
        ocId: validatedData.ocId,
        fechaLlegada: validatedData.fechaLlegada,
        bodegaInicial: validatedData.bodegaInicial,
        cantidadRecibida: validatedData.cantidadRecibida,
        costoUnitarioFinalRD: new Prisma.Decimal(costoUnitarioFinalRD),
        costoTotalRecepcionRD: new Prisma.Decimal(costoTotalRecepcionRD),
        notas: validatedData.notas,
      },
      include: {
        ocChina: {
          select: {
            oc: true,
            proveedor: true,
            cantidadOrdenada: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: nuevaRecepcion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/inventario-recibido:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Datos de validación incorrectos",
          details: error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Error al crear recepción de inventario",
      },
      { status: 500 }
    );
  }
}
