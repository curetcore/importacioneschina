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
  pesoUnitarioKg?: number | Prisma.Decimal | null
  volumenUnitarioCBM?: number | Prisma.Decimal | null
}

interface GastoLogistico {
  montoRD: number | Prisma.Decimal
  montoDistribuidoRD?: number // Distributed amount for this specific OC (pre-calculated by API)
  ordenesCompra?: Array<{
    ocChina: {
      id: string
    }
  }>
}

interface PagoChina {
  montoRDNeto: number | Prisma.Decimal | null
  montoOriginal: number | Prisma.Decimal
  moneda: string
  tasaCambio: number | Prisma.Decimal
  comisionBancoUSD: number | Prisma.Decimal
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
 *
 * DOCUMENTACIÓN DE LÓGICA DE TASA DE CAMBIO:
 *
 * ¿Por qué promedio ponderado?
 * --------------------------------
 * Si una OC tiene múltiples pagos a diferentes tasas, necesitamos una tasa
 * representativa que refleje el costo real. El promedio simple sería incorrecto.
 *
 * Ejemplo:
 * - Pago 1: $100 a tasa 58 = RD$5,800
 * - Pago 2: $900 a tasa 60 = RD$54,000
 * - Total: $1,000 = RD$59,800
 *
 * Promedio simple: (58 + 60) / 2 = 59 (INCORRECTO)
 * Promedio ponderado: (100×58 + 900×60) / 1000 = 59.8 (CORRECTO)
 *
 * Fórmula:
 * --------
 * tasaPromedio = Σ(tasa × monto) / Σ(monto)
 *
 * Casos especiales:
 * -----------------
 * 1. Sin pagos: retorna 0
 * 2. Pagos solo en RD$: retorna 0 (no necesitan conversión)
 * 3. Montos totales = 0: retorna 0 (previene división por cero)
 *
 * Uso del default (58):
 * ---------------------
 * Si esta función retorna 0, los llamadores usan 58 como fallback.
 * Esto permite calcular costos FOB incluso sin pagos registrados.
 * Ver: analisis-costos/route.ts línea 87, calcularCostosCompletos línea 455
 *
 * @param pagos - Array de pagos de una OC
 * @returns Tasa de cambio promedio ponderada (0 si no hay datos)
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
    // Use pre-calculated distributed amount if available (from API)
    if (gasto.montoDistribuidoRD !== undefined) {
      return sum + gasto.montoDistribuidoRD
    }

    // Fallback: equal distribution (for backward compatibility)
    const monto =
      typeof gasto.montoRD === "number" ? gasto.montoRD : parseFloat(gasto.montoRD.toString())
    const numOrdenes = gasto.ordenesCompra?.length || 1
    const montoPorOrden = monto / numOrdenes

    return sum + montoPorOrden
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
    // Use pre-calculated distributed amount if available (from API)
    if (gasto.montoDistribuidoRD !== undefined) {
      return sum + gasto.montoDistribuidoRD
    }

    // Fallback: equal distribution (for backward compatibility)
    const monto =
      typeof gasto.montoRD === "number" ? gasto.montoRD : parseFloat(gasto.montoRD.toString())
    const numOrdenes = gasto.ordenesCompra?.length || 1
    const montoPorOrden = monto / numOrdenes

