import { Prisma } from "@prisma/client";

export function calcularMontoRD(
  montoOriginal: number | Prisma.Decimal,
  moneda: string,
  tasaCambio: number | Prisma.Decimal = 1
): number {
  const monto = typeof montoOriginal === "number" ? montoOriginal : parseFloat(montoOriginal.toString());
  const tasa = typeof tasaCambio === "number" ? tasaCambio : parseFloat(tasaCambio.toString());

  if (moneda === "RD$") {
    return monto;
  }

  return monto * tasa;
}

export function calcularMontoRDNeto(
  montoRD: number | Prisma.Decimal,
  comisionBancoRD: number | Prisma.Decimal
): number {
  const monto = typeof montoRD === "number" ? montoRD : parseFloat(montoRD.toString());
  const comision = typeof comisionBancoRD === "number" ? comisionBancoRD : parseFloat(comisionBancoRD.toString());

  return monto + comision;
}

export function calcularTotalInversion(
  totalPagosRD: number,
  totalGastosRD: number
): number {
  return totalPagosRD + totalGastosRD;
}

export function calcularCostoUnitarioFinal(
  totalInversionRD: number,
  cantidadRecibida: number
): number {
  if (cantidadRecibida === 0) return 0;
  return Math.round((totalInversionRD / cantidadRecibida) * 100) / 100;
}

export function calcularDiferenciaUnidades(
  cantidadOrdenada: number,
  cantidadRecibida: number
): number {
  return cantidadOrdenada - cantidadRecibida;
}

export function calcularPorcentajeRecepcion(
  cantidadRecibida: number,
  cantidadOrdenada: number
): number {
  if (cantidadOrdenada === 0) return 0;
  return Math.round((cantidadRecibida / cantidadOrdenada) * 100 * 100) / 100;
}

export function calcularCostoTotalRecepcion(
  cantidadRecibida: number,
  costoUnitarioFinalRD: number
): number {
  return Math.round(cantidadRecibida * costoUnitarioFinalRD * 100) / 100;
}

export function calcularCostoFOBUnitario(
  costoFOBTotal: number | Prisma.Decimal,
  cantidadOrdenada: number
): number {
  if (cantidadOrdenada === 0) return 0;
  const total = typeof costoFOBTotal === "number" ? costoFOBTotal : parseFloat(costoFOBTotal.toString());
  return Math.round((total / cantidadOrdenada) * 100) / 100;
}

export interface OCCalculada {
  totalPagosRD: number;
  totalGastosRD: number;
  totalInversionRD: number;
  cantidadRecibida: number;
  diferenciaUnidades: number;
  costoUnitarioFinalRD: number;
  costoFOBUnitarioUSD: number;
  porcentajeRecepcion: number;
}

export function calcularOC(data: {
  costoFOBTotalUSD: number | Prisma.Decimal;
  cantidadOrdenada: number;
  pagos: Array<{ montoRDNeto: Prisma.Decimal | null }>;
  gastos: Array<{ montoRD: Prisma.Decimal }>;
  inventario: Array<{ cantidadRecibida: number }>;
}): OCCalculada {
  const totalPagosRD = data.pagos.reduce(
    (sum, p) => sum + (p.montoRDNeto ? parseFloat(p.montoRDNeto.toString()) : 0),
    0
  );

  const totalGastosRD = data.gastos.reduce(
    (sum, g) => sum + parseFloat(g.montoRD.toString()),
    0
  );

  const cantidadRecibida = data.inventario.reduce(
    (sum, i) => sum + i.cantidadRecibida,
    0
  );

  const totalInversionRD = calcularTotalInversion(totalPagosRD, totalGastosRD);
  const costoUnitarioFinalRD = calcularCostoUnitarioFinal(totalInversionRD, cantidadRecibida);
  const costoFOBUnitarioUSD = calcularCostoFOBUnitario(data.costoFOBTotalUSD, data.cantidadOrdenada);
  const diferenciaUnidades = calcularDiferenciaUnidades(data.cantidadOrdenada, cantidadRecibida);
  const porcentajeRecepcion = calcularPorcentajeRecepcion(cantidadRecibida, data.cantidadOrdenada);

  return {
    totalPagosRD: Math.round(totalPagosRD * 100) / 100,
    totalGastosRD: Math.round(totalGastosRD * 100) / 100,
    totalInversionRD: Math.round(totalInversionRD * 100) / 100,
    cantidadRecibida,
    diferenciaUnidades,
    costoUnitarioFinalRD,
    costoFOBUnitarioUSD,
    porcentajeRecepcion,
  };
}

