import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ocId = searchParams.get("ocId")

    // Obtener todos los productos del inventario recibido
    const inventarios = await prisma.inventarioRecibido.findMany({
      where: ocId ? { ocId } : {},
      include: {
        ocChina: {
          include: {
            pagosChina: true,
            gastosLogisticos: true,
          },
        },
        item: true,
      },
      orderBy: {
        fechaLlegada: "desc",
      },
    })

    // Calcular desglose para cada producto
    const analisis = inventarios.map((inv) => {
      const item = inv.item
      if (!item) {
        return null // Skip si no hay item vinculado
      }

      // 1. Costo FOB original
      const costoFobUsd = parseFloat(item.precioUnitarioUSD.toString())

      // 2. Total de pagos de esta OC en RD$
      const totalPagosOC = inv.ocChina.pagosChina.reduce(
        (sum, pago) => sum + parseFloat(pago.montoRDNeto?.toString() || "0"),
        0
      )

      // 3. Total de gastos logísticos de esta OC en RD$
      const totalGastosOC = inv.ocChina.gastosLogisticos.reduce(
        (sum, gasto) => sum + parseFloat(gasto.montoRD.toString()),
        0
      )

      // 4. Total de unidades de la OC (para distribución proporcional)
      const totalUnidadesOC = inventarios
        .filter((i) => i.ocId === inv.ocId)
        .reduce((sum, i) => sum + i.cantidadRecibida, 0)

      // 5. Distribución proporcional por unidad
      const porcentajeDeEstaRecepcion = totalUnidadesOC > 0 ? inv.cantidadRecibida / totalUnidadesOC : 0

      const pagosDistribuidosTotal = totalPagosOC * porcentajeDeEstaRecepcion
      const gastosDistribuidosTotal = totalGastosOC * porcentajeDeEstaRecepcion

      const pagosDistribuidosUnitario = inv.cantidadRecibida > 0 ? pagosDistribuidosTotal / inv.cantidadRecibida : 0
      const gastosDistribuidosUnitario = inv.cantidadRecibida > 0 ? gastosDistribuidosTotal / inv.cantidadRecibida : 0

      // 6. Conversión de FOB a RD$ (desde los pagos, obtenemos tasa de cambio promedio)
      const tasaPromedio = inv.ocChina.pagosChina.length > 0
        ? inv.ocChina.pagosChina.reduce((sum, p) => sum + parseFloat(p.tasaCambio.toString()), 0) /
          inv.ocChina.pagosChina.length
        : 58 // Tasa por defecto si no hay pagos

      const costoFobRD = costoFobUsd * tasaPromedio

      // 7. Comisiones bancarias (parte de pagos)
      const comisionesTotal = inv.ocChina.pagosChina.reduce(
        (sum, pago) => sum + parseFloat(pago.comisionBancoRD.toString()),
        0
      )
      const comisionesDistribuidas = comisionesTotal * porcentajeDeEstaRecepcion
      const comisionesUnitarias = inv.cantidadRecibida > 0 ? comisionesDistribuidas / inv.cantidadRecibida : 0

      // 8. Costo final (debería coincidir con costoUnitarioFinalRD)
      const costoFinalCalculado = costoFobRD + pagosDistribuidosUnitario + gastosDistribuidosUnitario + comisionesUnitarias
      const costoFinalReal = inv.costoUnitarioFinalRD ? parseFloat(inv.costoUnitarioFinalRD.toString()) : costoFinalCalculado

      return {
        id: inv.id,
        idRecepcion: inv.idRecepcion,
        sku: item.sku,
        nombre: item.nombre,
        oc: inv.ocChina.oc,
        proveedor: inv.ocChina.proveedor,
        cantidad: inv.cantidadRecibida,
        bodega: inv.bodegaInicial,
        fechaLlegada: inv.fechaLlegada,

        // Desglose de costos unitarios
        desglose: {
          costoFobUsd,
          tasaCambio: tasaPromedio,
          costoFobRD,
          pagos: pagosDistribuidosUnitario,
          gastos: gastosDistribuidosUnitario,
          comisiones: comisionesUnitarias,
        },

        // Totales
        costoFinalUnitario: costoFinalReal,
        costoTotalRecepcion: costoFinalReal * inv.cantidadRecibida,
      }
    }).filter(Boolean) // Remover nulls

    // Calcular totales generales
    const totales = {
      totalProductos: analisis.length,
      totalUnidades: analisis.reduce((sum, a) => sum + (a?.cantidad || 0), 0),
      inversionTotal: analisis.reduce((sum, a) => sum + (a?.costoTotalRecepcion || 0), 0),
      costoPromedioUnitario: analisis.length > 0
        ? analisis.reduce((sum, a) => sum + (a?.costoFinalUnitario || 0), 0) / analisis.length
        : 0,
    }

    return NextResponse.json({
      success: true,
      data: analisis,
      totales,
    })
  } catch (error) {
    console.error("Error en análisis de costos:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al calcular análisis de costos",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}
