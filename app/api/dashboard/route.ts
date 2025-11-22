import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { getPrismaClient } from "@/lib/db-helpers"
import { calcularOC, distributeExpenseAcrossOCs } from "@/lib/calculations"
import { handleApiError } from "@/lib/api-error-handler"
import { QueryCache } from "@/lib/cache-helpers"
import { CacheKeys, CacheTTL } from "@/lib/redis"
import { getDistributionMethodForExpense } from "@/lib/distribution-config-helper"

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

  // PASO 1: Construir mapa de gastos únicos y calcular distribución proporcional
  // Esto debe hacerse ANTES de calcular OCs para evitar doble conteo
  const gastosUnicos = new Map<string, any>()

  ocs.forEach(oc => {
    oc.gastosLogisticos
      .filter(gl => gl.gasto.deletedAt === null)
      .forEach(gl => {
        const gastoId = gl.gasto.id
        if (!gastosUnicos.has(gastoId)) {
          gastosUnicos.set(gastoId, {
            ...gl.gasto,
            ocChina: { oc: oc.oc },
            ocIds: [oc.id],
            numOrdenes: 1,
          })
        } else {
          const existing = gastosUnicos.get(gastoId)
          existing.ocIds.push(oc.id)
          existing.numOrdenes += 1
        }
      })
  })

  const todosGastos = Array.from(gastosUnicos.values())

  // Calcular distribución proporcional de gastos entre OCs
  const gastosDistribuidos = new Map<string, Map<string, number>>()

  for (const gasto of todosGastos) {
    if (gasto.ocIds.length === 1) {
      const distribucion = new Map<string, number>()
      distribucion.set(gasto.ocIds[0], parseFloat(gasto.montoRD.toString()))
      gastosDistribuidos.set(gasto.id, distribucion)
    } else {
      const ocsAsociadas = ocs.filter(oc => gasto.ocIds.includes(oc.id))

      // NUEVO: Usa configuración de BD con fallbacks automáticos
      // Si USE_CONFIG_DISTRIBUTION=false o hay error, usa comportamiento hardcodeado original
      const method = await getDistributionMethodForExpense(gasto.tipoGasto || "Otros")

      const distribucion = distributeExpenseAcrossOCs(gasto, ocsAsociadas, method)
      gastosDistribuidos.set(gasto.id, distribucion)
    }
  }

  // PASO 2: Calcular OCs usando montos distribuidos
  const ocsCalculadas = ocs.map(oc => {
    // Calcular valores desde items
    const cantidadOrdenada = oc.items?.reduce((sum, item) => sum + item.cantidadTotal, 0) || 0
    const costoFOBTotalUSD =
      oc.items?.reduce((sum, item) => sum + parseFloat(item.subtotalUSD.toString()), 0) || 0

    // Transform gastosLogisticos from junction table to flat gasto objects
    // Usar montos DISTRIBUIDOS para evitar doble conteo
    const gastosTransformed =
      oc.gastosLogisticos
        ?.map(gl => gl.gasto)
        .filter(g => g.deletedAt === null)
        .map(gasto => {
          // Obtener el monto distribuido para esta OC específica
          const distribucion = gastosDistribuidos.get(gasto.id)
          const montoDistribuido = distribucion?.get(oc.id) || 0

          // Retornar gasto con monto distribuido (convertido a Prisma.Decimal)
          return {
            ...gasto,
            montoRD: new Prisma.Decimal(montoDistribuido), // Usar monto distribuido en lugar del monto completo
          }
        }) || []

    const calculos = calcularOC({
      costoFOBTotalUSD,
      cantidadOrdenada,
      pagos: oc.pagosChina,
      gastos: gastosTransformed,
      inventario: oc.inventarioRecibido,
    })

    // Calcular tasa de cambio promedio para convertir FOB a RD$
    const tasaCambioPromedio =
      oc.pagosChina.length > 0
        ? oc.pagosChina.reduce((sum, pago) => sum + parseFloat(pago.tasaCambio.toString()), 0) /
          oc.pagosChina.length
        : 58 // Tasa default si no hay pagos

    const costoFOBTotalRD = costoFOBTotalUSD * tasaCambioPromedio

    return {
      id: oc.id,
      oc: oc.oc,
      proveedor: oc.proveedor,
      fechaOC: oc.fechaOC,
      categoriaPrincipal: oc.categoriaPrincipal,
      cantidadOrdenada,
      costoFOBTotalRD, // Agregar FOB en RD$
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

  // Total de comisiones bancarias
  const totalComisiones = todosPagos.reduce(
    (sum, pago) =>
      sum + parseFloat(pago.comisionBancoUSD.toString()) * parseFloat(pago.tasaCambio.toString()),
    0
  )

  // Pagos por método
  const pagosPorMetodo = todosPagos.reduce(
    (acc, pago) => {
      const existente = acc.find(
        (item: { metodo: string; total: number; cantidad: number }) =>
          item.metodo === pago.metodoPago
      )
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
      const existente = acc.find(
        (item: { tipo: string; total: number; cantidad: number }) => item.tipo === pago.tipoPago
      )
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
      const existente = acc.find(
        (item: { moneda: string; totalOriginal: number; totalRD: number; cantidad: number }) =>
          item.moneda === pago.moneda
      )
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
        const existente = acc.find(
          (item: { moneda: string; sumaTasas: number; cantidad: number }) =>
            item.moneda === pago.moneda
        )
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
      const existente = acc.find(
        (item: { tipo: string; total: number; cantidad: number }) => item.tipo === gasto.tipoGasto
      )
      const monto = parseFloat(gasto.montoRD.toString())

      // Para agregaciones globales, usamos el monto completo (representa cash outflow real)
      // La distribución proporcional solo aplica al calcular costos por OC individual

      if (existente) {
        existente.total += monto
        existente.cantidad += 1
      } else {
        acc.push({
          tipo: gasto.tipoGasto,
          total: monto,
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
        const existente = acc.find(
          (item: { proveedor: string; total: number; cantidad: number }) =>
            item.proveedor === proveedor
        )
        const monto = parseFloat(gasto.montoRD.toString())

        // Para agregaciones globales, usamos el monto completo

        if (existente) {
          existente.total += monto
          existente.cantidad += 1
        } else {
          acc.push({
            proveedor,
            total: monto,
            cantidad: 1,
          })
        }
        return acc
      },
      [] as Array<{ proveedor: string; total: number; cantidad: number }>
    )
    .sort(
      (
        a: { proveedor: string; total: number; cantidad: number },
        b: { proveedor: string; total: number; cantidad: number }
      ) => b.total - a.total
    )
    .slice(0, 5)

  // Inventario por bodega
  const inventarioPorBodega = ocsCalculadas.reduce(
    (acc, oc) => {
      oc.inventarioRecibido.forEach(inv => {
        const existente = acc.find(
          (item: { bodega: string; unidades: number }) => item.bodega === inv.bodegaInicial
        )
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
        const existente = acc.find(
          (p: { sku: string; nombre: string; unidades: number; valorUSD: number }) =>
            p.sku === item.sku
        )
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
      const existente = acc.find(
        (item: { categoria: string; unidades: number; inversion: number }) =>
          item.categoria === oc.categoriaPrincipal
      )
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
      const existente = acc.find(
        (item: { proveedor: string; total: number; unidades: number }) =>
          item.proveedor === oc.proveedor
      )
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
      // Para transacciones recientes, mostramos el monto completo (cash outflow real)

      return {
        tipo: "Gasto" as const,
        id: g.idGasto,
        oc: g.ocChina.oc,
        fecha: g.fechaGasto,
        monto: monto,
        descripcion: g.tipoGasto,
      }
    }),
  ]
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, 10)

  // Nuevas métricas financieras
  const totalPagado = todosPagos.reduce(
    (sum, pago) => sum + parseFloat(pago.montoRDNeto?.toString() || "0"),
    0
  )

  const totalFOB = ocsCalculadas.reduce((sum, oc) => sum + Number(oc.costoFOBTotalRD || 0), 0)

  const totalGastosLogisticos = todosGastos.reduce((sum, gasto) => {
    const monto = parseFloat(gasto.montoRD.toString())
    // Para total global, usamos el monto completo (cash outflow real)
    return sum + monto
  }, 0)

  const balancePendiente = totalFOB - totalPagado
  const porcentajePagado = totalFOB > 0 ? (totalPagado / totalFOB) * 100 : 0
  const gastosComoPercent = inversionTotal > 0 ? (totalGastosLogisticos / inversionTotal) * 100 : 0
  const comisionesComoPercent = totalPagado > 0 ? (totalComisiones / totalPagado) * 100 : 0

  // Costo real por unidad (incluye FOB + Logística + Comisiones)
  const costoRealUnitario =
    unidadesRecibidas > 0
      ? (totalFOB + totalGastosLogisticos + totalComisiones) / unidadesRecibidas
      : 0

  // Nuevas métricas de inventario
  const unidadesPendientes = unidadesOrdenadas - unidadesRecibidas
  const porcentajeRecepcion =
    unidadesOrdenadas > 0 ? (unidadesRecibidas / unidadesOrdenadas) * 100 : 0

  // Valor total del inventario en bodega
  const valorInventarioBodega = ocsCalculadas.reduce((sum, oc) => {
    return (
      sum +
      oc.inventarioRecibido.reduce((invSum, inv) => {
        const costo = inv.costoUnitarioFinalRD ? parseFloat(inv.costoUnitarioFinalRD.toString()) : 0
        return invSum + costo * inv.cantidadRecibida
      }, 0)
    )
  }, 0)

  // Top productos por VALOR (no solo unidades)
  const topProductosPorValor = [...productosPorSKU]
    .sort((a, b) => b.valorUSD - a.valorUSD)
    .slice(0, 10)

  // Alertas: OCs con balance pendiente > 50%
  const ocsConBalancePendiente = ocsCalculadas
    .map(oc => {
      const fobTotalRD = Number(oc.costoFOBTotalRD || 0)
      const pagado = oc.totalPagosRD || 0
      const balance = fobTotalRD - pagado
      const porcentajeBalance = fobTotalRD > 0 ? (balance / fobTotalRD) * 100 : 0

      return {
        oc: oc.oc,
        proveedor: oc.proveedor,
        fobTotal: fobTotalRD,
        pagado,
        balance,
        porcentajeBalance,
      }
    })
    .filter(oc => oc.porcentajeBalance > 50)
    .sort((a, b) => b.balance - a.balance)

  // Alertas: OCs con 0% de recepción
  const ocsSinRecepcion = ocsCalculadas
    .filter(oc => oc.cantidadRecibida === 0 && oc.cantidadOrdenada > 0)
    .map(oc => ({
      oc: oc.oc,
      proveedor: oc.proveedor,
      unidadesOrdenadas: oc.cantidadOrdenada,
      fechaOC: oc.fechaOC,
    }))

  // Distribución de costos (FOB vs Logística vs Comisiones)
  const distribucionCostos = [
    {
      name: "FOB",
      value: Math.round(totalFOB * 100) / 100,
      porcentaje: inversionTotal > 0 ? (totalFOB / inversionTotal) * 100 : 0,
    },
    {
      name: "Gastos Logísticos",
      value: Math.round(totalGastosLogisticos * 100) / 100,
      porcentaje: inversionTotal > 0 ? (totalGastosLogisticos / inversionTotal) * 100 : 0,
    },
    {
      name: "Comisiones",
      value: Math.round(totalComisiones * 100) / 100,
      porcentaje: inversionTotal > 0 ? (totalComisiones / inversionTotal) * 100 : 0,
    },
  ]

  // Balance pendiente por OC (para gráfico)
  const balancePorOC = ocsCalculadas
    .map(oc => ({
      name: oc.oc,
      balance: Number(oc.costoFOBTotalRD || 0) - (oc.totalPagosRD || 0),
      pagado: oc.totalPagosRD || 0,
      total: Number(oc.costoFOBTotalRD || 0),
    }))
    .filter(oc => oc.balance > 0)
    .sort((a, b) => b.balance - a.balance)
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
      // Nuevas métricas
      totalFOB: Math.round(totalFOB * 100) / 100,
      totalPagado: Math.round(totalPagado * 100) / 100,
      totalGastosLogisticos: Math.round(totalGastosLogisticos * 100) / 100,
      balancePendiente: Math.round(balancePendiente * 100) / 100,
      porcentajePagado: Math.round(porcentajePagado * 100) / 100,
      gastosComoPercent: Math.round(gastosComoPercent * 100) / 100,
      comisionesComoPercent: Math.round(comisionesComoPercent * 100) / 100,
      costoRealUnitario: Math.round(costoRealUnitario * 100) / 100,
      unidadesPendientes,
      porcentajeRecepcion: Math.round(porcentajeRecepcion * 100) / 100,
      valorInventarioBodega: Math.round(valorInventarioBodega * 100) / 100,
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
      pagosPorMetodo: pagosPorMetodo.map(
        (item: { metodo: string; total: number; cantidad: number }) => ({
          name: item.metodo,
          value: Math.round(item.total * 100) / 100,
          cantidad: item.cantidad,
        })
      ),
      pagosPorTipo: pagosPorTipo.map((item: { tipo: string; total: number; cantidad: number }) => ({
        name: item.tipo,
        value: Math.round(item.total * 100) / 100,
        cantidad: item.cantidad,
      })),
      pagosPorMoneda: pagosPorMoneda.map(
        (item: { moneda: string; totalOriginal: number; totalRD: number; cantidad: number }) => ({
          moneda: item.moneda,
          totalOriginal: Math.round(item.totalOriginal * 100) / 100,
          totalRD: Math.round(item.totalRD * 100) / 100,
          cantidad: item.cantidad,
        })
      ),
      tasasPromedio: tasasPromedio.map((item: { moneda: string; tasaPromedio: number }) => ({
        moneda: item.moneda,
        tasa: Math.round(item.tasaPromedio * 100) / 100,
      })),
    },
    gastos: {
      gastosPorTipo: gastosPorTipo.map(
        (item: { tipo: string; total: number; cantidad: number }) => ({
          name: item.tipo,
          value: Math.round(item.total * 100) / 100,
          cantidad: item.cantidad,
        })
      ),
      gastosPorProveedor: gastosPorProveedor.map(
        (item: { proveedor: string; total: number; cantidad: number }) => ({
          name: item.proveedor,
          value: Math.round(item.total * 100) / 100,
          cantidad: item.cantidad,
        })
      ),
    },
    inventario: {
      inventarioPorBodega: inventarioPorBodega.map(
        (item: { bodega: string; unidades: number }) => ({
          name: item.bodega,
          value: item.unidades,
        })
      ),
      topProductos: topProductos.map(
        (item: { sku: string; nombre: string; unidades: number; valorUSD: number }) => ({
          sku: item.sku,
          nombre: item.nombre,
          unidades: item.unidades,
          valorUSD: Math.round(item.valorUSD * 100) / 100,
        })
      ),
      comprasPorCategoria: comprasPorCategoria.map(
        (item: { categoria: string; unidades: number; inversion: number }) => ({
          name: item.categoria,
          unidades: item.unidades,
          inversion: Math.round(item.inversion * 100) / 100,
        })
      ),
    },
    proveedores: {
      inversionPorProveedor: inversionPorProveedor.map(
        (item: { proveedor: string; total: number; unidades: number }) => ({
          name: item.proveedor,
          inversion: Math.round(item.total * 100) / 100,
          unidades: item.unidades,
        })
      ),
    },
    tablas: {
      topOCs,
      transacciones,
    },
    // Nuevas secciones
    distribucion: {
      distribucionCostos,
      balancePorOC,
    },
    alertas: {
      ocsConBalancePendiente,
      ocsSinRecepcion,
    },
    topProductosPorValor: topProductosPorValor.map(
      (item: { sku: string; nombre: string; unidades: number; valorUSD: number }) => ({
        sku: item.sku,
        nombre: item.nombre,
        unidades: item.unidades,
        valorUSD: Math.round(item.valorUSD * 100) / 100,
      })
    ),
  }
}
