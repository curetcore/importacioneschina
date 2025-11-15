import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularOC } from "@/lib/calculations";

export async function GET() {
  try {
    const ocs = await prisma.oCChina.findMany({
      include: {
        pagosChina: true,
        gastosLogisticos: true,
        inventarioRecibido: true,
      },
      orderBy: {
        fechaOC: "desc",
      },
    });

    const ocsCalculadas = ocs.map((oc) => {
      const calculos = calcularOC({
        costoFOBTotalUSD: oc.costoFOBTotalUSD,
        cantidadOrdenada: oc.cantidadOrdenada,
        pagos: oc.pagosChina,
        gastos: oc.gastosLogisticos,
        inventario: oc.inventarioRecibido,
      });

      return {
        id: oc.id,
        oc: oc.oc,
        proveedor: oc.proveedor,
        fechaOC: oc.fechaOC,
        categoriaPrincipal: oc.categoriaPrincipal,
        cantidadOrdenada: oc.cantidadOrdenada,
        ...calculos,
      };
    });

    const inversionTotal = ocsCalculadas.reduce((sum, oc) => sum + oc.totalInversionRD, 0);
    const unidadesOrdenadas = ocsCalculadas.reduce((sum, oc) => sum + oc.cantidadOrdenada, 0);
    const unidadesRecibidas = ocsCalculadas.reduce((sum, oc) => sum + oc.cantidadRecibida, 0);
    const diferenciaUnidades = unidadesOrdenadas - unidadesRecibidas;
    const costoPromedioUnitario = unidadesRecibidas > 0 ? inversionTotal / unidadesRecibidas : 0;
    const ocsActivas = ocsCalculadas.filter((oc) => oc.cantidadRecibida < oc.cantidadOrdenada).length;
    const ocsCompletadas = ocsCalculadas.filter((oc) => oc.cantidadRecibida >= oc.cantidadOrdenada).length;

    const inversionPorProveedor = ocsCalculadas.reduce((acc, oc) => {
      const existente = acc.find((item) => item.proveedor === oc.proveedor);
      if (existente) {
        existente.total += oc.totalInversionRD;
      } else {
        acc.push({
          proveedor: oc.proveedor,
          total: oc.totalInversionRD,
        });
      }
      return acc;
    }, [] as Array<{ proveedor: string; total: number }>);

    const gastos = await prisma.gastosLogisticos.findMany();
    const gastosPorTipo = gastos.reduce((acc, gasto) => {
      const existente = acc.find((item) => item.tipo === gasto.tipoGasto);
      const monto = parseFloat(gasto.montoRD.toString());
      if (existente) {
        existente.total += monto;
      } else {
        acc.push({
          tipo: gasto.tipoGasto,
          total: monto,
        });
      }
      return acc;
    }, [] as Array<{ tipo: string; total: number }>);

    const topOCs = [...ocsCalculadas]
      .sort((a, b) => b.totalInversionRD - a.totalInversionRD)
      .slice(0, 5)
      .map((oc) => ({
        oc: oc.oc,
        proveedor: oc.proveedor,
        inversion: oc.totalInversionRD,
        unidades: oc.cantidadRecibida,
        costoUnitario: oc.costoUnitarioFinalRD,
      }));

    const pagosRecientes = await prisma.pagosChina.findMany({
      take: 5,
      orderBy: { fechaPago: "desc" },
      include: {
        ocChina: { select: { oc: true } },
      },
    });

    const gastosRecientes = await prisma.gastosLogisticos.findMany({
      take: 5,
      orderBy: { fechaGasto: "desc" },
      include: {
        ocChina: { select: { oc: true } },
      },
    });

    const transacciones = [
      ...pagosRecientes.map((p) => ({
        tipo: "Pago" as const,
        id: p.idPago,
        oc: p.ocChina.oc,
        fecha: p.fechaPago,
        monto: parseFloat(p.montoRDNeto?.toString() || "0"),
        descripcion: `${p.tipoPago} - ${p.metodoPago}`,
      })),
      ...gastosRecientes.map((g) => ({
        tipo: "Gasto" as const,
        id: g.idGasto,
        oc: g.ocChina.oc,
        fecha: g.fechaGasto,
        monto: parseFloat(g.montoRD.toString()),
        descripcion: g.tipoGasto,
      })),
    ]
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          inversionTotal: Math.round(inversionTotal * 100) / 100,
          unidadesOrdenadas,
          unidadesRecibidas,
          diferenciaUnidades,
          costoPromedioUnitario: Math.round(costoPromedioUnitario * 100) / 100,
          ocsActivas,
          ocsCompletadas,
        },
        graficos: {
          inversionPorProveedor: inversionPorProveedor.map((item) => ({
            name: item.proveedor,
            value: Math.round(item.total * 100) / 100,
          })),
          gastosPorTipo: gastosPorTipo.map((item) => ({
            name: item.tipo,
            value: Math.round(item.total * 100) / 100,
          })),
        },
        tablas: {
          topOCs,
          transacciones,
        },
        ocs: ocsCalculadas,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener datos del dashboard",
      },
      { status: 500 }
    );
  }
}
