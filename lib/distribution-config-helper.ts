/**
 * Helper para obtener método de distribución de gastos entre OCs
 *
 * ESTRATEGIA DE SEGURIDAD:
 * - Triple fallback: mapeo → config BD → hardcode
 * - Feature flag para habilitar/deshabilitar
 * - Logs detallados para monitoreo
 * - Comportamiento idéntico al código anterior por defecto
 */

import { getPrismaClient } from "./db-helpers"

// Feature flag - cambiar a "true" para habilitar configuración de BD
const USE_CONFIG_DISTRIBUTION = process.env.USE_CONFIG_DISTRIBUTION === "true"

/**
 * Mapeo de tipos de gasto (como aparecen en BD) a categorías de configuración
 */
const TIPO_GASTO_TO_CONFIG: Record<string, string> = {
  "Flete internacional": "gastos_flete",
  "Transporte local": "gastos_transporte_local",
  "Aduana / DGA": "gastos_aduana",
  Impuestos: "gastos_aduana", // Mismo que aduana
  Broker: "gastos_aduana", // Mismo que aduana
  Seguro: "gastos_aduana", // Mismo que aduana
  Almacenaje: "gastos_transporte_local", // Similar a transporte
  Otros: "gastos_transporte_local", // Default
}

/**
 * Método de distribución hardcodeado (comportamiento original)
 * Este es el FALLBACK que garantiza que siempre funcione
 */
function getHardcodedMethod(tipoGasto: string): "cajas" | "valor_fob" | "unidades" {
  const tipoLower = tipoGasto.toLowerCase()

  // Flete y transporte → por cajas (más espacio = más costo)
  if (
    tipoLower.includes("flete") ||
    tipoLower.includes("transporte") ||
    tipoLower.includes("almacenaje")
  ) {
    return "cajas"
  }

  // Aduana, impuestos, seguros → por valor FOB (más valor = más impuestos)
  if (
    tipoLower.includes("aduana") ||
    tipoLower.includes("impuesto") ||
    tipoLower.includes("seguro") ||
    tipoLower.includes("broker")
  ) {
    return "valor_fob"
  }

  // Default: distribución igual
  return "unidades"
}

/**
 * Obtiene el método de distribución para un tipo de gasto
 *
 * FLUJO:
 * 1. Si feature flag está OFF → usar hardcode (comportamiento original)
 * 2. Intentar mapear tipoGasto → categoría de configuración
 * 3. Si no hay mapeo → usar hardcode (FALLBACK 1)
 * 4. Buscar configuración en BD
 * 5. Si no encuentra o hay error → usar hardcode (FALLBACK 2 y 3)
 *
 * @param tipoGasto - Tipo de gasto como aparece en la BD (ej: "Flete internacional")
 * @returns Método de distribución: "cajas" | "valor_fob" | "unidades"
 */
export async function getDistributionMethodForExpense(
  tipoGasto: string
): Promise<"cajas" | "valor_fob" | "unidades"> {
  // KILL SWITCH: Si feature flag está OFF, usar comportamiento original
  if (!USE_CONFIG_DISTRIBUTION) {
    const method = getHardcodedMethod(tipoGasto)
    console.log(`📊 [Distribution] Feature flag OFF, usando hardcode:`, {
      tipoGasto,
      method,
    })
    return method
  }

  try {
    // Intentar obtener método desde configuración
    const categoria = TIPO_GASTO_TO_CONFIG[tipoGasto]

    // FALLBACK 1: Si no hay mapeo para este tipo de gasto, usar hardcode
    if (!categoria) {
      const method = getHardcodedMethod(tipoGasto)
      console.log(`⚠️ [Distribution] Sin mapeo para tipo de gasto, usando hardcode:`, {
        tipoGasto,
        method,
      })
      return method
    }

    // Buscar configuración en BD
    const db = await getPrismaClient()
    const config = await db.configuracionDistribucionCostos.findUnique({
      where: { tipoCosto: categoria },
    })

    // FALLBACK 2: Si no hay configuración en BD, usar hardcode
    if (!config) {
      const method = getHardcodedMethod(tipoGasto)
      console.log(`⚠️ [Distribution] Sin config en BD para categoria, usando hardcode:`, {
        tipoGasto,
        categoria,
        method,
      })
      return method
    }

    // ÉXITO: Usar configuración de BD
    const method = config.metodoDistribucion as "cajas" | "valor_fob" | "unidades"
    console.log(`✅ [Distribution] Usando configuración de BD:`, {
      tipoGasto,
      categoria,
      method,
      fromConfig: true,
    })
    return method
  } catch (error) {
    // FALLBACK 3: Si hay cualquier error, usar hardcode
    const method = getHardcodedMethod(tipoGasto)
    console.error(`❌ [Distribution] Error obteniendo config, usando hardcode:`, {
      tipoGasto,
      method,
      error: error instanceof Error ? error.message : String(error),
    })
    return method
  }
}

/**
 * Validar que el método de distribución sea válido
 */
export function isValidDistributionMethod(
  method: string
): method is "cajas" | "valor_fob" | "unidades" {
  return method === "cajas" || method === "valor_fob" || method === "unidades"
}

/**
 * Obtener el método de distribución hardcodeado (para testing y comparación)
 * Exportado para que puedas comparar comportamiento antes/después
 */
export function getHardcodedDistributionMethod(
  tipoGasto: string
): "cajas" | "valor_fob" | "unidades" {
  return getHardcodedMethod(tipoGasto)
}