// =====================================================
// CÁLCULOS POR PRODUCTO (Multi-Item)
// =====================================================

interface OCChinaItem {
  id: string
  sku: string
  nombre: string
  material?: string | null
  color?: string | null
  especificaciones?: string | null
  tallaDistribucion?: any
  cantidadTotal: number
  precioUnitarioUSD: number | Prisma.Decimal
  subtotalUSD: number | Prisma.Decimal
}

interface GastoLogistico {
  montoRD: number | Prisma.Decimal
}

interface PagoChina {
  montoRDNeto: number | Prisma.Decimal | null
  montoOriginal: number | Prisma.Decimal
  moneda: string
  tasaCambio: number | Prisma.Decimal
}

export interface ItemConCostos extends Omit<OCChinaItem, 'precioUnitarioUSD' | 'subtotalUSD'> {
  precioUnitarioUSD: number
  subtotalUSD: number

  // Cálculos derivados
  porcentajeFOB: number // % del total FOB que representa este item

  // Gastos distribuidos
  gastosLogisticosRD: number // Porción de gastos logísticos para este item

  // Costos finales
  costoFOBRD: number // Costo FOB en RD$ (usando tasa de cambio promedio)
  costoTotalRD: number // FOB + gastos logísticos
  costoUnitarioRD: number // Costo total / cantidad
}

/**
 * Calcula la tasa de cambio promedio ponderada de los pagos
 */
export function calcularTasaCambioPromedio(pagos: PagoChina[]): number {
  if (pagos.length === 0) return 0

  // Filtrar solo pagos en USD/CNY que tienen tasa de cambio
  const pagosConTasa = pagos.filter(p => {
    const tasa = typeof p.tasaCambio === 'number' ? p.tasaCambio : parseFloat(p.tasaCambio.toString())
    return (p.moneda === 'USD' || p.moneda === 'CNY') && tasa > 0
  })

  if (pagosConTasa.length === 0) return 0

  // Calcular tasa promedio ponderada por monto
  const totalMonto = pagosConTasa.reduce((sum, p) => {
    const monto = typeof p.montoOriginal === 'number' ? p.montoOriginal : parseFloat(p.montoOriginal.toString())
    return sum + monto
  }, 0)

  const tasaPonderada = pagosConTasa.reduce((sum, p) => {
    const monto = typeof p.montoOriginal === 'number' ? p.montoOriginal : parseFloat(p.montoOriginal.toString())
    const tasa = typeof p.tasaCambio === 'number' ? p.tasaCambio : parseFloat(p.tasaCambio.toString())
    const peso = monto / totalMonto
    return sum + (tasa * peso)
  }, 0)

  return tasaPonderada
}

/**
 * Distribuye los gastos logísticos proporcionalmente entre los items según su costo FOB
 */
