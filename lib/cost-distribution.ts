// lib/cost-distribution.ts
// Professional cost distribution methods for import management

export type DistributionMethod = "peso" | "volumen" | "valor_fob" | "unidades" | "cajas"

export interface ProductDistributionData {
  id: string
  cantidad: number
  pesoUnitarioKg?: number | null
  volumenUnitarioCBM?: number | null
  precioUnitarioUSD: number
}

export interface DistributionResult {
  productId: string
  porcentaje: number // Percentage of total cost this product bears (0-1)
  costoDistribuido: number // Amount of cost distributed to this product
  costoUnitario: number // Cost per unit
}

/**
 * Distribute costs by weight (kg)
 * Used for: Freight, local transport
 * Formula: (productWeight / totalWeight) × totalCost
 */
export function distributeByWeight(
  products: ProductDistributionData[],
  totalCost: number
): DistributionResult[] {
  // Calculate total weight across all products
  const totalWeight = products.reduce((sum, p) => {
    const pesoTotal = (p.pesoUnitarioKg || 0) * p.cantidad
    return sum + pesoTotal
  }, 0)

  // If no weight data, fall back to equal distribution by units
  if (totalWeight === 0) {
    return distributeByUnit(products, totalCost)
  }

  // Distribute cost proportionally by weight
  return products.map(product => {
    const pesoTotal = (product.pesoUnitarioKg || 0) * product.cantidad
    const porcentaje = pesoTotal / totalWeight
    const costoDistribuido = totalCost * porcentaje
    const costoUnitario = product.cantidad > 0 ? costoDistribuido / product.cantidad : 0

    return {
      productId: product.id,
      porcentaje,
      costoDistribuido,
      costoUnitario,
    }
  })
}

/**
 * Distribute costs by volume (CBM - cubic meters)
 * Used for: Sea/air freight when volume is more critical than weight
 * Formula: (productVolume / totalVolume) × totalCost
 */
export function distributeByVolume(
  products: ProductDistributionData[],
  totalCost: number
): DistributionResult[] {
  // Calculate total volume across all products
  const totalVolume = products.reduce((sum, p) => {
    const volumenTotal = (p.volumenUnitarioCBM || 0) * p.cantidad
    return sum + volumenTotal
  }, 0)

  // If no volume data, fall back to equal distribution by units
  if (totalVolume === 0) {
    return distributeByUnit(products, totalCost)
  }

  // Distribute cost proportionally by volume
  return products.map(product => {
    const volumenTotal = (product.volumenUnitarioCBM || 0) * product.cantidad
    const porcentaje = volumenTotal / totalVolume
    const costoDistribuido = totalCost * porcentaje
    const costoUnitario = product.cantidad > 0 ? costoDistribuido / product.cantidad : 0

    return {
      productId: product.id,
      porcentaje,
      costoDistribuido,
      costoUnitario,
    }
  })
}

/**
 * Distribute costs by FOB value
 * Used for: Customs, insurance, payment commissions
 * Formula: (productFOBValue / totalFOBValue) × totalCost
 */
export function distributeByFOBValue(
  products: ProductDistributionData[],
  totalCost: number,
  exchangeRate: number = 1
): DistributionResult[] {
  // Calculate total FOB value across all products
  const totalFOBValue = products.reduce((sum, p) => {
    const fobTotal = p.precioUnitarioUSD * p.cantidad * exchangeRate
    return sum + fobTotal
  }, 0)

  // If no FOB value, fall back to equal distribution by units
  if (totalFOBValue === 0) {
    return distributeByUnit(products, totalCost)
  }

  // Distribute cost proportionally by FOB value
  return products.map(product => {
    const fobTotal = product.precioUnitarioUSD * product.cantidad * exchangeRate
    const porcentaje = fobTotal / totalFOBValue
    const costoDistribuido = totalCost * porcentaje
    const costoUnitario = product.cantidad > 0 ? costoDistribuido / product.cantidad : 0

    return {
      productId: product.id,
      porcentaje,
      costoDistribuido,
      costoUnitario,
    }
  })
}

/**
 * Distribute costs equally by unit count
 * Used for: Fallback when no other data available, or for costs that should be equal per unit
 * Formula: totalCost / totalUnits
 */
export function distributeByUnit(
  products: ProductDistributionData[],
  totalCost: number
): DistributionResult[] {
  // Calculate total units across all products
  const totalUnits = products.reduce((sum, p) => sum + p.cantidad, 0)

  // If no units, return empty distribution
  if (totalUnits === 0) {
    return products.map(product => ({
      productId: product.id,
      porcentaje: 0,
      costoDistribuido: 0,
      costoUnitario: 0,
    }))
  }

  // Cost per unit is the same for all products
  const costoUnitario = totalCost / totalUnits

  // Distribute cost equally per unit
  return products.map(product => {
    const costoDistribuido = costoUnitario * product.cantidad
    const porcentaje = product.cantidad / totalUnits

    return {
      productId: product.id,
      porcentaje,
      costoDistribuido,
      costoUnitario,
    }
  })
}

