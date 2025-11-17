// lib/cost-distribution.ts
// Professional cost distribution methods for import management

export type DistributionMethod = "peso" | "volumen" | "valor_fob" | "unidades"

export interface ProductDistributionData {
  id: string
  cantidad: number
  pesoUnitarioKg?: number | null
  volumenUnitarioCBM?: number | null
  precioUnitarioUSD: number
}

export interface DistributionResult {
  productId: string
  porcentaje: number          // Percentage of total cost this product bears (0-1)
  costoDistribuido: number    // Amount of cost distributed to this product
  costoUnitario: number       // Cost per unit
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
  return products.map((product) => {
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
  return products.map((product) => {
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
  return products.map((product) => {
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
    return products.map((product) => ({
      productId: product.id,
      porcentaje: 0,
      costoDistribuido: 0,
      costoUnitario: 0,
    }))
  }

  // Cost per unit is the same for all products
  const costoUnitario = totalCost / totalUnits

  // Distribute cost equally per unit
  return products.map((product) => {
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
 * Main distribution function - routes to appropriate method
 */
export function distributeCost(
  products: ProductDistributionData[],
  totalCost: number,
  method: DistributionMethod,
  exchangeRate: number = 1
): DistributionResult[] {
  switch (method) {
    case "peso":
      return distributeByWeight(products, totalCost)
    case "volumen":
      return distributeByVolume(products, totalCost)
    case "valor_fob":
      return distributeByFOBValue(products, totalCost, exchangeRate)
    case "unidades":
      return distributeByUnit(products, totalCost)
    default:
      // Default to unit distribution
      return distributeByUnit(products, totalCost)
  }
}

/**
 * Calculate CBM (Cubic Meters) from dimensions
 * Formula: (length × width × height) / 1,000,000 (if in cm)
 */
export function calculateCBM(
  lengthCM: number,
  widthCM: number,
  heightCM: number
): number {
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
  }
  return labels[method] || method
}

/**
 * Get recommended distribution method for a cost type
 */
export function getRecommendedMethod(costType: string): DistributionMethod {
  const recommendations: Record<string, DistributionMethod> = {
    pagos: "valor_fob",
    gastos_flete: "peso",
    gastos_aduana: "valor_fob",
    gastos_transporte_local: "peso",
    comisiones: "valor_fob",
  }
  return recommendations[costType] || "unidades"
}