export function distribuirGastosLogisticos(
  items: OCChinaItem[],
  gastosLogisticos: GastoLogistico[],
  pagosChina: PagoChina[]
): ItemConCostos[] {
  // Normalizar items a números
  const itemsNormalizados = items.map(item => ({
    ...item,
    precioUnitarioUSD: typeof item.precioUnitarioUSD === 'number'
      ? item.precioUnitarioUSD
      : parseFloat(item.precioUnitarioUSD.toString()),
    subtotalUSD: typeof item.subtotalUSD === 'number'
      ? item.subtotalUSD
      : parseFloat(item.subtotalUSD.toString()),
  }))

  // Calcular totales
  const totalFOBUSD = itemsNormalizados.reduce((sum, item) => sum + item.subtotalUSD, 0)
  const totalGastosRD = gastosLogisticos.reduce((sum, gasto) => {
    const monto = typeof gasto.montoRD === 'number' ? gasto.montoRD : parseFloat(gasto.montoRD.toString())
    return sum + monto
  }, 0)
  const tasaCambioPromedio = calcularTasaCambioPromedio(pagosChina)

  // Si no hay items, retornar array vacío
  if (itemsNormalizados.length === 0 || totalFOBUSD === 0) {
    return []
  }

  // Calcular costos para cada item
  return itemsNormalizados.map(item => {
    // Porcentaje que representa este item del total FOB
    const porcentajeFOB = (item.subtotalUSD / totalFOBUSD) * 100

    // Gastos logísticos prorrateados para este item
    const gastosLogisticosRD = (item.subtotalUSD / totalFOBUSD) * totalGastosRD

    // Costo FOB en RD$ (usando tasa de cambio promedio)
    const costoFOBRD = item.subtotalUSD * tasaCambioPromedio

    // Costo total en RD$ (FOB + gastos logísticos)
    const costoTotalRD = costoFOBRD + gastosLogisticosRD

    // Costo unitario en RD$
    const costoUnitarioRD = item.cantidadTotal > 0
      ? costoTotalRD / item.cantidadTotal
      : 0

    return {
      ...item,
      porcentajeFOB: Math.round(porcentajeFOB * 100) / 100,
      gastosLogisticosRD: Math.round(gastosLogisticosRD * 100) / 100,
      costoFOBRD: Math.round(costoFOBRD * 100) / 100,
      costoTotalRD: Math.round(costoTotalRD * 100) / 100,
      costoUnitarioRD: Math.round(costoUnitarioRD * 100) / 100,
    }
  })
}

/**
 * Calcula el resumen financiero de una orden con múltiples items
 */
export function calcularResumenFinanciero(
  items: OCChinaItem[],
  pagosChina: PagoChina[],
  gastosLogisticos: GastoLogistico[]
) {
  const itemsNormalizados = items.map(item => ({
    cantidadTotal: item.cantidadTotal,
    subtotalUSD: typeof item.subtotalUSD === 'number'
      ? item.subtotalUSD
      : parseFloat(item.subtotalUSD.toString()),
  }))

  const totalUnidades = itemsNormalizados.reduce((sum, item) => sum + item.cantidadTotal, 0)
  const totalFOBUSD = itemsNormalizados.reduce((sum, item) => sum + item.subtotalUSD, 0)

  const totalPagadoRD = pagosChina.reduce((sum, pago) => {
    if (!pago.montoRDNeto) return sum
    const monto = typeof pago.montoRDNeto === 'number'
      ? pago.montoRDNeto
      : parseFloat(pago.montoRDNeto.toString())
    return sum + monto
  }, 0)

  const totalGastosRD = gastosLogisticos.reduce((sum, gasto) => {
    const monto = typeof gasto.montoRD === 'number'
      ? gasto.montoRD
      : parseFloat(gasto.montoRD.toString())
    return sum + monto
  }, 0)

  const totalCostoRD = totalPagadoRD + totalGastosRD
  const tasaCambioPromedio = calcularTasaCambioPromedio(pagosChina)

  return {
    totalUnidades,
    totalFOBUSD: Math.round(totalFOBUSD * 100) / 100,
    totalPagadoRD: Math.round(totalPagadoRD * 100) / 100,
    totalGastosRD: Math.round(totalGastosRD * 100) / 100,
    totalCostoRD: Math.round(totalCostoRD * 100) / 100,
    tasaCambioPromedio: Math.round(tasaCambioPromedio * 100) / 100,
    costoUnitarioPromedioRD: totalUnidades > 0
      ? Math.round((totalCostoRD / totalUnidades) * 100) / 100
      : 0,
  }
}
