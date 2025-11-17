import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gastosLogisticosSchema } from "@/lib/validations";
import { generateUniqueId } from "@/lib/id-generator";
import { Prisma } from "@prisma/client";
import { withRateLimit, RateLimits } from "@/lib/rate-limit";

// GET /api/gastos-logisticos - Obtener todos los gastos
export async function GET(request: NextRequest) {
  // Rate limiting para queries (60 req/min)
  const rateLimitError = await withRateLimit(request, RateLimits.query);
  if (rateLimitError) return rateLimitError;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const requestedLimit = parseInt(searchParams.get("limit") || "20");
    // Validación de límite máximo para prevenir ataques de denegación de servicio
    const limit = Math.min(requestedLimit, 100); // Máximo 100 registros por página
    const search = searchParams.get("search") || "";
    const ocId = searchParams.get("ocId") || "";
    const tipoGasto = searchParams.get("tipoGasto") || "";

    const skip = (page - 1) * limit;

    const where: Prisma.GastosLogisticosWhereInput = {
      ...(search && {
        idGasto: {
          contains: search,
          mode: "insensitive",
        },
      }),
      ...(ocId && {
        ocId: ocId,
      }),
      ...(tipoGasto && {
        tipoGasto: tipoGasto,
      }),
    };

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
        error: "Error al obtener gastos logísticos",
      },
      { status: 500 }
    );
  }
}

// POST /api/gastos-logisticos - Crear nuevo gasto
export async function POST(request: NextRequest) {
  // Rate limiting para mutations (20 req/10s)
  const rateLimitError = await withRateLimit(request, RateLimits.mutation);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();

    // Generar ID automático secuencial (thread-safe)
    const idGasto = await generateUniqueId("gastosLogisticos", "idGasto", "GASTO");

    // Validar con Zod (sin necesidad de idGasto en el body)
    const validatedData = gastosLogisticosSchema.parse(body);

    // Extraer adjuntos (no validado por Zod)
    const { adjuntos } = body;

    // Verificar que la OC existe
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

    // Crear el gasto
    const nuevoGasto = await prisma.gastosLogisticos.create({
      data: {
        idGasto,
        ocId: validatedData.ocId,
        fechaGasto: validatedData.fechaGasto,
        tipoGasto: validatedData.tipoGasto,
        proveedorServicio: validatedData.proveedorServicio,
        metodoPago: validatedData.metodoPago,
        montoRD: new Prisma.Decimal(validatedData.montoRD),
        notas: validatedData.notas,
        adjuntos: adjuntos || null,
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

    return NextResponse.json(
      {
        success: true,
        data: nuevoGasto,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/gastos-logisticos:", error);

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
        error: "Error al crear gasto logístico",
      },
      { status: 500 }
    );
  }
}
