import {
  distributeByWeight,
  distributeByVolume,
  distributeByFOBValue,
  distributeByUnit,
  distributeCost,
  calculateCBM,
  getDistributionMethodLabel,
  getRecommendedMethod,
  ProductDistributionData,
} from "../cost-distribution"

describe("Cost Distribution Functions", () => {
  // Mock product data
  const products: ProductDistributionData[] = [
    {
      id: "product-1",
      cantidad: 100,
      pesoUnitarioKg: 0.5,
      volumenUnitarioCBM: 0.001,
      precioUnitarioUSD: 10,
    },
    {
      id: "product-2",
      cantidad: 50,
      pesoUnitarioKg: 2.0,
      volumenUnitarioCBM: 0.004,
      precioUnitarioUSD: 50,
    },
    {
      id: "product-3",
      cantidad: 200,
      pesoUnitarioKg: 0.1,
      volumenUnitarioCBM: 0.0005,
      precioUnitarioUSD: 5,
    },
  ]

  const totalCost = 10000

  describe("distributeByWeight", () => {
    it("should distribute costs proportionally by weight", () => {
      const result = distributeByWeight(products, totalCost)

      // Total weight: 100*0.5 + 50*2.0 + 200*0.1 = 50 + 100 + 20 = 170kg
      // Product 1: 50/170 = 29.41%
      // Product 2: 100/170 = 58.82%
      // Product 3: 20/170 = 11.76%

      expect(result).toHaveLength(3)
      expect(result[0].productId).toBe("product-1")
      expect(result[0].porcentaje).toBeCloseTo(0.2941, 3)
      expect(result[0].costoDistribuido).toBeCloseTo(2941.18, 1)
      expect(result[0].costoUnitario).toBeCloseTo(29.41, 1)

      expect(result[1].productId).toBe("product-2")
      expect(result[1].porcentaje).toBeCloseTo(0.5882, 3)
      expect(result[1].costoDistribuido).toBeCloseTo(5882.35, 1)

      expect(result[2].productId).toBe("product-3")
      expect(result[2].porcentaje).toBeCloseTo(0.1176, 3)
    })

    it("should fallback to unit distribution when no weight data", () => {
      const productsNoWeight: ProductDistributionData[] = [
        { id: "p1", cantidad: 100, precioUnitarioUSD: 10 },
        { id: "p2", cantidad: 50, precioUnitarioUSD: 20 },
      ]

      const result = distributeByWeight(productsNoWeight, 1000)

      // Should fallback to equal per unit: 1000 / 150 = 6.67 per unit
      expect(result[0].costoUnitario).toBeCloseTo(6.67, 2)
      expect(result[1].costoUnitario).toBeCloseTo(6.67, 2)
    })

    it("should handle zero total weight", () => {
      const productsZeroWeight: ProductDistributionData[] = [
        { id: "p1", cantidad: 100, pesoUnitarioKg: 0, precioUnitarioUSD: 10 },
      ]

      const result = distributeByWeight(productsZeroWeight, 1000)

      // Should fallback to unit distribution
      expect(result[0].costoUnitario).toBe(10)
    })
  })

  describe("distributeByVolume", () => {
    it("should distribute costs proportionally by volume", () => {
      const result = distributeByVolume(products, totalCost)

      // Total volume: 100*0.001 + 50*0.004 + 200*0.0005 = 0.1 + 0.2 + 0.1 = 0.4 CBM
      // Product 1: 0.1/0.4 = 25%
      // Product 2: 0.2/0.4 = 50%
      // Product 3: 0.1/0.4 = 25%

      expect(result).toHaveLength(3)
      expect(result[0].porcentaje).toBeCloseTo(0.25, 2)
      expect(result[0].costoDistribuido).toBeCloseTo(2500, 1)

      expect(result[1].porcentaje).toBeCloseTo(0.5, 2)
      expect(result[1].costoDistribuido).toBeCloseTo(5000, 1)

      expect(result[2].porcentaje).toBeCloseTo(0.25, 2)
    })

    it("should fallback to unit distribution when no volume data", () => {
      const productsNoVolume: ProductDistributionData[] = [
        { id: "p1", cantidad: 100, precioUnitarioUSD: 10 },
        { id: "p2", cantidad: 50, precioUnitarioUSD: 20 },
      ]

      const result = distributeByVolume(productsNoVolume, 1000)

      expect(result[0].costoUnitario).toBeCloseTo(6.67, 2)
      expect(result[1].costoUnitario).toBeCloseTo(6.67, 2)
    })
  })

  describe("distributeByFOBValue", () => {
    it("should distribute costs proportionally by FOB value", () => {
      const exchangeRate = 58
      const result = distributeByFOBValue(products, totalCost, exchangeRate)

      // Total FOB value in RD$:
      // Product 1: 100 * 10 * 58 = 58,000
      // Product 2: 50 * 50 * 58 = 145,000
      // Product 3: 200 * 5 * 58 = 58,000
      // Total: 261,000

      // Product 1: 58,000/261,000 = 22.22%
      // Product 2: 145,000/261,000 = 55.56%
      // Product 3: 58,000/261,000 = 22.22%

      expect(result).toHaveLength(3)
      expect(result[0].porcentaje).toBeCloseTo(0.2222, 3)
      expect(result[0].costoDistribuido).toBeCloseTo(2222.22, 1)

      expect(result[1].porcentaje).toBeCloseTo(0.5556, 3)
      expect(result[1].costoDistribuido).toBeCloseTo(5555.56, 1)

      expect(result[2].porcentaje).toBeCloseTo(0.2222, 3)
    })

    it("should handle exchange rate of 1 (default)", () => {
      const result = distributeByFOBValue(products, totalCost)

      // Without exchange rate, just use USD values
      expect(result).toHaveLength(3)
      expect(result[0].porcentaje).toBeGreaterThan(0)
    })

    it("should fallback to unit distribution when no FOB value", () => {
      const productsNoFOB: ProductDistributionData[] = [
        { id: "p1", cantidad: 100, precioUnitarioUSD: 0 },
        { id: "p2", cantidad: 50, precioUnitarioUSD: 0 },
      ]

      const result = distributeByFOBValue(productsNoFOB, 1000)

      expect(result[0].costoUnitario).toBeCloseTo(6.67, 2)
    })
  })

  describe("distributeByUnit", () => {
    it("should distribute costs equally per unit", () => {
      const result = distributeByUnit(products, totalCost)

      // Total units: 100 + 50 + 200 = 350
      // Cost per unit: 10000 / 350 = 28.57

      expect(result).toHaveLength(3)
      expect(result[0].costoUnitario).toBeCloseTo(28.57, 2)
      expect(result[0].costoDistribuido).toBeCloseTo(2857.14, 1)

      expect(result[1].costoUnitario).toBeCloseTo(28.57, 2)
      expect(result[1].costoDistribuido).toBeCloseTo(1428.57, 1)

      expect(result[2].costoUnitario).toBeCloseTo(28.57, 2)
      expect(result[2].costoDistribuido).toBeCloseTo(5714.29, 1)
    })

    it("should handle zero units", () => {
      const productsNoUnits: ProductDistributionData[] = [
        { id: "p1", cantidad: 0, precioUnitarioUSD: 10 },
      ]

      const result = distributeByUnit(productsNoUnits, 1000)

      expect(result[0].costoDistribuido).toBe(0)
      expect(result[0].costoUnitario).toBe(0)
      expect(result[0].porcentaje).toBe(0)
    })
  })

  describe("distributeCost (main function)", () => {
    it("should route to correct distribution method", () => {
      const resultWeight = distributeCost(products, totalCost, "peso")
      const resultVolume = distributeCost(products, totalCost, "volumen")
      const resultFOB = distributeCost(products, totalCost, "valor_fob", 58)
      const resultUnit = distributeCost(products, totalCost, "unidades")

      expect(resultWeight[0].costoUnitario).not.toBe(resultVolume[0].costoUnitario)
      expect(resultVolume[0].costoUnitario).not.toBe(resultFOB[0].costoUnitario)
      expect(resultFOB[0].costoUnitario).not.toBe(resultUnit[0].costoUnitario)
    })

    it("should default to unit distribution for unknown method", () => {
      const result = distributeCost(products, totalCost, "unknown" as any)

      // Should behave like distributeByUnit
      expect(result[0].costoUnitario).toBeCloseTo(28.57, 2)
    })
  })

  describe("calculateCBM", () => {
    it("should calculate CBM from dimensions in cm", () => {
      const cbm = calculateCBM(50, 40, 30) // 50cm × 40cm × 30cm

      // 50 * 40 * 30 / 1,000,000 = 0.06 CBM
      expect(cbm).toBeCloseTo(0.06, 6)
    })

    it("should handle small dimensions", () => {
      const cbm = calculateCBM(10, 10, 10)

      // 10 * 10 * 10 / 1,000,000 = 0.001 CBM
      expect(cbm).toBeCloseTo(0.001, 6)
    })

    it("should handle large dimensions", () => {
      const cbm = calculateCBM(200, 150, 100)

      // 200 * 150 * 100 / 1,000,000 = 3 CBM
      expect(cbm).toBe(3)
    })
  })

  describe("getDistributionMethodLabel", () => {
    it("should return correct Spanish labels", () => {
      expect(getDistributionMethodLabel("peso")).toBe("Por Peso (kg)")
      expect(getDistributionMethodLabel("volumen")).toBe("Por Volumen (CBM)")
      expect(getDistributionMethodLabel("valor_fob")).toBe("Por Valor FOB")
      expect(getDistributionMethodLabel("unidades")).toBe("Por Unidades")
    })

    it("should return the method itself for unknown methods", () => {
      expect(getDistributionMethodLabel("unknown" as any)).toBe("unknown")
    })
  })

  describe("getRecommendedMethod", () => {
    it("should recommend correct methods for each cost type", () => {
      expect(getRecommendedMethod("pagos")).toBe("valor_fob")
      expect(getRecommendedMethod("gastos_flete")).toBe("peso")
      expect(getRecommendedMethod("gastos_aduana")).toBe("valor_fob")
      expect(getRecommendedMethod("gastos_transporte_local")).toBe("peso")
      expect(getRecommendedMethod("comisiones")).toBe("valor_fob")
    })

    it("should default to unidades for unknown cost types", () => {
      expect(getRecommendedMethod("unknown")).toBe("unidades")
    })
  })

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty product array", () => {
      const result = distributeByWeight([], 1000)

      expect(result).toHaveLength(0)
    })

    it("should handle negative costs (treated as 0)", () => {
      const result = distributeByUnit(products, -1000)

      // Should still calculate percentages but with negative values
      expect(result[0].costoDistribuido).toBeLessThan(0)
    })

    it("should handle null/undefined values gracefully", () => {
      const productsWithNulls: ProductDistributionData[] = [
        {
          id: "p1",
          cantidad: 100,
          pesoUnitarioKg: null,
          volumenUnitarioCBM: null,
          precioUnitarioUSD: 10,
        },
      ]

      const resultWeight = distributeByWeight(productsWithNulls, 1000)
      const resultVolume = distributeByVolume(productsWithNulls, 1000)

      // Should fallback to unit distribution
      expect(resultWeight[0].costoUnitario).toBe(10)
      expect(resultVolume[0].costoUnitario).toBe(10)
    })

    it("should handle very small numbers (precision)", () => {
      const tinyProducts: ProductDistributionData[] = [
        {
          id: "p1",
          cantidad: 1,
          pesoUnitarioKg: 0.001,
          volumenUnitarioCBM: 0.000001,
          precioUnitarioUSD: 0.01,
        },
      ]

      const result = distributeByWeight(tinyProducts, 1)

      expect(result[0].costoDistribuido).toBeCloseTo(1, 6)
    })

    it("should ensure total distribution equals input cost", () => {
      const result = distributeByUnit(products, totalCost)

      const totalDistributed = result.reduce((sum, r) => sum + r.costoDistribuido, 0)

      expect(totalDistributed).toBeCloseTo(totalCost, 2)
    })

    it("should ensure percentages sum to 1", () => {
      const result = distributeByWeight(products, totalCost)

      const totalPercentage = result.reduce((sum, r) => sum + r.porcentaje, 0)

      expect(totalPercentage).toBeCloseTo(1, 6)
    })
  })
})
