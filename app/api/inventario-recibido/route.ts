import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inventarioRecibidoSchema } from "@/lib/validations";
import { distribuirGastosLogisticos } from "@/lib/calculations";
import { generateUniqueId } from "@/lib/id-generator";
import { Prisma } from "@prisma/client";
import { withRateLimit, RateLimits } from "@/lib/rate-limit";

// GET /api/inventario-recibido - Obtener todos los inventarios
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
            },
          },
          item: true,
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
  // Rate limiting para mutations (20 req/10s)
  const rateLimitError = await withRateLimit(request, RateLimits.mutation);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();

    // Generar ID automático secuencial (thread-safe)
    const idRecepcion = await generateUniqueId("inventarioRecibido", "idRecepcion", "REC");

    // Validar con Zod (sin necesidad de idRecepcion en el body)
    const validatedData = inventarioRecibidoSchema.parse(body);

    // Verificar que la OC existe y cargar todos los datos necesarios
    const oc = await prisma.oCChina.findUnique({
      where: { id: validatedData.ocId },
      include: {
        items: true,
        pagosChina: true,
        gastosLogisticos: true,
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

    // Validar que hay items en la OC
    if (!oc.items || oc.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "La OC no tiene productos registrados",
        },
        { status: 400 }
      );
    }

    // Si se especificó un itemId, validar que existe y sobre-recepción (Problema #5)
    if (validatedData.itemId) {
      const item = oc.items.find(i => i.id === validatedData.itemId);
      if (!item) {
        return NextResponse.json(
          {
            success: false,
            error: "El producto especificado no pertenece a esta OC",
          },
          { status: 400 }
        );
      }

      // Validar sobre-recepción
      const cantidadYaRecibida = await prisma.inventarioRecibido.aggregate({
        where: {
          ocId: validatedData.ocId,
          itemId: validatedData.itemId,
        },
        _sum: {
          cantidadRecibida: true,
        },
      });

      const totalRecibido = (cantidadYaRecibida._sum.cantidadRecibida || 0) + validatedData.cantidadRecibida;

      // Bloquear sobre-recepción
      if (totalRecibido > item.cantidadTotal) {
        return NextResponse.json(
          {
            success: false,
            error: `Sobre-recepción detectada: ${item.nombre} (SKU: ${item.sku}). ` +
                   `Ordenado: ${item.cantidadTotal}, Ya recibido: ${cantidadYaRecibida._sum.cantidadRecibida || 0}, ` +
                   `Intentando recibir: ${validatedData.cantidadRecibida}, Total: ${totalRecibido}`,
          },
          { status: 400 }
        );
      }

      // Warning si está cerca del límite (> 95%)
      if (totalRecibido > item.cantidadTotal * 0.95) {
        console.warn(
          `⚠️ Recepción cerca del límite: ${item.sku} - ${totalRecibido}/${item.cantidadTotal}`
        );
      }
    }

    // Calcular costos distribuidos por producto
    const itemsConCostos = distribuirGastosLogisticos(
      oc.items,
      oc.gastosLogisticos,
      oc.pagosChina
    );

    let costoUnitarioFinalRD: number;
    let costoTotalRecepcionRD: number;

    if (validatedData.itemId) {
      // Caso 1: Se especificó un producto - usar su costo exacto
      const itemConCosto = itemsConCostos.find(item => item.id === validatedData.itemId);

      if (!itemConCosto) {
        return NextResponse.json(
          {
            success: false,
            error: "No se pudo calcular el costo del producto",
          },
          { status: 500 }
        );
      }

      costoUnitarioFinalRD = itemConCosto.costoUnitarioRD;
      costoTotalRecepcionRD = costoUnitarioFinalRD * validatedData.cantidadRecibida;
    } else {
      // Caso 2: No se especificó producto - calcular promedio ponderado de todos los items
      // (Para compatibilidad con recepciones antiguas o de lotes mixtos)
      const totalUnidades = itemsConCostos.reduce((sum, item) => sum + item.cantidadTotal, 0);
      const totalCosto = itemsConCostos.reduce((sum, item) => sum + item.costoTotalRD, 0);

      costoUnitarioFinalRD = totalUnidades > 0 ? totalCosto / totalUnidades : 0;
      costoTotalRecepcionRD = costoUnitarioFinalRD * validatedData.cantidadRecibida;
    }

    // Crear la recepción con los costos calculados
    const nuevaRecepcion = await prisma.inventarioRecibido.create({
      data: {
        idRecepcion,
        ocId: validatedData.ocId,
        itemId: validatedData.itemId || null,
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
          },
        },
        item: true,
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
