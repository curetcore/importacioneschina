import { Prisma } from "@prisma/client"
import {
  calcularMontoRD,
  calcularMontoRDNeto,
  calcularTotalInversion,
  calcularCostoUnitarioFinal,
  calcularDiferenciaUnidades,
  calcularPorcentajeRecepcion,
  calcularCostoTotalRecepcion,
  calcularCostoFOBUnitario,
  calcularOC,
  calcularTasaCambioPromedio,
  distribuirGastosLogisticos,
  calcularResumenFinanciero,
} from "../calculations"

describe("Cálculos Financieros", () => {
  describe("calcularMontoRD", () => {
    it("debe retornar el mismo monto para RD$", () => {
      expect(calcularMontoRD(1000, "RD$")).toBe(1000)
    })

    it("debe convertir USD a RD$ correctamente", () => {
      expect(calcularMontoRD(100, "USD", 60)).toBe(6000)
    })

    it("debe manejar Prisma.Decimal", () => {
      const decimal = new Prisma.Decimal(100)
      expect(calcularMontoRD(decimal, "USD", 58.5)).toBe(5850)
    })

    it("debe retornar 0 si tasa de cambio es 0", () => {
      expect(calcularMontoRD(100, "USD", 0)).toBe(0)
    })

    it("debe retornar 0 si tasa de cambio es negativa", () => {
      expect(calcularMontoRD(100, "USD", -10)).toBe(0)
    })

    it("debe manejar decimales con precisión", () => {
      // Evitar errores de floating point
      const resultado = calcularMontoRD(1000.33, "USD", 60.5)
      expect(resultado).toBeCloseTo(60519.97, 2)
    })
  })

  describe("calcularMontoRDNeto", () => {
    it("debe sumar la comisión al monto", () => {
      expect(calcularMontoRDNeto(10000, 500)).toBe(10500)
    })

    it("debe manejar Prisma.Decimal", () => {
      const monto = new Prisma.Decimal(58500)
      const comision = new Prisma.Decimal(500)
      expect(calcularMontoRDNeto(monto, comision)).toBe(59000)
    })

    it("debe manejar comisión cero", () => {
      expect(calcularMontoRDNeto(1000, 0)).toBe(1000)
    })

    it("debe calcular correctamente con decimales", () => {
      expect(calcularMontoRDNeto(1000.5, 50.25)).toBeCloseTo(1050.75, 2)
    })
  })

  describe("calcularTotalInversion", () => {
    it("debe sumar pagos y gastos correctamente", () => {
      expect(calcularTotalInversion(10000, 5000)).toBe(15000)
    })

    it("debe manejar valores negativos convirtiéndolos a 0", () => {
      expect(calcularTotalInversion(-1000, 5000)).toBe(5000)
      expect(calcularTotalInversion(10000, -2000)).toBe(10000)
      expect(calcularTotalInversion(-1000, -2000)).toBe(0)
    })

    it("debe manejar ceros", () => {
      expect(calcularTotalInversion(0, 0)).toBe(0)
      expect(calcularTotalInversion(0, 5000)).toBe(5000)
      expect(calcularTotalInversion(10000, 0)).toBe(10000)
    })
  })

  describe("calcularCostoUnitarioFinal", () => {
    it("debe calcular costo unitario correctamente", () => {
      expect(calcularCostoUnitarioFinal(10000, 100)).toBe(100)
    })

    it("debe retornar 0 si cantidad es 0", () => {
      expect(calcularCostoUnitarioFinal(10000, 0)).toBe(0)
    })

    it("debe retornar 0 si cantidad es negativa", () => {
      expect(calcularCostoUnitarioFinal(10000, -5)).toBe(0)
    })

    it("debe retornar 0 si inversión es negativa", () => {
      expect(calcularCostoUnitarioFinal(-1000, 100)).toBe(0)
    })

    it("debe manejar decimales con precisión", () => {
      const resultado = calcularCostoUnitarioFinal(1000.33, 37)
      expect(resultado).toBeCloseTo(27.04, 2)
    })
  })

  describe("calcularDiferenciaUnidades", () => {
    it("debe calcular diferencia correctamente", () => {
      expect(calcularDiferenciaUnidades(100, 80)).toBe(20)
    })

    it("debe retornar negativo si se recibió más de lo ordenado", () => {
      expect(calcularDiferenciaUnidades(100, 120)).toBe(-20)
    })

    it("debe retornar 0 si son iguales", () => {
      expect(calcularDiferenciaUnidades(100, 100)).toBe(0)
    })
  })

  describe("calcularPorcentajeRecepcion", () => {
    it("debe calcular 100% si se recibió todo", () => {
      expect(calcularPorcentajeRecepcion(100, 100)).toBe(100)
    })

    it("debe calcular 50% si se recibió la mitad", () => {
      expect(calcularPorcentajeRecepcion(50, 100)).toBe(50)
    })

    it("debe retornar 0 si cantidad ordenada es 0", () => {
      expect(calcularPorcentajeRecepcion(50, 0)).toBe(0)
    })

    it("debe retornar 0 si cantidad recibida es negativa", () => {
      expect(calcularPorcentajeRecepcion(-10, 100)).toBe(0)
    })

    it("debe manejar decimales redondeados", () => {
      expect(calcularPorcentajeRecepcion(33, 100)).toBe(33)
      expect(calcularPorcentajeRecepcion(33.33, 100)).toBe(33.33)
    })
  })

  describe("calcularCostoTotalRecepcion", () => {
    it("debe multiplicar cantidad por costo unitario", () => {
      expect(calcularCostoTotalRecepcion(10, 100)).toBe(1000)
    })

    it("debe retornar 0 si cantidad es negativa", () => {
      expect(calcularCostoTotalRecepcion(-10, 100)).toBe(0)
    })

    it("debe retornar 0 si costo es negativo", () => {
      expect(calcularCostoTotalRecepcion(10, -100)).toBe(0)
    })

    it("debe manejar decimales correctamente", () => {
      expect(calcularCostoTotalRecepcion(25, 43.75)).toBeCloseTo(1093.75, 2)
    })
  })

  describe("calcularCostoFOBUnitario", () => {
    it("debe calcular costo FOB unitario correctamente", () => {
      expect(calcularCostoFOBUnitario(1000, 100)).toBe(10)
    })

    it("debe retornar 0 si cantidad es 0", () => {
      expect(calcularCostoFOBUnitario(1000, 0)).toBe(0)
    })

    it("debe retornar 0 si cantidad es negativa", () => {
      expect(calcularCostoFOBUnitario(1000, -10)).toBe(0)
    })

    it("debe retornar 0 si total es negativo", () => {
      expect(calcularCostoFOBUnitario(-1000, 100)).toBe(0)
    })

    it("debe manejar Prisma.Decimal", () => {
      const decimal = new Prisma.Decimal(2500)
      expect(calcularCostoFOBUnitario(decimal, 50)).toBe(50)
    })
  })

  describe("calcularOC - Función Integradora", () => {
    it("debe calcular correctamente todos los valores de una OC", () => {
      const resultado = calcularOC({
        costoFOBTotalUSD: 1000,
        cantidadOrdenada: 100,
        pagos: [
          { montoRDNeto: new Prisma.Decimal(60000) },
          { montoRDNeto: new Prisma.Decimal(5000) },
        ],
        gastos: [{ montoRD: new Prisma.Decimal(2000) }, { montoRD: new Prisma.Decimal(3000) }],
        inventario: [{ cantidadRecibida: 50 }, { cantidadRecibida: 30 }],
      })

      expect(resultado.totalPagosRD).toBe(65000)
      expect(resultado.totalGastosRD).toBe(5000)
      expect(resultado.totalInversionRD).toBe(70000)
      expect(resultado.cantidadRecibida).toBe(80)
      expect(resultado.diferenciaUnidades).toBe(20)
      expect(resultado.costoUnitarioFinalRD).toBe(875) // 70000 / 80
      expect(resultado.costoFOBUnitarioUSD).toBe(10) // 1000 / 100
      expect(resultado.porcentajeRecepcion).toBe(80) // 80/100
    })

    it("debe manejar OC sin recepciones", () => {
      const resultado = calcularOC({
        costoFOBTotalUSD: 1000,
        cantidadOrdenada: 100,
        pagos: [{ montoRDNeto: new Prisma.Decimal(60000) }],
        gastos: [],
        inventario: [],
      })

      expect(resultado.cantidadRecibida).toBe(0)
      expect(resultado.costoUnitarioFinalRD).toBe(0) // No se puede dividir por 0
      expect(resultado.porcentajeRecepcion).toBe(0)
    })

    it("debe manejar pagos con montoRDNeto null", () => {
      const resultado = calcularOC({
        costoFOBTotalUSD: 1000,
        cantidadOrdenada: 100,
        pagos: [
          { montoRDNeto: new Prisma.Decimal(60000) },
          { montoRDNeto: null }, // Pago pendiente
        ],
        gastos: [],
        inventario: [{ cantidadRecibida: 100 }],
      })

      expect(resultado.totalPagosRD).toBe(60000)
    })
  })

  describe("calcularTasaCambioPromedio", () => {
    it("debe calcular tasa promedio ponderada correctamente", () => {
      const pagos = [
        {
          montoOriginal: new Prisma.Decimal(500),
          moneda: "USD",
          tasaCambio: new Prisma.Decimal(60),
          montoRDNeto: new Prisma.Decimal(30000),
        },
        {
          montoOriginal: new Prisma.Decimal(500),
          moneda: "USD",
          tasaCambio: new Prisma.Decimal(58),
          montoRDNeto: new Prisma.Decimal(29000),
        },
      ]

      const resultado = calcularTasaCambioPromedio(pagos)
      expect(resultado).toBe(59) // (60 + 58) / 2
    })

    it("debe ignorar pagos en RD$", () => {
      const pagos = [
        {
          montoOriginal: new Prisma.Decimal(1000),
          moneda: "RD$",
          tasaCambio: new Prisma.Decimal(1),
          montoRDNeto: new Prisma.Decimal(1000),
        },
        {
          montoOriginal: new Prisma.Decimal(100),
          moneda: "USD",
          tasaCambio: new Prisma.Decimal(60),
          montoRDNeto: new Prisma.Decimal(6000),
        },
      ]

      const resultado = calcularTasaCambioPromedio(pagos)
      expect(resultado).toBe(60) // Solo cuenta el USD
    })

    it("debe retornar 0 si no hay pagos", () => {
      expect(calcularTasaCambioPromedio([])).toBe(0)
    })

    it("debe retornar 0 si no hay pagos con tasa válida", () => {
      const pagos = [
        {
          montoOriginal: new Prisma.Decimal(1000),
          moneda: "RD$",
          tasaCambio: new Prisma.Decimal(1),
          montoRDNeto: new Prisma.Decimal(1000),
        },
      ]

      expect(calcularTasaCambioPromedio(pagos)).toBe(0)
    })
  })

  describe("distribuirGastosLogisticos", () => {
    it("debe distribuir gastos proporcionalmente según costo FOB", () => {
      const items = [
        {
          id: "1",
          sku: "SKU-001",
          nombre: "Producto A",
          cantidadTotal: 50,
          precioUnitarioUSD: new Prisma.Decimal(10),
          subtotalUSD: new Prisma.Decimal(500),
          material: null,
          color: null,
          especificaciones: null,
          tallaDistribucion: null,
        },
        {
          id: "2",
          sku: "SKU-002",
          nombre: "Producto B",
          cantidadTotal: 50,
          precioUnitarioUSD: new Prisma.Decimal(10),
          subtotalUSD: new Prisma.Decimal(500),
          material: null,
          color: null,
          especificaciones: null,
          tallaDistribucion: null,
        },
      ]

      const gastosLogisticos = [{ montoRD: new Prisma.Decimal(1000) }]

      const pagosChina = [
        {
          montoOriginal: new Prisma.Decimal(1000),
          moneda: "USD",
          tasaCambio: new Prisma.Decimal(60),
          montoRDNeto: new Prisma.Decimal(60000),
        },
      ]

      const resultado = distribuirGastosLogisticos(items, gastosLogisticos, pagosChina)

      // Cada item representa 50% del total, por lo tanto debe tener 500 RD$ de gastos
      expect(resultado[0].gastosLogisticosRD).toBe(500)
      expect(resultado[1].gastosLogisticosRD).toBe(500)

      // Porcentaje FOB debe ser 50% para cada uno
      expect(resultado[0].porcentajeFOB).toBe(50)
      expect(resultado[1].porcentajeFOB).toBe(50)

      // Costo FOB en RD$ debe ser 500 * 60 = 30000
      expect(resultado[0].costoFOBRD).toBe(30000)
      expect(resultado[1].costoFOBRD).toBe(30000)

      // Costo total = FOB + gastos = 30000 + 500 = 30500
      expect(resultado[0].costoTotalRD).toBe(30500)
      expect(resultado[1].costoTotalRD).toBe(30500)

      // Costo unitario = 30500 / 50 = 610
      expect(resultado[0].costoUnitarioRD).toBe(610)
      expect(resultado[1].costoUnitarioRD).toBe(610)
    })

    it("debe retornar array vacío si totalFOBUSD es 0", () => {
      const items = [
        {
          id: "1",
          sku: "SKU-001",
          nombre: "Producto A",
          cantidadTotal: 50,
          precioUnitarioUSD: new Prisma.Decimal(0),
          subtotalUSD: new Prisma.Decimal(0),
          material: null,
          color: null,
          especificaciones: null,
          tallaDistribucion: null,
        },
      ]

      const resultado = distribuirGastosLogisticos(items, [], [])
      expect(resultado).toEqual([])
    })

    it("debe retornar array vacío si items está vacío", () => {
      const resultado = distribuirGastosLogisticos([], [], [])
      expect(resultado).toEqual([])
    })
  })

  describe("calcularResumenFinanciero", () => {
    it("debe calcular resumen financiero completo correctamente", () => {
      const items = [
        {
          id: "1",
          sku: "SKU-001",
          nombre: "Producto A",
          cantidadTotal: 50,
          precioUnitarioUSD: new Prisma.Decimal(10),
          subtotalUSD: new Prisma.Decimal(500),
          material: null,
          color: null,
          especificaciones: null,
          tallaDistribucion: null,
        },
        {
          id: "2",
          sku: "SKU-002",
          nombre: "Producto B",
          cantidadTotal: 50,
          precioUnitarioUSD: new Prisma.Decimal(10),
          subtotalUSD: new Prisma.Decimal(500),
          material: null,
          color: null,
          especificaciones: null,
          tallaDistribucion: null,
        },
      ]

      const pagosChina = [
        {
          montoOriginal: new Prisma.Decimal(1000),
          moneda: "USD",
          tasaCambio: new Prisma.Decimal(60),
          montoRDNeto: new Prisma.Decimal(60000),
        },
      ]

      const gastosLogisticos = [{ montoRD: new Prisma.Decimal(5000) }]

      const resumen = calcularResumenFinanciero(items, pagosChina, gastosLogisticos)

      expect(resumen.totalUnidades).toBe(100)
      expect(resumen.totalFOBUSD).toBe(1000)
      expect(resumen.totalPagadoRD).toBe(60000)
      expect(resumen.totalGastosRD).toBe(5000)
      expect(resumen.totalCostoRD).toBe(65000)
      expect(resumen.tasaCambioPromedio).toBe(60)
      expect(resumen.costoUnitarioPromedioRD).toBe(650) // 65000 / 100
    })

    it("debe manejar división por cero en costo unitario promedio", () => {
      const resumen = calcularResumenFinanciero([], [], [])

      expect(resumen.totalUnidades).toBe(0)
      expect(resumen.costoUnitarioPromedioRD).toBe(0)
    })
  })
})
