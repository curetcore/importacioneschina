import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  format,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  differenceInDays,
  addDays,
  subDays,
  formatRelative,
  formatDistance,
  formatDistanceToNow,
} from "date-fns"
import { es } from "date-fns/locale"
import currency from "currency.js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency: string = "DOP"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount

  // Mapeo de monedas a sus símbolos personalizados
  const currencySymbols: Record<string, string> = {
    USD: "US$",
    DOP: "RD$",
    RD$: "RD$",
  }

  const symbol = currencySymbols[currency] || currency

  // Formatear el número con separadores de miles y decimales
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)

  return `${symbol}${formattedNumber}`
}

export function formatNumber(num: number | string): string {
  const value = typeof num === "string" ? parseFloat(num) : num
  return new Intl.NumberFormat("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formatea una fecha usando date-fns
 * @param date - Fecha como Date o string ISO
 * @returns Fecha formateada como "DD/MM/YYYY"
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  if (!isValid(dateObj)) return "Fecha inválida"
  return format(dateObj, "dd/MM/yyyy")
}

/**
 * Formatea una fecha en formato corto (ISO)
 * @param date - Fecha como Date o string
 * @returns Fecha en formato "YYYY-MM-DD"
 */
export function formatDateShort(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  if (!isValid(dateObj)) return ""
  return format(dateObj, "yyyy-MM-dd")
}

/**
 * Formatea una fecha en formato largo legible
 * @param date - Fecha como Date o string
 * @returns Fecha formateada como "15 de enero de 2024"
 */
export function formatDateLong(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  if (!isValid(dateObj)) return "Fecha inválida"
  return format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: es })
}

/**
 * Obtiene el primer día del mes de una fecha
 */
export function getMonthStart(date: Date | string): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return startOfMonth(dateObj)
}

/**
 * Obtiene el último día del mes de una fecha
 */
export function getMonthEnd(date: Date | string): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return endOfMonth(dateObj)
}

/**
 * Verifica si una fecha está dentro de un rango
 */
export function isDateInRange(
  date: Date | string,
  start: Date | string,
  end: Date | string
): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  const startObj = typeof start === "string" ? parseISO(start) : start
  const endObj = typeof end === "string" ? parseISO(end) : end

  return isWithinInterval(dateObj, { start: startObj, end: endObj })
}

/**
 * Calcula la diferencia en días entre dos fechas
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const dateObj1 = typeof date1 === "string" ? parseISO(date1) : date1
  const dateObj2 = typeof date2 === "string" ? parseISO(date2) : date2

  return differenceInDays(dateObj1, dateObj2)
}

/**
 * Agrega días a una fecha
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return addDays(dateObj, days)
}

/**
 * Resta días a una fecha
 */
export function subtractDaysFromDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return subDays(dateObj, days)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

export function roundTo2Decimals(num: number): number {
  return Math.round(num * 100) / 100
}

// ============================================
// CURRENCY FUNCTIONS (currency.js)
// ============================================

/**
 * Suma dos cantidades de dinero con precisión decimal perfecta
 * @example addCurrency(1000.50, 2000.30) → 3000.80
 */
export function addCurrency(a: number, b: number): number {
  return currency(a).add(b).value
}

/**
 * Resta dos cantidades de dinero con precisión decimal perfecta
 * @example subtractCurrency(5000, 2000.50) → 2999.50
 */
export function subtractCurrency(a: number, b: number): number {
  return currency(a).subtract(b).value
}

/**
 * Multiplica una cantidad por un factor con precisión decimal perfecta
 * @example multiplyCurrency(1000.50, 1.18) → 1180.59 (con ITBIS 18%)
 */
export function multiplyCurrency(amount: number, factor: number): number {
  return currency(amount).multiply(factor).value
}

/**
 * Divide una cantidad entre un divisor con precisión decimal perfecta
 * @example divideCurrency(1000, 3) → 333.33
 */
export function divideCurrency(amount: number, divisor: number): number {
  if (divisor === 0) return 0
  return currency(amount).divide(divisor).value
}

/**
 * Distribuye una cantidad total entre múltiples partes según sus pesos
 * Sin pérdida de centavos - la suma de las partes = total exacto
 * @example
 * distributeCurrency(10000, [1, 2, 3]) → [1666.67, 3333.33, 5000.00]
 * Total: 10000.00 ✅
 */
