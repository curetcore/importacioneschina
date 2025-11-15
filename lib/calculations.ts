import { Prisma } from "@prisma/client";

// ==========================================
// Funciones de Cálculo de Negocio
// ==========================================

/**
 * Calcula el monto en RD$ según la moneda
 */
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

/**
 * Calcula el monto RD neto (monto + comisión)
 */
export function calcularMontoRDNeto(
  montoRD: number | Prisma.Decimal,
  comisionBancoRD: number | Prisma.Decimal
): number {
  const monto = typeof montoRD === "number" ? montoRD : parseFloat(montoRD.toString());
  const comision = typeof comisionBancoRD === "number" ? comisionBancoRD : parseFloat(comisionBancoRD.toString());

  return monto + comision;
}

/**
 * Calcula el total de inversión de una OC
 */
export function calcularTotalInversion(
  totalPagosRD: number,
  totalGastosRD: number
): number {
  return totalPagosRD + totalGastosRD;
}

/**
 * Calcula el costo unitario final
 */
export function calcularCostoUnitarioFinal(
  totalInversionRD: number,
  cantidadRecibida: number
): number {
  if (cantidadRecibida === 0) return 0;
  return Math.round((totalInversionRD / cantidadRecibida) * 100) / 100;
}

/**
 * Calcula la diferencia de unidades
 */
export function calcularDiferenciaUnidades(
  cantidadOrdenada: number,
  cantidadRecibida: number
): number {
  return cantidadOrdenada - cantidadRecibida;
}

/**
 * Calcula el porcentaje de recepción
 */
export function calcularPorcentajeRecepcion(
  cantidadRecibida: number,
  cantidadOrdenada: number
): number {
  if (cantidadOrdenada === 0) return 0;
  return Math.round((cantidadRecibida / cantidadOrdenada) * 100 * 100) / 100;
}

/**
 * Calcula el costo total de una recepción
 */
export function calcularCostoTotalRecepcion(
  cantidadRecibida: number,
  costoUnitarioFinalRD: number
): number {
  return Math.round(cantidadRecibida * costoUnitarioFinalRD * 100) / 100;
}

/**
 * Calcula el costo FOB unitario
 */
export function calcularCostoFOBUnitario(
  costoFOBTotal: number | Prisma.Decimal,
  cantidadOrdenada: number
): number {
  if (cantidadOrdenada === 0) return 0;
  const total = typeof costoFOBTotal === "number" ? costoFOBTotal : parseFloat(costoFOBTotal.toString());
  return Math.round((total / cantidadOrdenada) * 100) / 100;
}

/**
 * Obtiene los cálculos completos de una OC
 */
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

/**
 * Calcula todos los valores para una OC
 */
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