    return sum + montoPorOrden
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

// =====================================================
// CÁLCULO DE COSTOS COMPLETO CON SISTEMA PROFESIONAL
// =====================================================
// IMPORTANTE: Esta función usa el sistema profesional de distribución de costos
// que incluye FOB + pagos + gastos + comisiones de forma completa y correcta.

/**
 * Calcula costos completos por producto usando el sistema profesional de distribución
 *
 * Este método es el CORRECTO para calcular costos finales, ya que incluye:
 * - Costo FOB (precio base del producto)
 * - Pagos distribuidos (anticipo, pago final, etc.)
 * - Gastos logísticos distribuidos (flete, aduana, broker, etc.)
 * - Comisiones bancarias distribuidas
 *
 * DIFERENCIA con distribuirGastosLogisticos():
 * - distribuirGastosLogisticos() solo calcula FOB + gastos (INCOMPLETO)
 * - Esta función calcula TODO (COMPLETO)
 *
 * @param items - Productos de la OC con sus datos (SKU, cantidad, precio FOB, peso, volumen)
 * @param pagos - Todos los pagos realizados para esta OC
 * @param gastos - Todos los gastos logísticos de esta OC
 * @param metodosDistribucion - Métodos de distribución configurados (opcional)
 * @returns Información detallada de costos por producto
 */
export interface CostoCompletoItem {
  id: string
  sku: string
  nombre: string
  cantidadTotal: number

  // Costos base
  precioUnitarioUSD: number
  subtotalUSD: number

  // Desglose de costos en RD$
  costoFOBRD: number // Precio FOB convertido a RD$
  pagosDistribuidosRD: number // Porción de pagos asignada a este producto
  gastosDistribuidosRD: number // Porción de gastos asignada a este producto
  comisionesDistribuidasRD: number // Porción de comisiones asignada a este producto

  // Costo total y unitario
  costoTotalRD: number // Suma de todos los costos
  costoUnitarioRD: number // Costo total / cantidad