export function distributeCurrency(total: number, weights: number[]): number[] {
  if (weights.length === 0) return []

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  if (totalWeight === 0) return weights.map(() => 0)

  const totalCurrency = currency(total)
  const distributions: number[] = []
  let distributed = currency(0)

  // Distribuir proporcionalmente
  weights.forEach((weight, index) => {
    if (index === weights.length - 1) {
      // Último elemento: asignar el resto para evitar error de redondeo
      distributions.push(totalCurrency.subtract(distributed).value)
    } else {
      const portion = totalCurrency.multiply(weight).divide(totalWeight).value
      distributions.push(portion)
      distributed = distributed.add(portion)
    }
  })

  return distributions
}

/**
 * Aplica un porcentaje a una cantidad
 * @example applyPercentage(1000, 18) → 1180 (agregar 18%)
 * @example applyPercentage(1000, -10) → 900 (restar 10%)
 */
export function applyPercentage(amount: number, percentage: number): number {
  return currency(amount).multiply(1 + percentage / 100).value
}

/**
 * Calcula el porcentaje que representa una parte del total
 * @example calculatePercentageOf(250, 1000) → 25
 */
export function calculatePercentageOf(part: number, total: number): number {
  if (total === 0) return 0
  return currency(part).divide(total).multiply(100).value
}

// ============================================
// DATE FUNCTIONS ADVANCED (date-fns)
// ============================================

/**
 * Formatea una fecha de forma relativa al momento actual
 * @example formatDateRelative(new Date()) → "hoy a las 14:30"
 * @example formatDateRelative(yesterday) → "ayer a las 10:00"
 * @example formatDateRelative(lastWeek) → "el lunes pasado a las 15:00"
 */
export function formatDateRelative(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  if (!isValid(dateObj)) return "Fecha inválida"
  return formatRelative(dateObj, new Date(), { locale: es })
}

/**
 * Formatea la distancia entre dos fechas en palabras
 * @example formatDateDistance(futureDate, now) → "en 5 días"
 * @example formatDateDistance(pastDate, now) → "hace 2 meses"
 */
export function formatDateDistanceBetween(date: Date | string, baseDate: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  const baseObj = typeof baseDate === "string" ? parseISO(baseDate) : baseDate

  if (!isValid(dateObj) || !isValid(baseObj)) return "Fecha inválida"

  return formatDistance(dateObj, baseObj, {
    addSuffix: true,
    locale: es,
  })
}

/**
 * Formatea la distancia desde una fecha hasta ahora
 * @example formatTimeAgo(new Date(Date.now() - 3600000)) → "hace 1 hora"
 * @example formatTimeAgo(yesterday) → "hace 1 día"
 */
export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  if (!isValid(dateObj)) return "Fecha inválida"

  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: es,
  })
}

/**
 * Formatea un rango de fechas de forma legible
 * @example formatDateRange(start, end) → "15-20 de enero de 2024"
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const startObj = typeof start === "string" ? parseISO(start) : start
  const endObj = typeof end === "string" ? parseISO(end) : end

  if (!isValid(startObj) || !isValid(endObj)) return "Rango inválido"

  const startDay = format(startObj, "d", { locale: es })
  const endFormatted = format(endObj, "d 'de' MMMM 'de' yyyy", { locale: es })

  return `${startDay}-${endFormatted}`
}

/**
 * Genera el siguiente ID en secuencia con formato de 5 dígitos
 * @param prefix - Prefijo del ID (ej: "OC", "PAG", "GASTO", "REC")
 * @param lastId - Último ID registrado (ej: "OC-00005")
 * @returns Siguiente ID en secuencia (ej: "OC-00006")
 */
export function generateNextId(prefix: string, lastId?: string): string {
  if (!lastId) {
    return `${prefix}-00001`
  }

  // Extraer el número del último ID
  const parts = lastId.split("-")
  const lastNumber = parseInt(parts[parts.length - 1], 10)

  // Incrementar y formatear con padding de 5 dígitos
  const nextNumber = lastNumber + 1
  const paddedNumber = nextNumber.toString().padStart(5, "0")

  return `${prefix}-${paddedNumber}`
}
