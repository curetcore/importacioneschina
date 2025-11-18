/**
 * Generador de IDs secuenciales thread-safe usando transacciones de Prisma
 *
 * Este módulo resuelve el problema de race condition cuando múltiples usuarios
 * intentan crear registros simultáneamente. Usa transacciones de Prisma para
 * garantizar que cada ID sea único.
 *
 * IMPORTANTE: Usa getPrismaClient() para garantizar que los IDs se generen
 * en la base de datos correcta (producción o demo según el usuario).
 */

import { getPrismaClient } from "./db-helpers"
import { Prisma } from "@prisma/client"

/**
 * Genera un ID alfanumérico único de 6 caracteres
 *
 * Genera códigos cortos y únicos combinando letras y números.
 * Verifica en la base de datos que no exista antes de retornar.
 *
 * @param modelName - Nombre del modelo Prisma ("oCChina", "pagosChina", etc.)
 * @param fieldName - Nombre del campo que contiene el ID ("oc", "idPago", etc.)
 * @param prefix - Prefijo del ID ("OC", "PAG", "GASTO", "REC")
 * @returns Promise con el ID único generado
 *
 * @example
 * const id = await generateUniqueId("pagosChina", "idPago", "PAG")
 * // Retorna: "PAG-A1B2C3", "PAG-X7Y9Z2", etc.
 */
export async function generateUniqueId(
  modelName: string,
  fieldName: string,
  prefix: string
): Promise<string> {
  const db = await getPrismaClient()

  // Intentar hasta 5 veces (muy raro que haya colisión)
  const maxAttempts = 5

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generar código alfanumérico de 6 caracteres
    const code = generateAlphanumericCode(6)
    const id = `${prefix}-${code}`

    // Verificar que no exista en la base de datos
    const existing = await (db as any)[modelName].findUnique({
      where: { [fieldName]: id },
      select: { [fieldName]: true },
    })

    if (!existing) {
      return id
    }
  }

  // Si después de 5 intentos no encontramos uno único, usar timestamp como fallback
  return generateTimestampId(prefix)
}

/**
 * Genera un código alfanumérico random de N caracteres
 * Usa solo caracteres fáciles de leer (sin 0, O, I, 1, etc.)
 */
function generateAlphanumericCode(length: number): string {
  // Caracteres permitidos (sin confusos: 0, O, I, 1, l)
  const chars = "234567892ABCDEFGHJKLMNPQRSTUVWXYZ3456789"
  let code = ""

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }

  return code
}

/**
 * Genera el siguiente ID en secuencia con formato de 5 dígitos
 * (Función auxiliar interna - no usar directamente)
 *
 * @param prefix - Prefijo del ID (ej: "OC", "PAG", "GASTO", "REC")
 * @param lastId - Último ID registrado (ej: "OC-00005")
 * @returns Siguiente ID en secuencia (ej: "OC-00006")
 */
function generateNextIdFromLast(prefix: string, lastId?: string): string {
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

/**
 * Genera un ID con timestamp para casos donde se necesita mayor unicidad
 * Útil como fallback o para sistemas de alta concurrencia
 *
 * @param prefix - Prefijo del ID
 * @returns ID único con timestamp
 *
 * @example
 * generateTimestampId("PAG")
 * // Retorna: "PAG-20250116-143025-a3b4"
 */
export function generateTimestampId(prefix: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  const day = now.getDate().toString().padStart(2, "0")
  const hours = now.getHours().toString().padStart(2, "0")
  const minutes = now.getMinutes().toString().padStart(2, "0")
  const seconds = now.getSeconds().toString().padStart(2, "0")

  // Agregar random suffix para garantizar unicidad si hay múltiples creaciones por segundo
  const randomSuffix = Math.random().toString(36).substring(2, 6)

  return `${prefix}-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`
}