  // Metadatos
  tasaCambio: number // Tasa de cambio usada
  metodosUsados: {
    // Métodos de distribución aplicados
    pagos: string
    gastos: string
    comisiones: string
  }
}

export function calcularCostosCompletos(
  items: OCChinaItem[],
  pagosChina: PagoChina[],
  gastosLogisticos: GastoLogistico[],
  metodosDistribucion?: {
    pagos?: string
    gastos?: string
    comisiones?: string
  }
): CostoCompletoItem[] {
  // IMPORTANTE: Importar dinámicamente para evitar dependencias circulares
  const { distributeCost } = require("@/lib/cost-distribution")

  // Validación: si no hay items, retornar array vacío
  if (!items || items.length === 0) {
    console.warn("⚠️ calcularCostosCompletos: No hay items para calcular")
    return []
  }

  // 1. Calcular tasa de cambio promedio ponderada
  const tasaPromedio = calcularTasaCambioPromedio(pagosChina) || 58

  // 2. Preparar datos para distribución
  const itemsNormalizados = items.map(item => ({
    id: item.id,
    sku: item.sku,
    nombre: item.nombre,
    cantidadTotal: item.cantidadTotal,
    precioUnitarioUSD:
      typeof item.precioUnitarioUSD === "number"
        ? item.precioUnitarioUSD
        : parseFloat(item.precioUnitarioUSD.toString()),
    subtotalUSD:
      typeof item.subtotalUSD === "number"
        ? item.subtotalUSD
        : parseFloat(item.subtotalUSD.toString()),
  }))

  // 3. Preparar datos para sistema de distribución profesional
  const productosParaDistribucion = items.map(item => ({
    id: item.id,
    cantidad: item.cantidadTotal,
    pesoUnitarioKg: item.pesoUnitarioKg ? parseFloat(item.pesoUnitarioKg.toString()) : null,
    volumenUnitarioCBM: item.volumenUnitarioCBM
      ? parseFloat(item.volumenUnitarioCBM.toString())
      : null,
    precioUnitarioUSD:
      typeof item.precioUnitarioUSD === "number"
        ? item.precioUnitarioUSD
        : parseFloat(item.precioUnitarioUSD.toString()),
  }))

  // 4. Calcular totales de pagos, gastos y comisiones
  const totalPagosRD = pagosChina.reduce((sum, pago) => {
    if (!pago.montoRDNeto) return sum
    const monto =
      typeof pago.montoRDNeto === "number"
        ? pago.montoRDNeto
        : parseFloat(pago.montoRDNeto.toString())
    return sum + monto
  }, 0)

  const totalGastosRD = gastosLogisticos.reduce((sum, gasto) => {
    // Use pre-calculated distributed amount if available (from API)
    if (gasto.montoDistribuidoRD !== undefined) {
      return sum + gasto.montoDistribuidoRD
    }

    // Fallback: equal distribution (for backward compatibility)
    const monto =
      typeof gasto.montoRD === "number" ? gasto.montoRD : parseFloat(gasto.montoRD.toString())
    const numOrdenes = gasto.ordenesCompra?.length || 1
    const montoPorOrden = monto / numOrdenes

    return sum + montoPorOrden
  }, 0)

  const totalComisionesRD = pagosChina.reduce((sum, pago) => {
    const comision =
      typeof pago.comisionBancoUSD === "number"
        ? pago.comisionBancoUSD
        : parseFloat(pago.comisionBancoUSD.toString())
    return sum + comision
  }, 0)

  // 5. Distribuir costos usando el sistema profesional
  const metodoPagos = metodosDistribucion?.pagos || "valor_fob"
  const metodoGastos = metodosDistribucion?.gastos || "peso"
  const metodoComisiones = metodosDistribucion?.comisiones || "valor_fob"

  const pagosDistribuidos = distributeCost(
    productosParaDistribucion,
    totalPagosRD,
    metodoPagos,
    tasaPromedio
  )

  const gastosDistribuidos = distributeCost(
    productosParaDistribucion,
    totalGastosRD,
    metodoGastos,
    tasaPromedio
  )

  const comisionesDistribuidas = distributeCost(
    productosParaDistribucion,
    totalComisionesRD,
    metodoComisiones,
    tasaPromedio
  )

  // 6. Combinar resultados
  return itemsNormalizados.map(item => {
    // Buscar distribuciones para este producto
    const pagosDist = pagosDistribuidos.find((d: any) => d.productId === item.id)
    const gastosDist = gastosDistribuidos.find((d: any) => d.productId === item.id)
    const comisionesDist = comisionesDistribuidas.find((d: any) => d.productId === item.id)

    // Costos distribuidos por unidad
    const pagosUnitario = pagosDist?.costoUnitario || 0
    const gastosUnitario = gastosDist?.costoUnitario || 0
    const comisionesUnitario = comisionesDist?.costoUnitario || 0

    // Costo FOB en RD$
    const costoFOBRD = item.subtotalUSD * tasaPromedio

    // Costos distribuidos totales (para este producto)
    const pagosDistribuidosRD = pagosDist?.costoDistribuido || 0
    const gastosDistribuidosRD = gastosDist?.costoDistribuido || 0
    const comisionesDistribuidasRD = comisionesDist?.costoDistribuido || 0

    // NOTA IMPORTANTE: Según la lógica de analisis-costos/route.ts (línea 164):
    // costoFinal = costoFobRD + pagosUnitario + gastosUnitario + comisionesUnitario
    //
    // Esto puede parecer redundante (¿FOB + Pagos?) pero es correcto porque:
    // - costoFOBRD = Precio base del producto
    // - pagosDistribuidos = Distribución de TODOS los pagos hechos (incluye anticipos, pagos finales, etc.)
    // - Los "pagos" representan el dinero real enviado, que puede diferir del FOB teórico
    //   debido a descuentos, ajustes, o pagos parciales
    //
    // Por lo tanto, sumamos todo para obtener el costo total real
    const costoTotalRD =
      costoFOBRD + pagosDistribuidosRD + gastosDistribuidosRD + comisionesDistribuidasRD

    // Costo unitario
    const costoUnitarioRD = item.cantidadTotal > 0 ? costoTotalRD / item.cantidadTotal : 0

    return {
      id: item.id,
      sku: item.sku,
      nombre: item.nombre,
      cantidadTotal: item.cantidadTotal,
      precioUnitarioUSD: item.precioUnitarioUSD,
      subtotalUSD: item.subtotalUSD,
      costoFOBRD: RD(costoFOBRD).value,
      pagosDistribuidosRD: RD(pagosDistribuidosRD).value,
      gastosDistribuidosRD: RD(gastosDistribuidosRD).value,
      comisionesDistribuidasRD: RD(comisionesDistribuidasRD).value,
      costoTotalRD: RD(costoTotalRD).value,
      costoUnitarioRD: RD(costoUnitarioRD).value,
      tasaCambio: tasaPromedio,
      metodosUsados: {
        pagos: metodoPagos,
        gastos: metodoGastos,
        comisiones: metodoComisiones,
      },
    }
  })
}

// =====================================================
// DISTRIBUCIÓN DE GASTOS ENTRE MÚLTIPLES OCS
// =====================================================

/**
 * Distribuye un gasto entre múltiples OCs usando el método configurado
 *
 * Esta función REEMPLAZA la división igual (monto / numOrdenes) con distribución
 * proporcional basada en cajas, valor FOB, o unidades.
 *
 * @param gasto - Gasto a distribuir con su monto total
 * @param ocs - Array de OCs asociadas con datos necesarios para distribución
 * @param method - Método de distribución ("cajas", "valor_fob", "unidades")
 * @returns Map de ocId → monto distribuido a esa OC
 *
 * @example
 * ```typescript
 * const distribucion = distributeExpenseAcrossOCs(
 *   { id: "gasto1", montoRD: new Prisma.Decimal(10000) },
 *   [
 *     { id: "oc1", cantidadCajas: 5, items: [...] },
 *     { id: "oc2", cantidadCajas: 20, items: [...] }
 *   ],
 *   "cajas"
 * )
 * // Result: { "oc1" => 2000, "oc2" => 8000 }
 * ```
 */
export function distributeExpenseAcrossOCs(
  gasto: { id: string; montoRD: Prisma.Decimal },
  ocs: Array<{
    id: string
    cantidadCajas?: number | null
    items: Array<{
      cantidadTotal: number
      precioUnitarioUSD: Prisma.Decimal
    }>
  }>,
  method: "cajas" | "valor_fob" | "unidades" = "cajas"
): Map<string, number> {
  const totalMonto = parseFloat(gasto.montoRD.toString())

  // Caso especial: si solo hay 1 OC, todo el gasto va a esa OC
  if (ocs.length === 1) {
    return new Map([[ocs[0].id, totalMonto]])
  }

  let distribucionBase: Array<{ id: string; valor: number }>

  if (method === "cajas") {
    // Distribuir por cantidad de cajas
    distribucionBase = ocs.map(oc => ({
      id: oc.id,
      valor: oc.cantidadCajas || 0,
    }))
  } else if (method === "valor_fob") {
    // Distribuir por valor FOB total de la OC
    distribucionBase = ocs.map(oc => ({
      id: oc.id,
      valor: oc.items.reduce(
        (sum, item) => sum + item.cantidadTotal * parseFloat(item.precioUnitarioUSD.toString()),
        0
      ),
    }))
  } else {
    // Distribuir por cantidad de unidades (default/fallback)
    distribucionBase = ocs.map(oc => ({
      id: oc.id,
      valor: oc.items.reduce((sum, item) => sum + item.cantidadTotal, 0),
    }))
  }

  // Calcular total
  const totalValor = distribucionBase.reduce((sum, oc) => sum + oc.valor, 0)

  // Si total es 0, dividir igual como último fallback
  if (totalValor === 0) {
    console.warn(
      `⚠️ Total es 0 para método ${method} en gasto ${gasto.id}, dividiendo igual como fallback`
    )
    const montoPorOC = totalMonto / ocs.length
    return new Map(ocs.map(oc => [oc.id, montoPorOC]))
  }

  // Distribuir proporcionalmente
  const resultado = new Map<string, number>()
  distribucionBase.forEach(oc => {
    const porcentaje = oc.valor / totalValor
    const montoDistribuido = totalMonto * porcentaje
    resultado.set(oc.id, montoDistribuido)
  })

  return resultado
}
