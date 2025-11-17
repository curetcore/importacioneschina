import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: string = "DOP"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  // Mapeo de monedas a sus símbolos personalizados
  const currencySymbols: Record<string, string> = {
    "USD": "US$",
    "CNY": "CNY¥",
    "DOP": "RD$",
    "RD$": "RD$",
  };

  const symbol = currencySymbols[currency] || currency;

  // Formatear el número con separadores de miles y decimales
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return `${symbol}${formattedNumber}`;
}

export function formatNumber(num: number | string): string {
  const value = typeof num === "string" ? parseFloat(num) : num;
  return new Intl.NumberFormat("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatea una fecha usando date-fns
 * @param date - Fecha como Date o string ISO
 * @returns Fecha formateada como "DD/MM/YYYY"
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return "Fecha inválida";
  return format(dateObj, "dd/MM/yyyy");
}

/**
 * Formatea una fecha en formato corto (ISO)
 * @param date - Fecha como Date o string
 * @returns Fecha en formato "YYYY-MM-DD"
 */
export function formatDateShort(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return "";
  return format(dateObj, "yyyy-MM-dd");
}

/**
 * Formatea una fecha en formato largo legible
 * @param date - Fecha como Date o string
 * @returns Fecha formateada como "15 de enero de 2024"
 */
export function formatDateLong(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return "Fecha inválida";
  return format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Obtiene el primer día del mes de una fecha
 */
export function getMonthStart(date: Date | string): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return startOfMonth(dateObj);
}

/**
 * Obtiene el último día del mes de una fecha
 */
export function getMonthEnd(date: Date | string): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return endOfMonth(dateObj);
}

/**
 * Verifica si una fecha está dentro de un rango
 */
export function isDateInRange(date: Date | string, start: Date | string, end: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const startObj = typeof start === "string" ? parseISO(start) : start;
  const endObj = typeof end === "string" ? parseISO(end) : end;

  return isWithinInterval(dateObj, { start: startObj, end: endObj });
}

/**
 * Calcula la diferencia en días entre dos fechas
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const dateObj1 = typeof date1 === "string" ? parseISO(date1) : date1;
  const dateObj2 = typeof date2 === "string" ? parseISO(date2) : date2;

  return differenceInDays(dateObj1, dateObj2);
}

/**
 * Agrega días a una fecha
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return addDays(dateObj, days);
}

/**
 * Resta días a una fecha
 */
export function subtractDaysFromDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return subDays(dateObj, days);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function roundTo2Decimals(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Genera el siguiente ID en secuencia con formato de 5 dígitos
 * @param prefix - Prefijo del ID (ej: "OC", "PAG", "GASTO", "REC")
 * @param lastId - Último ID registrado (ej: "OC-00005")
 * @returns Siguiente ID en secuencia (ej: "OC-00006")
 */
export function generateNextId(prefix: string, lastId?: string): string {
  if (!lastId) {
    return `${prefix}-00001`;
  }

  // Extraer el número del último ID
  const parts = lastId.split('-');
  const lastNumber = parseInt(parts[parts.length - 1], 10);

  // Incrementar y formatear con padding de 5 dígitos
  const nextNumber = lastNumber + 1;
  const paddedNumber = nextNumber.toString().padStart(5, '0');

  return `${prefix}-${paddedNumber}`;
}
