import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";
import { inventarioRecibidoSchema } from "@/lib/validations";
import { distribuirGastosLogisticos } from "@/lib/calculations";
import { softDelete } from "@/lib/db-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const inventario = await prisma.inventarioRecibido.findFirst({
      where: {
        id,
        deletedAt: null,
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

    if (!inventario) {
      return NextResponse.json(
        { success: false, error: "Inventario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: inventario,
    });
  } catch (error) {
    console.error("Error en GET /api/inventario-recibido/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener inventario" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Verificar que el registro existe
    const existing = await prisma.inventarioRecibido.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Inventario no encontrado" },
        { status: 404 }
      );
    }

    // Validar datos con Zod
    const validatedData = inventarioRecibidoSchema.parse(body);

    // Verificar que la OC existe y cargar datos necesarios
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
        { success: false, error: "La OC especificada no existe" },
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

    // Si se especificó un itemId, validar sobre-recepción (Problema #5)
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

      // Validar sobre-recepción (excluyendo el registro actual)
      const cantidadYaRecibida = await prisma.inventarioRecibido.aggregate({
        where: {
          ocId: validatedData.ocId,
          itemId: validatedData.itemId,
          id: { not: id }, // EXCLUIR el registro actual
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

    // Recalcular costos distribuidos por producto
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
      // Caso 2: No se especificó producto - calcular promedio ponderado
      const totalUnidades = itemsConCostos.reduce((sum, item) => sum + item.cantidadTotal, 0);
      const totalCosto = itemsConCostos.reduce((sum, item) => sum + item.costoTotalRD, 0);

      costoUnitarioFinalRD = totalUnidades > 0 ? totalCosto / totalUnidades : 0;
      costoTotalRecepcionRD = costoUnitarioFinalRD * validatedData.cantidadRecibida;
    }

    // Actualizar la recepción con todos los campos y costos recalculados
    // NOTA: idRecepcion NO se puede modificar (es autogenerado e inmutable)
    const updated = await prisma.inventarioRecibido.update({
      where: { id },
      data: {
        // idRecepcion es inmutable - se mantiene el valor existente
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

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error en PUT /api/inventario-recibido/[id]:", error);

    if (error && typeof error === 'object' && 'errors' in error) {
      return NextResponse.json(
        { success: false, error: "Datos de entrada inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Error al actualizar inventario" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.inventarioRecibido.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Inventario no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete del inventario
    await softDelete("inventarioRecibido", id);

    return NextResponse.json({
      success: true,
      message: "Inventario eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/inventario-recibido/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar inventario" },
      { status: 500 }
    );
  }
}