/**
 * Distribute costs by number of boxes/packages
 * Used for: Freight costs, local transport (when charged by volume/space)
 * Formula: (ocBoxes / totalBoxes) × totalCost
 *
 * Note: This works at OC level, not product level, since boxes are associated with entire orders
 */
export interface OCDistributionData {
  id: string
  cantidadCajas: number | null
}

export function distributeByBoxes(
  ocs: OCDistributionData[],
  totalCost: number
): DistributionResult[] {
  // Calculate total boxes across all OCs (only those with box data)
  const ocsWithBoxes = ocs.filter(oc => oc.cantidadCajas && oc.cantidadCajas > 0)
  const totalBoxes = ocsWithBoxes.reduce((sum, oc) => sum + (oc.cantidadCajas || 0), 0)

  // If no box data, return empty/zero distribution
  if (totalBoxes === 0 || ocsWithBoxes.length === 0) {
    console.warn("⚠️ No hay datos de cajas, distribución por cajas no posible")
    return ocs.map(oc => ({
      productId: oc.id,
      porcentaje: 0,
      costoDistribuido: 0,
      costoUnitario: 0,
    }))
  }

  // Distribute cost proportionally by boxes
  return ocs.map(oc => {
    const cajas = oc.cantidadCajas || 0
    const porcentaje = cajas / totalBoxes
    const costoDistribuido = totalCost * porcentaje

    return {
      productId: oc.id,
      porcentaje,
      costoDistribuido,
      costoUnitario: 0, // Not applicable at OC level
    }
  })
}

/**
 * Check if distribution results are valid (not all zeros)
 */
function isValidDistribution(results: DistributionResult[]): boolean {
  return results.some(r => r.costoDistribuido > 0)
}

/**
 * Main distribution function - routes to appropriate method with intelligent fallback
 *
 * Fallback hierarchy when data is missing:
 * 1. Try requested method (peso, volumen, valor_fob, unidades)
 * 2. If fails (all zeros), try valor_fob (works for all products with price)
 * 3. If fails, try unidades (always works if there are products)
 */
export function distributeCost(
  products: ProductDistributionData[],
  totalCost: number,
  method: DistributionMethod,
  exchangeRate: number = 1
): DistributionResult[] {
  // If no cost to distribute, return zeros
  if (totalCost === 0 || products.length === 0) {
    return products.map(p => ({
      productId: p.id,
      porcentaje: 0,
      costoDistribuido: 0,
      costoUnitario: 0,
    }))
  }

  // Try primary method
  let results: DistributionResult[]
  switch (method) {
    case "peso":
      results = distributeByWeight(products, totalCost)
      break
    case "volumen":
      results = distributeByVolume(products, totalCost)
      break
    case "valor_fob":
      results = distributeByFOBValue(products, totalCost, exchangeRate)
      break
    case "unidades":
      results = distributeByUnit(products, totalCost)
      break
    default:
      results = distributeByUnit(products, totalCost)
  }

  // Validate results - if all zeros, try fallback methods
  if (!isValidDistribution(results)) {
    console.warn(`⚠️ Método "${method}" resultó en distribución vacía, usando fallback`)

    // Try FOB value as first fallback (works when products have prices)
    if (method !== "valor_fob") {
      results = distributeByFOBValue(products, totalCost, exchangeRate)
      if (isValidDistribution(results)) {
        console.info(`✓ Fallback exitoso: usando "valor_fob" en lugar de "${method}"`)
        return results
      }
    }

    // Last resort: distribute by units (always works)
    if (method !== "unidades") {
      results = distributeByUnit(products, totalCost)
      console.info(`✓ Fallback final: usando "unidades" en lugar de "${method}"`)
    }
  }

  return results
}

/**
 * Calculate CBM (Cubic Meters) from dimensions
 * Formula: (length × width × height) / 1,000,000 (if in cm)
 */
export function calculateCBM(lengthCM: number, widthCM: number, heightCM: number): number {
  return (lengthCM * widthCM * heightCM) / 1_000_000
}

/**
 * Get distribution method label in Spanish
 */
export function getDistributionMethodLabel(method: DistributionMethod): string {
  const labels: Record<DistributionMethod, string> = {
    peso: "Por Peso (kg)",
    volumen: "Por Volumen (CBM)",
    valor_fob: "Por Valor FOB",
    unidades: "Por Unidades",
    cajas: "Por Cantidad de Cajas",
  }
  return labels[method] || method
}

/**
 * Get recommended distribution method for a cost type
 */
export function getRecommendedMethod(costType: string): DistributionMethod {
  const recommendations: Record<string, DistributionMethod> = {
    pagos: "valor_fob",
    gastos_flete: "cajas", // Cambio: flete se cobra por espacio/cajas
    gastos_aduana: "valor_fob",
    gastos_transporte_local: "cajas", // Cambio: transporte local se cobra por bultos
    comisiones: "valor_fob",
  }
  return recommendations[costType] || "unidades"
}
