import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateUniqueId } from "@/lib/id-generator";
import { TallaDistribucion } from "@/lib/calculations";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { withRateLimit, RateLimits } from "@/lib/rate-limit";

interface OCItemInput {
  sku: string;
  nombre: string;
  material?: string | null;
  color?: string | null;
  especificaciones?: string | null;
  tallaDistribucion?: TallaDistribucion | null;
  cantidadTotal: number | string;
  precioUnitarioUSD: number | string;
}

interface OCItemValidado {
  sku: string;
  nombre: string;
  material: string | null;
  color: string | null;
  especificaciones: string | null;
  tallaDistribucion?: InputJsonValue;
  cantidadTotal: number;
  precioUnitarioUSD: number;
  subtotalUSD: number;
}

// Función de validación para tallaDistribucion
function validarTallaDistribucion(tallas: unknown): InputJsonValue | undefined {
  if (!tallas) return undefined;

  // Validar que sea un objeto
  if (typeof tallas !== 'object' || Array.isArray(tallas)) {
    console.warn('⚠️ tallaDistribucion inválida: no es un objeto');
    return undefined;
  }

  // Validar que todos los valores sean números positivos
  const tallasObj = tallas as Record<string, unknown>;
  const tallasValidadas: TallaDistribucion = {};

  for (const [talla, cantidad] of Object.entries(tallasObj)) {
    const cantidadNum = typeof cantidad === 'number' ? cantidad : parseInt(String(cantidad));

    if (isNaN(cantidadNum) || cantidadNum < 0) {
      console.warn(`⚠️ tallaDistribucion[${talla}] inválida: ${cantidad}`);
      continue; // Saltar tallas inválidas
    }

    tallasValidadas[talla] = cantidadNum;
  }

  return Object.keys(tallasValidadas).length > 0 ? tallasValidadas : undefined;
}

// GET /api/oc-china - Obtener todas las órdenes de compra
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
          items: true,
          _count: {
            select: {
              items: true,
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

// POST /api/oc-china - Crear nueva orden de compra con items
export async function POST(request: NextRequest) {
  // Rate limiting para mutations (20 req/10s)
  const rateLimitError = await withRateLimit(request, RateLimits.mutation);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();

    const {
      proveedor,
      fechaOC,
      descripcionLote,
      categoriaPrincipal,
      items,
      adjuntos,
    } = body;

    // Validaciones básicas
    if (!proveedor || !fechaOC || !categoriaPrincipal) {
      return NextResponse.json(
        {
          success: false,
          error: "Faltan campos requeridos",
        },
        { status: 400 }
      );
    }

    // Validar que haya al menos un item
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Debe agregar al menos un producto a la orden",
        },
        { status: 400 }
      );
    }

    // Generar ID automático secuencial (thread-safe)
    const oc = await generateUniqueId("oCChina", "oc", "OC");

    // Validar y normalizar cada item (Problemas #1 y #2)
    const itemsValidados: OCItemValidado[] = [];
    for (const item of items) {
      // Validaciones básicas
      if (!item.sku || !item.nombre) {
        return NextResponse.json(
          {
            success: false,
            error: "Cada producto debe tener SKU y nombre",
          },
          { status: 400 }
        );
      }

      // Validar cantidadTotal
      const cantidad = parseInt(item.cantidadTotal);
      if (isNaN(cantidad) || cantidad <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Cantidad inválida para ${item.sku}. Debe ser un número entero mayor a 0`,
          },
          { status: 400 }
        );
      }

      // Validar precioUnitarioUSD
      const precio = parseFloat(item.precioUnitarioUSD);
      if (isNaN(precio) || precio <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Precio inválido para ${item.sku}. Debe ser un número mayor a 0`,
          },
          { status: 400 }
        );
      }

      // Calcular subtotal
      const subtotal = precio * cantidad;

      // Validar overflow (máximo razonable: $999,999.99)
      if (subtotal > 999999.99) {
        return NextResponse.json(
          {
            success: false,
            error: `Subtotal excede límite máximo para ${item.sku}: $${subtotal.toFixed(2)}`,
          },
          { status: 400 }
        );
      }

      // Validar tallaDistribucion de manera segura (Problema #9)
      const tallasValidadas = validarTallaDistribucion(item.tallaDistribucion);

      itemsValidados.push({
        sku: item.sku,
        nombre: item.nombre,
        material: item.material || null,
        color: item.color || null,
        especificaciones: item.especificaciones || null,
        tallaDistribucion: tallasValidadas,
        cantidadTotal: cantidad,
        precioUnitarioUSD: precio,
        subtotalUSD: subtotal,
      });
    }

    // Crear OC con items validados
    const nuevaOC = await prisma.oCChina.create({
      data: {
        oc,
        proveedor,
        fechaOC: new Date(fechaOC),
        descripcionLote,
        categoriaPrincipal,
        adjuntos: adjuntos || null,
        items: {
          create: itemsValidados,
        },
      },
      include: {
        items: true,
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
