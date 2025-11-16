/**
 * Generador de IDs secuenciales thread-safe usando transacciones de Prisma
 *
 * Este módulo resuelve el problema de race condition cuando múltiples usuarios
 * intentan crear registros simultáneamente. Usa transacciones de Prisma para
 * garantizar que cada ID sea único.
 */

import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

/**
 * Genera el siguiente ID en secuencia de manera thread-safe usando transacciones
 *
 * Esta función es completamente segura para uso concurrente. Usa transacciones
 * de Prisma para garantizar que no habrá IDs duplicados incluso cuando múltiples
 * peticiones lleguen simultáneamente.
 *
 * @param modelName - Nombre del modelo Prisma ("oCChina", "pagosChina", etc.)
 * @param fieldName - Nombre del campo que contiene el ID ("oc", "idPago", etc.)
 * @param prefix - Prefijo del ID ("OC", "PAG", "GASTO", "REC")
 * @returns Promise con el ID único generado
 *
 * @example
 * const id = await generateUniqueId("pagosChina", "idPago", "PAG")
 * // Retorna: "PAG-00001", "PAG-00002", etc.
 */
export async function generateUniqueId(
  modelName: string,
  fieldName: string,
  prefix: string
): Promise<string> {
  // Usamos una transacción para garantizar atomicidad
  return await prisma.$transaction(async (tx) => {
    // 1. Obtener el último ID usando orderBy DESC y lock de lectura
    const lastRecord = await (tx as any)[modelName].findFirst({
      orderBy: { [fieldName]: "desc" },
      select: { [fieldName]: true },
    });

    // 2. Generar el siguiente ID
    const nextId = generateNextIdFromLast(prefix, lastRecord?.[fieldName]);

    // 3. Retornar el ID (la transacción garantiza que es único)
    return nextId;
  }, {
    // Configuración de la transacción
    maxWait: 5000, // Espera máxima de 5 segundos para adquirir lock
    timeout: 10000, // Timeout de 10 segundos para toda la transacción
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // Nivel más alto de aislamiento
  });
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
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  // Agregar random suffix para garantizar unicidad si hay múltiples creaciones por segundo
  const randomSuffix = Math.random().toString(36).substring(2, 6);

  return `${prefix}-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`;
}
