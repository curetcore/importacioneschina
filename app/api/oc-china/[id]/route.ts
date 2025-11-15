import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/oc-china/[id] - Obtener una orden de compra específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const oc = await prisma.oCChina.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: {
            sku: 'asc',
          },
        },
        pagosChina: true,
        gastosLogisticos: true,
        inventarioRecibido: {
          include: {
            item: true,
          },
        },
        _count: {
          select: {
            items: true,
            pagosChina: true,
            gastosLogisticos: true,
            inventarioRecibido: true,
          },
        },
      },
    });

    if (!oc) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden de compra no encontrada",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: oc,
    });
  } catch (error) {
    console.error("Error en GET /api/oc-china/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener orden de compra",
      },
      { status: 500 }
    );
  }
}

// PUT /api/oc-china/[id] - Actualizar una orden de compra
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      oc,
      proveedor,
      fechaOC,
      descripcionLote,
      categoriaPrincipal,
      items,
      adjuntos,
    } = body;

    // Verificar que la OC existe
    const existing = await prisma.oCChina.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden de compra no encontrada",
        },
        { status: 404 }
      );
    }

    // Validaciones básicas
    if (!oc || !proveedor || !fechaOC || !categoriaPrincipal) {
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

    // Si se está cambiando el código OC, verificar que no exista otro con ese código
    if (oc !== existing.oc) {
      const duplicate = await prisma.oCChina.findUnique({
        where: { oc },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: "Ya existe una OC con ese código",
          },
          { status: 400 }
        );
      }
    }

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

    // Actualizar OC y reemplazar items en una transacción (Problema #3)
    const updatedOC = await prisma.$transaction(async (tx) => {
      // VALIDACIÓN: Verificar si hay inventario vinculado a items específicos
      const itemsConInventario = await tx.inventarioRecibido.findFirst({
        where: {
          ocId: id,
          itemId: { not: null },
        },
      });

      if (itemsConInventario) {
        throw new Error(
          "No se puede editar la OC porque tiene inventario recibido vinculado a productos específicos. " +
          "Debe eliminar las recepciones primero o crear una nueva OC."
        );
      }

      // Si no hay inventario vinculado, proceder con delete/create
      await tx.oCChinaItem.deleteMany({
        where: { ocId: id },
      });

      // Actualizar OC y crear nuevos items validados
      return await tx.oCChina.update({
        where: { id },
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
    });

    return NextResponse.json({
      success: true,
      data: updatedOC,
    });
  } catch (error: any) {
    console.error("Error en PUT /api/oc-china/[id]:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar orden de compra",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/oc-china/[id] - Eliminar una orden de compra
// Query params:
//   - cascade=true: Eliminar todos los datos relacionados también
//   - preview=true: Solo mostrar qué se eliminará sin borrar
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const cascade = searchParams.get("cascade") === "true";
    const preview = searchParams.get("preview") === "true";

    // Verificar que la OC existe y obtener datos relacionados
    const existing = await prisma.oCChina.findUnique({
      where: { id },
      include: {
        pagosChina: {
          select: {
            id: true,
            idPago: true,
            montoRDNeto: true,
          },
        },
        gastosLogisticos: {
          select: {
            id: true,
            idGasto: true,
            montoRD: true,
          },
        },
        inventarioRecibido: {
          select: {
            id: true,
            idRecepcion: true,
            cantidadRecibida: true,
          },
        },
        _count: {
          select: {
            items: true,
            pagosChina: true,
            gastosLogisticos: true,
            inventarioRecibido: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden de compra no encontrada",
        },
        { status: 404 }
      );
    }

    // Verificar que no tenga datos relacionados
    const hasRelatedData =
      existing._count.pagosChina > 0 ||
      existing._count.gastosLogisticos > 0 ||
      existing._count.inventarioRecibido > 0;

    // Si es preview, devolver lo que se va a eliminar
    if (preview) {
      return NextResponse.json({
        success: true,
        data: {
          oc: existing.oc,
          hasRelatedData,
          counts: {
            items: existing._count.items,
            pagos: existing._count.pagosChina,
            gastos: existing._count.gastosLogisticos,
            inventario: existing._count.inventarioRecibido,
          },
          details: {
            pagos: existing.pagosChina.map((p) => ({
              id: p.idPago,
              monto: parseFloat(p.montoRDNeto?.toString() || "0"),
            })),
            gastos: existing.gastosLogisticos.map((g) => ({
              id: g.idGasto,
              monto: parseFloat(g.montoRD.toString()),
            })),
            inventario: existing.inventarioRecibido.map((i) => ({
              id: i.idRecepcion,
              cantidad: i.cantidadRecibida,
            })),
          },
        },
      });
    }

    // Si tiene datos relacionados y no se pidió cascade, rechazar
    if (hasRelatedData && !cascade) {
      return NextResponse.json(
        {
          success: false,
          error: "No se puede eliminar la OC porque tiene pagos, gastos o inventario asociado",
          counts: {
            pagos: existing._count.pagosChina,
            gastos: existing._count.gastosLogisticos,
            inventario: existing._count.inventarioRecibido,
          },
        },
        { status: 400 }
      );
    }

    // Si se pidió cascade, eliminar todo en orden
    if (cascade && hasRelatedData) {
      await prisma.$transaction(async (tx) => {
        // 1. Eliminar inventario recibido
        if (existing._count.inventarioRecibido > 0) {
          await tx.inventarioRecibido.deleteMany({
            where: { ocId: id },
          });
        }

        // 2. Eliminar gastos logísticos
        if (existing._count.gastosLogisticos > 0) {
          await tx.gastosLogisticos.deleteMany({
            where: { ocId: id },
          });
        }

        // 3. Eliminar pagos
        if (existing._count.pagosChina > 0) {
          await tx.pagosChina.deleteMany({
            where: { ocId: id },
          });
        }

        // 4. Eliminar la OC (los items se eliminan automáticamente por CASCADE)
        await tx.oCChina.delete({
          where: { id },
        });
      });
    } else {
      // Eliminar solo la OC (sin datos relacionados)
      await prisma.oCChina.delete({
        where: { id },
      });
    }

    return NextResponse.json({
      success: true,
      message: cascade
        ? "Orden de compra y todos sus datos relacionados eliminados exitosamente"
        : "Orden de compra eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/oc-china/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar orden de compra",
      },
      { status: 500 }
    );
  }
}
