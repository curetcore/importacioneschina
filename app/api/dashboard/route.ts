import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { calcularOC } from "@/lib/calculations"
import { handleApiError } from "@/lib/api-error-handler"
import { QueryCache } from "@/lib/cache-helpers"
import { CacheKeys, CacheTTL } from "@/lib/redis"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Cachear dashboard completo por 5 minutos
    const cachedData = await QueryCache.stats(
      CacheKeys.dashboard(),
      async () => {
        return await generateDashboardData()
      },
      CacheTTL.DASHBOARD
    )

    return NextResponse.json({
      success: true,
      data: cachedData,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

async function generateDashboardData() {
  const db = await getPrismaClient()
  // PERFORMANCE: Limitar carga de OCs para prevenir problemas de memoria
  // Dashboard solo necesita datos agregados, no todas las OCs
  const MAX_OCS_DASHBOARD = 500 // Límite razonable para dashboard

  const ocs = await db.oCChina.findMany({
    where: {
      deletedAt: null, // Only active OCs
    },
    take: MAX_OCS_DASHBOARD,
    include: {
      items: {
        where: {
          deletedAt: null, // Only active items
        },
      },
      pagosChina: {
        where: {
          deletedAt: null, // Only active payments
        },
      },
      gastosLogisticos: {
        include: {
          gasto: true,
        },
      },
      inventarioRecibido: {
        where: {
          deletedAt: null, // Only active inventory
        },
        include: {
          item: true,
        },
      },
    },
    orderBy: {
      fechaOC: "desc",
    },
  })

  // PERFORMANCE WARNING: Si hay más OCs que el límite, notificar
  const totalOCs = await db.oCChina.count()
  const datosLimitados = totalOCs > MAX_OCS_DASHBOARD

  if (datosLimitados) {
    console.warn(
      `⚠️ Dashboard mostrando datos de ${MAX_OCS_DASHBOARD} OCs más recientes de ${totalOCs} totales`
    )
  }

  const ocsCalculadas = ocs.map(oc => {
    // Calcular valores desde items
    const cantidadOrdenada = oc.items?.reduce((sum, item) => sum + item.cantidadTotal, 0) || 0
    const costoFOBTotalUSD =
      oc.items?.reduce((sum, item) => sum + parseFloat(item.subtotalUSD.toString()), 0) || 0

    // Transform gastosLogisticos from junction table to flat gasto objects
    const gastosTransformed =
      oc.gastosLogisticos?.map(gl => gl.gasto).filter(g => g.deletedAt === null) || []

    const calculos = calcularOC({
      costoFOBTotalUSD,
      cantidadOrdenada,
      pagos: oc.pagosChina,
      gastos: gastosTransformed,
      inventario: oc.inventarioRecibido,
    })

    return {
      id: oc.id,
      oc: oc.oc,
      proveedor: oc.proveedor,
      fechaOC: oc.fechaOC,
      categoriaPrincipal: oc.categoriaPrincipal,
      cantidadOrdenada,
      items: oc.items,
      inventarioRecibido: oc.inventarioRecibido,
      ...calculos,
    }
  })

  // KPIs principales
  const inversionTotal = ocsCalculadas.reduce(
    (sum, oc) => sum + Number(oc.totalInversionRD || 0),
    0
  )
  const unidadesOrdenadas = ocsCalculadas.reduce((sum, oc) => sum + oc.cantidadOrdenada, 0)
  const unidadesRecibidas = ocsCalculadas.reduce((sum, oc) => sum + oc.cantidadRecibida, 0)
  const diferenciaUnidades = unidadesOrdenadas - unidadesRecibidas
  const costoPromedioUnitario = unidadesRecibidas > 0 ? inversionTotal / unidadesRecibidas : 0
  const ocsActivas = ocsCalculadas.filter(oc => oc.cantidadRecibida < oc.cantidadOrdenada).length
  const ocsCompletadas = ocsCalculadas.filter(
    oc => oc.cantidadRecibida >= oc.cantidadOrdenada
  ).length

  // OPTIMIZACIÓN: Usar los pagos y gastos que ya tenemos de las OCs cargadas
  // en lugar de hacer queries adicionales (elimina N+1 queries)
  const todosPagos = ocs.flatMap(oc =>
    oc.pagosChina.map(pago => ({
      ...pago,
      ocChina: { oc: oc.oc },
    }))
  )

  // IMPORTANTE: Deduplicar gastos compartidos para evitar multiplicación
  // Si un gasto está asociado con múltiples OCs, solo debe contarse una vez
  // pero dividiendo el monto por el número de OCs asociadas
  const gastosUnicos = new Map<string, any>()

  ocs.forEach(oc => {
    oc.gastosLogisticos
      .filter(gl => gl.gasto.deletedAt === null)
      .forEach(gl => {
        const gastoId = gl.gasto.id
        if (!gastosUnicos.has(gastoId)) {
          // Primera vez que vemos este gasto - agregarlo con toda su info
          gastosUnicos.set(gastoId, {
            ...gl.gasto,
            ordenesCompra: oc.gastosLogisticos
              .filter(g => g.gasto.id === gastoId)
              .map(() => ({ ocId: oc.id })),
            numOrdenes: 1, // Contaremos las OCs asociadas
          })
        } else {
          // Ya existe - solo incrementar contador de órdenes
          const existing = gastosUnicos.get(gastoId)
          existing.numOrdenes += 1
        }
      })
  })

  const todosGastos = Array.from(gastosUnicos.values())

  // Total de comisiones bancarias
  const totalComisiones = todosPagos.reduce(
    (sum, pago) =>
      sum + parseFloat(pago.comisionBancoUSD.toString()) * parseFloat(pago.tasaCambio.toString()),
    0
  )

  // Pagos por método
  const pagosPorMetodo = todosPagos.reduce(
    (acc, pago) => {
      const existente = acc.find(item => item.metodo === pago.metodoPago)
      const monto = parseFloat(pago.montoRDNeto?.toString() || "0")
      if (existente) {
        existente.total += monto
        existente.cantidad += 1
      } else {
        acc.push({
          metodo: pago.metodoPago,
          total: monto,
          cantidad: 1,
        })
      }
      return acc
    },
    [] as Array<{ metodo: string; total: number; cantidad: number }>
  )

  // Pagos por tipo
  const pagosPorTipo = todosPagos.reduce(
    (acc, pago) => {
      const existente = acc.find(item => item.tipo === pago.tipoPago)
      const monto = parseFloat(pago.montoRDNeto?.toString() || "0")
      if (existente) {
        existente.total += monto
        existente.cantidad += 1
      } else {
        acc.push({
          tipo: pago.tipoPago,
          total: monto,
          cantidad: 1,
        })
      }
      return acc
    },
    [] as Array<{ tipo: string; total: number; cantidad: number }>
  )

  // Pagos por moneda
  const pagosPorMoneda = todosPagos.reduce(
    (acc, pago) => {
      const existente = acc.find(item => item.moneda === pago.moneda)
      const montoOriginal = parseFloat(pago.montoOriginal.toString())
      const montoRD = parseFloat(pago.montoRDNeto?.toString() || "0")
      if (existente) {
        existente.totalOriginal += montoOriginal
        existente.totalRD += montoRD
        existente.cantidad += 1
      } else {
        acc.push({
          moneda: pago.moneda,
          totalOriginal: montoOriginal,
          totalRD: montoRD,
          cantidad: 1,
        })
      }
      return acc
    },
    [] as Array<{ moneda: string; totalOriginal: number; totalRD: number; cantidad: number }>
  )

  // Tasas de cambio promedio
  const tasasPorMoneda = todosPagos.reduce(
    (acc, pago) => {
      if (pago.moneda !== "RD$") {
        const existente = acc.find(item => item.moneda === pago.moneda)
        const tasa = parseFloat(pago.tasaCambio.toString())
        if (existente) {
          existente.sumaTasas += tasa
          existente.cantidad += 1
        } else {
          acc.push({
            moneda: pago.moneda,
            sumaTasas: tasa,
            cantidad: 1,
          })
        }
      }
      return acc
    },
    [] as Array<{ moneda: string; sumaTasas: number; cantidad: number }>
  )

  const tasasPromedio = tasasPorMoneda.map(item => ({
    moneda: item.moneda,
    tasaPromedio: item.cantidad > 0 ? item.sumaTasas / item.cantidad : 0,
  }))

  // Gastos por tipo
  const gastosPorTipo = todosGastos.reduce(
    (acc, gasto) => {
      const existente = acc.find(item => item.tipo === gasto.tipoGasto)
      const monto = parseFloat(gasto.montoRD.toString())

      // Si el gasto está asociado con múltiples órdenes, dividir el monto
      const numOrdenes = gasto.numOrdenes || 1
      const montoPorOrden = monto / numOrdenes

      if (existente) {
        existente.total += montoPorOrden
        existente.cantidad += 1
      } else {
        acc.push({
          tipo: gasto.tipoGasto,
          total: montoPorOrden,
          cantidad: 1,
        })
      }
      return acc
    },
    [] as Array<{ tipo: string; total: number; cantidad: number }>
  )

  // Gastos por proveedor de servicio
  const gastosPorProveedor = todosGastos
    .filter(g => g.proveedorServicio)
    .reduce(
      (acc, gasto) => {
        const proveedor = gasto.proveedorServicio || "Sin especificar"
        const existente = acc.find(item => item.proveedor === proveedor)
        const monto = parseFloat(gasto.montoRD.toString())

        // Si el gasto está asociado con múltiples órdenes, dividir el monto
        const numOrdenes = gasto.numOrdenes || 1
        const montoPorOrden = monto / numOrdenes

        if (existente) {
          existente.total += montoPorOrden
          existente.cantidad += 1
        } else {
          acc.push({
            proveedor,
            total: montoPorOrden,
            cantidad: 1,
          })
        }
        return acc
      },
      [] as Array<{ proveedor: string; total: number; cantidad: number }>
    )
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Inventario por bodega
  const inventarioPorBodega = ocsCalculadas.reduce(
    (acc, oc) => {
      oc.inventarioRecibido.forEach(inv => {
        const existente = acc.find(item => item.bodega === inv.bodegaInicial)
        if (existente) {
          existente.unidades += inv.cantidadRecibida
        } else {
          acc.push({
            bodega: inv.bodegaInicial,
            unidades: inv.cantidadRecibida,
          })
        }
      })
      return acc
    },
    [] as Array<{ bodega: string; unidades: number }>
  )

  // Top productos (SKUs)
  const productosPorSKU = ocsCalculadas.reduce(
    (acc, oc) => {
      oc.items.forEach(item => {
        const existente = acc.find(p => p.sku === item.sku)
        if (existente) {
          existente.unidades += item.cantidadTotal
          existente.valorUSD += parseFloat(item.subtotalUSD.toString())
        } else {
          acc.push({
            sku: item.sku,
            nombre: item.nombre,
            unidades: item.cantidadTotal,
            valorUSD: parseFloat(item.subtotalUSD.toString()),
          })
        }
      })
      return acc
    },
    [] as Array<{ sku: string; nombre: string; unidades: number; valorUSD: number }>
  )

  const topProductos = [...productosPorSKU].sort((a, b) => b.unidades - a.unidades).slice(0, 5)

  // Compras por categoría
  const comprasPorCategoria = ocsCalculadas.reduce(
    (acc, oc) => {
      const existente = acc.find(item => item.categoria === oc.categoriaPrincipal)
      const unidades = oc.cantidadOrdenada
      const inversion = oc.totalInversionRD
      if (existente) {
        existente.unidades += unidades
        existente.inversion += inversion
      } else {
        acc.push({
          categoria: oc.categoriaPrincipal,
          unidades,
          inversion,
        })
      }
      return acc
    },
    [] as Array<{ categoria: string; unidades: number; inversion: number }>
  )

  // Inversión por proveedor
  const inversionPorProveedor = ocsCalculadas.reduce(
    (acc, oc) => {
      const existente = acc.find(item => item.proveedor === oc.proveedor)
      if (existente) {
        existente.total += oc.totalInversionRD
        existente.unidades += oc.cantidadOrdenada
      } else {
        acc.push({
          proveedor: oc.proveedor,
          total: oc.totalInversionRD,
          unidades: oc.cantidadOrdenada,
        })
      }
      return acc
    },
    [] as Array<{ proveedor: string; total: number; unidades: number }>
  )

  // Top OCs
  const topOCs = [...ocsCalculadas]
    .sort((a, b) => b.totalInversionRD - a.totalInversionRD)
    .slice(0, 5)
    .map(oc => ({
      oc: oc.oc,
      proveedor: oc.proveedor,
      inversion: oc.totalInversionRD,
      unidades: oc.cantidadRecibida,
      costoUnitario: oc.costoUnitarioFinalRD,
    }))

  // Transacciones recientes
  const pagosRecientes = todosPagos
    .slice(0, 5)
    .sort((a, b) => b.fechaPago.getTime() - a.fechaPago.getTime())
  const gastosRecientes = todosGastos
    .slice(0, 5)
    .sort((a, b) => b.fechaGasto.getTime() - a.fechaGasto.getTime())

  const transacciones = [
    ...pagosRecientes.map(p => ({
      tipo: "Pago" as const,
      id: p.idPago,
      oc: p.ocChina.oc,
      fecha: p.fechaPago,
      monto: parseFloat(p.montoRDNeto?.toString() || "0"),
      descripcion: `${p.tipoPago} - ${p.metodoPago}`,
    })),
    ...gastosRecientes.map(g => {
      const monto = parseFloat(g.montoRD.toString())
      // Si el gasto está asociado con múltiples órdenes, dividir el monto
      const numOrdenes = g.numOrdenes || 1
      const montoPorOrden = monto / numOrdenes

      return {
        tipo: "Gasto" as const,
        id: g.idGasto,
        oc: g.ocChina.oc,
        fecha: g.fechaGasto,
        monto: montoPorOrden,
        descripcion: g.tipoGasto,
      }
    }),
  ]
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, 10)

  return {
    kpis: {
      inversionTotal: Math.round(inversionTotal * 100) / 100,
      unidadesOrdenadas,
      unidadesRecibidas,
      diferenciaUnidades,
      costoPromedioUnitario: Math.round(costoPromedioUnitario * 100) / 100,
      totalComisiones: Math.round(totalComisiones * 100) / 100,
      ocsActivas,
      ocsCompletadas,
    },
    // NUEVO: Metadata para indicar si los datos están limitados
    metadata: {
      datosCompletos: !datosLimitados,
      ocsIncluidas: ocs.length,
      ocsTotal: totalOCs,
      ocsExcluidas: datosLimitados ? totalOCs - MAX_OCS_DASHBOARD : 0,
      advertencia: datosLimitados
        ? `Los datos mostrados representan las ${MAX_OCS_DASHBOARD} OCs más recientes de ${totalOCs} totales. Considere usar filtros de fecha para análisis más específicos.`
        : null,
    },
    financiero: {
      pagosPorMetodo: pagosPorMetodo.map(item => ({
        name: item.metodo,
        value: Math.round(item.total * 100) / 100,
        cantidad: item.cantidad,
      })),
      pagosPorTipo: pagosPorTipo.map(item => ({
        name: item.tipo,
        value: Math.round(item.total * 100) / 100,
        cantidad: item.cantidad,
      })),
      pagosPorMoneda: pagosPorMoneda.map(item => ({
        moneda: item.moneda,
        totalOriginal: Math.round(item.totalOriginal * 100) / 100,
        totalRD: Math.round(item.totalRD * 100) / 100,
        cantidad: item.cantidad,
      })),
      tasasPromedio: tasasPromedio.map(item => ({
        moneda: item.moneda,
        tasa: Math.round(item.tasaPromedio * 100) / 100,
      })),
    },
    gastos: {
      gastosPorTipo: gastosPorTipo.map(item => ({
        name: item.tipo,
        value: Math.round(item.total * 100) / 100,
        cantidad: item.cantidad,
      })),
      gastosPorProveedor: gastosPorProveedor.map(item => ({
        name: item.proveedor,
        value: Math.round(item.total * 100) / 100,
        cantidad: item.cantidad,
      })),
    },
    inventario: {
      inventarioPorBodega: inventarioPorBodega.map(item => ({
        name: item.bodega,
        value: item.unidades,
      })),
      topProductos: topProductos.map(item => ({
        sku: item.sku,
        nombre: item.nombre,
        unidades: item.unidades,
        valorUSD: Math.round(item.valorUSD * 100) / 100,
      })),
      comprasPorCategoria: comprasPorCategoria.map(item => ({
        name: item.categoria,
        unidades: item.unidades,
        inversion: Math.round(item.inversion * 100) / 100,
      })),
    },
    proveedores: {
      inversionPorProveedor: inversionPorProveedor.map(item => ({
        name: item.proveedor,
        inversion: Math.round(item.total * 100) / 100,
        unidades: item.unidades,
      })),
    },
    tablas: {
      topOCs,
      transacciones,
    },
  }
}
