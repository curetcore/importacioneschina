import { Prisma } from "@prisma/client"
import type { JsonValue } from "@prisma/client/runtime/library"
import currency from "currency.js"

// Configuración de currency.js para RD$ (Peso Dominicano)
const RD = (value: number | string | Prisma.Decimal) => {
  const numValue = typeof value === "object" ? value.toString() : value
  return currency(numValue, {
    symbol: "RD$",
    precision: 2,
    separator: ",",
    decimal: ".",
  })
}

const USD = (value: number | string | Prisma.Decimal) => {
  const numValue = typeof value === "object" ? value.toString() : value
  return currency(numValue, {
    symbol: "US$",
    precision: 2,
    separator: ",",
    decimal: ".",
  })
}

/**
 * Convierte Prisma.Decimal a number de forma segura
 */
function toNumber(value: number | Prisma.Decimal): number {
  return typeof value === "number" ? value : parseFloat(value.toString())
}

export interface TallaDistribucion {
  [talla: string]: number
}

export function calcularMontoRD(
  montoOriginal: number | Prisma.Decimal,
  moneda: string,
  tasaCambio: number | Prisma.Decimal = 1
): number {
  const monto = toNumber(montoOriginal)
  const tasa = toNumber(tasaCambio)

  if (moneda === "RD$") {
    return monto
  }

  // Validar tasa de cambio
  if (tasa <= 0) {
    console.error(`❌ Tasa de cambio inválida: ${tasa} para moneda ${moneda}`)
    return 0
  }

  // Usar currency.js para evitar errores de floating point
  return RD(monto).multiply(tasa).value
}

export function calcularMontoRDNeto(
  montoRD: number | Prisma.Decimal,
  comisionBancoRD: number | Prisma.Decimal
): number {
  const monto = toNumber(montoRD)
  const comision = toNumber(comisionBancoRD)

  // SUMA la comisión para obtener el COSTO TOTAL real
  // montoRDNeto = lo que realmente pagaste (monto convertido + comisión bancaria)
  // Ejemplo: $1000 × 58.5 = 58,500 + 500 comisión = 59,000 RD$ (costo total)
  // Usar currency.js para precisión
  return RD(monto).add(comision).value
}

export function calcularTotalInversion(totalPagosRD: number, totalGastosRD: number): number {
  // Validar que los valores no sean negativos
  const pagos = totalPagosRD < 0 ? 0 : totalPagosRD
  const gastos = totalGastosRD < 0 ? 0 : totalGastosRD

  // Usar currency.js para precisión
  return RD(pagos).add(gastos).value
}

export function calcularCostoUnitarioFinal(
  totalInversionRD: number,
  cantidadRecibida: number
): number {
  // Validar que los valores sean positivos
  if (cantidadRecibida <= 0 || totalInversionRD < 0) return 0

  // Usar currency.js para división precisa
  return RD(totalInversionRD).divide(cantidadRecibida).value
}

export function calcularDiferenciaUnidades(
  cantidadOrdenada: number,
  cantidadRecibida: number
): number {
  return cantidadOrdenada - cantidadRecibida
}

export function calcularPorcentajeRecepcion(
  cantidadRecibida: number,
  cantidadOrdenada: number
): number {
  // Validar que cantidadOrdenada sea positiva
  if (cantidadOrdenada <= 0) return 0
  // Validar que cantidadRecibida no sea negativa
  if (cantidadRecibida < 0) return 0
  return Math.round((cantidadRecibida / cantidadOrdenada) * 100 * 100) / 100
}

export function calcularCostoTotalRecepcion(
  cantidadRecibida: number,
  costoUnitarioFinalRD: number
): number {
  // Validar que los valores no sean negativos
  if (cantidadRecibida < 0 || costoUnitarioFinalRD < 0) return 0

  // Usar currency.js para multiplicación precisa
  return RD(costoUnitarioFinalRD).multiply(cantidadRecibida).value
}

