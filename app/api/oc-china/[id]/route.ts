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

    // Validar cada item
    for (const item of items) {
      if (!item.sku || !item.nombre || !item.cantidadTotal || !item.precioUnitarioUSD) {
        return NextResponse.json(
          {
            success: false,
            error: "Cada producto debe tener SKU, nombre, cantidad y precio",
          },
          { status: 400 }
        );
      }
    }

    // Actualizar OC y reemplazar items en una transacción
    const updatedOC = await prisma.$transaction(async (tx) => {
      // Eliminar items antiguos
      await tx.oCChinaItem.deleteMany({
        where: { ocId: id },
      });

      // Actualizar OC y crear nuevos items
      return await tx.oCChina.update({
        where: { id },
        data: {
          oc,
          proveedor,
          fechaOC: new Date(fechaOC),
          descripcionLote,
          categoriaPrincipal,
          items: {
            create: items.map((item: any) => ({
              sku: item.sku,
              nombre: item.nombre,
              material: item.material || null,
              color: item.color || null,
              especificaciones: item.especificaciones || null,
              tallaDistribucion: item.tallaDistribucion || null,
              cantidadTotal: parseInt(item.cantidadTotal),
              precioUnitarioUSD: parseFloat(item.precioUnitarioUSD),
              subtotalUSD: parseFloat(item.precioUnitarioUSD) * parseInt(item.cantidadTotal),
            })),
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar que la OC existe
    const existing = await prisma.oCChina.findUnique({
      where: { id },
      include: {
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

    if (hasRelatedData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se puede eliminar la OC porque tiene pagos, gastos o inventario asociado",
        },
        { status: 400 }
      );
    }

    // Eliminar la OC (los items se eliminan automáticamente por CASCADE)
    await prisma.oCChina.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Orden de compra eliminada exitosamente",
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
