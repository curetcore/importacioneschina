import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(num: number | string): string {
  const value = typeof num === "string" ? parseFloat(num) : num;
  return new Intl.NumberFormat("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

export function formatDateShort(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString().split("T")[0];
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
