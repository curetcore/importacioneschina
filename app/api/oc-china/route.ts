import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNextId } from "@/lib/utils";

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
  try {
    const body = await request.json();

    const {
      proveedor,
      fechaOC,
      descripcionLote,
      categoriaPrincipal,
      archivoFactura,
      items,
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

    // Generar ID automático secuencial
    const lastOC = await prisma.oCChina.findFirst({
      orderBy: { oc: "desc" },
      select: { oc: true },
    });
    const oc = generateNextId("OC", lastOC?.oc);

    // Validar y normalizar cada item (Problemas #1 y #2)
    const itemsValidados: any[] = [];
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

      itemsValidados.push({
        sku: item.sku,
        nombre: item.nombre,
        material: item.material || null,
        color: item.color || null,
        especificaciones: item.especificaciones || null,
        tallaDistribucion: item.tallaDistribucion || null,
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
        archivoFactura: archivoFactura || null,
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