export function calcularCostoFOBUnitario(
  costoFOBTotal: number | Prisma.Decimal,
  cantidadOrdenada: number
): number {
  // Validar que cantidadOrdenada sea positiva
  if (cantidadOrdenada <= 0) return 0

  const total = toNumber(costoFOBTotal)

  // Validar que el total no sea negativo
  if (total < 0) return 0

  // Usar currency.js para división precisa
  return USD(total).divide(cantidadOrdenada).value
}

export interface OCCalculada {
  totalPagosRD: number
  totalGastosRD: number
  totalInversionRD: number
  cantidadRecibida: number
  diferenciaUnidades: number
  costoUnitarioFinalRD: number
  costoFOBUnitarioUSD: number
  porcentajeRecepcion: number
}

export function calcularOC(data: {
  costoFOBTotalUSD: number | Prisma.Decimal
  cantidadOrdenada: number
  pagos: Array<{ montoRDNeto: Prisma.Decimal | null }>
  gastos: Array<{ montoRD: Prisma.Decimal }>
  inventario: Array<{ cantidadRecibida: number }>
}): OCCalculada {
  const totalPagosRD = data.pagos.reduce(
    (sum, p) => sum + (p.montoRDNeto ? parseFloat(p.montoRDNeto.toString()) : 0),
    0
  )

  const totalGastosRD = data.gastos.reduce((sum, g) => sum + parseFloat(g.montoRD.toString()), 0)

  const cantidadRecibida = data.inventario.reduce((sum, i) => sum + i.cantidadRecibida, 0)

  const totalInversionRD = calcularTotalInversion(totalPagosRD, totalGastosRD)
  const costoUnitarioFinalRD = calcularCostoUnitarioFinal(totalInversionRD, cantidadRecibida)
  const costoFOBUnitarioUSD = calcularCostoFOBUnitario(data.costoFOBTotalUSD, data.cantidadOrdenada)
  const diferenciaUnidades = calcularDiferenciaUnidades(data.cantidadOrdenada, cantidadRecibida)
  const porcentajeRecepcion = calcularPorcentajeRecepcion(cantidadRecibida, data.cantidadOrdenada)

  return {
    totalPagosRD: RD(totalPagosRD).value,
    totalGastosRD: RD(totalGastosRD).value,
    totalInversionRD: RD(totalInversionRD).value,
    cantidadRecibida,
    diferenciaUnidades,
    costoUnitarioFinalRD,
    costoFOBUnitarioUSD,
    porcentajeRecepcion,
  }
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
  tallaDistribucion?: JsonValue
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

export interface ItemConCostos extends Omit<OCChinaItem, "precioUnitarioUSD" | "subtotalUSD"> {
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
    const tasa =
      typeof p.tasaCambio === "number" ? p.tasaCambio : parseFloat(p.tasaCambio.toString())
    return (p.moneda === "USD" || p.moneda === "CNY") && tasa > 0
  })

  if (pagosConTasa.length === 0) return 0

  // Calcular tasa promedio ponderada por monto
  const totalMonto = pagosConTasa.reduce((sum, p) => {
    const monto =
      typeof p.montoOriginal === "number" ? p.montoOriginal : parseFloat(p.montoOriginal.toString())
    return sum + monto
  }, 0)

  // Protección adicional: si totalMonto es 0, retornar 0
  if (totalMonto === 0) return 0

  const tasaPonderada = pagosConTasa.reduce((sum, p) => {
    const monto =
      typeof p.montoOriginal === "number" ? p.montoOriginal : parseFloat(p.montoOriginal.toString())
    const tasa =
      typeof p.tasaCambio === "number" ? p.tasaCambio : parseFloat(p.tasaCambio.toString())
    const peso = monto / totalMonto
    return sum + tasa * peso
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
    precioUnitarioUSD:
      typeof item.precioUnitarioUSD === "number"
        ? item.precioUnitarioUSD
        : parseFloat(item.precioUnitarioUSD.toString()),
    subtotalUSD:
      typeof item.subtotalUSD === "number"
        ? item.subtotalUSD
        : parseFloat(item.subtotalUSD.toString()),
  }))

  // Calcular totales
  const totalFOBUSD = itemsNormalizados.reduce((sum, item) => sum + item.subtotalUSD, 0)
  const totalGastosRD = gastosLogisticos.reduce((sum, gasto) => {
    const monto =
      typeof gasto.montoRD === "number" ? gasto.montoRD : parseFloat(gasto.montoRD.toString())
    return sum + monto
  }, 0)
  const tasaCambioPromedio = calcularTasaCambioPromedio(pagosChina)

  // VALIDACIÓN CRÍTICA: Si no hay items o totalFOBUSD es <= 0, retornar array vacío
  // Esto previene división por cero en las líneas 246 y 249
  if (itemsNormalizados.length === 0 || totalFOBUSD <= 0) {
    console.warn(
      `⚠️ distribuirGastosLogisticos: totalFOBUSD inválido (${totalFOBUSD}). Retornando array vacío.`
    )
    return []
  }

  // Calcular costos para cada item
  return itemsNormalizados.map(item => {
    // Porcentaje que representa este item del total FOB
    // SEGURO: totalFOBUSD > 0 garantizado por validación arriba
    const porcentajeFOB = (item.subtotalUSD / totalFOBUSD) * 100

    // Gastos logísticos prorrateados para este item
    // SEGURO: totalFOBUSD > 0 garantizado por validación arriba
    const gastosLogisticosRD = (item.subtotalUSD / totalFOBUSD) * totalGastosRD

    // Costo FOB en RD$ (usando tasa de cambio promedio)
    const costoFOBRD = item.subtotalUSD * tasaCambioPromedio

    // Costo total en RD$ (FOB + gastos logísticos)
    const costoTotalRD = costoFOBRD + gastosLogisticosRD

    // Costo unitario en RD$ (con validación de división por cero)
    const costoUnitarioRD = item.cantidadTotal > 0 ? costoTotalRD / item.cantidadTotal : 0

    return {
      ...item,
      porcentajeFOB: currency(porcentajeFOB).value,
      gastosLogisticosRD: RD(gastosLogisticosRD).value,
      costoFOBRD: RD(costoFOBRD).value,
      costoTotalRD: RD(costoTotalRD).value,
      costoUnitarioRD: RD(costoUnitarioRD).value,
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
    subtotalUSD:
      typeof item.subtotalUSD === "number"
        ? item.subtotalUSD
        : parseFloat(item.subtotalUSD.toString()),
  }))

  const totalUnidades = itemsNormalizados.reduce((sum, item) => sum + item.cantidadTotal, 0)
  const totalFOBUSD = itemsNormalizados.reduce((sum, item) => sum + item.subtotalUSD, 0)

  const totalPagadoRD = pagosChina.reduce((sum, pago) => {
    if (!pago.montoRDNeto) return sum
    const monto =
      typeof pago.montoRDNeto === "number"
        ? pago.montoRDNeto
        : parseFloat(pago.montoRDNeto.toString())
    return sum + monto
  }, 0)

  const totalGastosRD = gastosLogisticos.reduce((sum, gasto) => {
    const monto =
      typeof gasto.montoRD === "number" ? gasto.montoRD : parseFloat(gasto.montoRD.toString())
    return sum + monto
  }, 0)

  const totalCostoRD = totalPagadoRD + totalGastosRD
  const tasaCambioPromedio = calcularTasaCambioPromedio(pagosChina)

  return {
    totalUnidades,
    totalFOBUSD: USD(totalFOBUSD).value,
    totalPagadoRD: RD(totalPagadoRD).value,
    totalGastosRD: RD(totalGastosRD).value,
    totalCostoRD: RD(totalCostoRD).value,
    tasaCambioPromedio: currency(tasaCambioPromedio).value,
    costoUnitarioPromedioRD: totalUnidades > 0 ? RD(totalCostoRD).divide(totalUnidades).value : 0,
  }
}
