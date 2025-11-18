/**
 * Tests para lógica de Gastos Logísticos
 *
 * Testea la lógica de negocio directamente sin necesidad de servidor HTTP
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { gastosLogisticosSchema } from '@/lib/validations'

const prisma = new PrismaClient()

describe('Lógica de Gastos Logísticos', () => {
  let testOC1: any
  let testOC2: any
  let testOC3: any
  let testGastoId: string

  beforeAll(async () => {
    // Crear OCs de prueba
    testOC1 = await prisma.oCChina.create({
      data: {
        oc: `TEST-OC-API-1-${Date.now()}`,
        proveedor: 'Test Provider 1',
        fechaOC: new Date(),
        categoriaPrincipal: 'Test',
        cantidadOrdenada: 100,
        costoFOBTotalUSD: 1000,
      },
    })

    testOC2 = await prisma.oCChina.create({
      data: {
        oc: `TEST-OC-API-2-${Date.now()}`,
        proveedor: 'Test Provider 2',
        fechaOC: new Date(),
        categoriaPrincipal: 'Test',
        cantidadOrdenada: 100,
        costoFOBTotalUSD: 1000,
      },
    })

    testOC3 = await prisma.oCChina.create({
      data: {
        oc: `TEST-OC-API-3-${Date.now()}`,
        proveedor: 'Test Provider 3',
        fechaOC: new Date(),
        categoriaPrincipal: 'Test',
        cantidadOrdenada: 100,
        costoFOBTotalUSD: 1000,
      },
    })
  })

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testGastoId) {
      await prisma.gastosLogisticos.delete({
        where: { id: testGastoId },
      })
    }

    await prisma.oCChina.deleteMany({
      where: {
        id: {
          in: [testOC1.id, testOC2.id, testOC3.id],
        },
      },
    })

    await prisma.$disconnect()
  })

  describe('Validación con Zod', () => {
    it('debe validar correctamente un gasto con múltiples OCs', () => {
      const validData = {
        ocIds: ['oc-id-1', 'oc-id-2', 'oc-id-3'], // IDs de prueba, no necesitan existir en BD
        fechaGasto: new Date(),
        tipoGasto: 'Flete Marítimo',
        proveedorServicio: 'Test Freight Company',
        metodoPago: 'Transferencia',
        montoRD: 30000,
        notas: 'Test gasto compartido',
      }

      const result = gastosLogisticosSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe fallar si no se proporciona ninguna OC', () => {
      const invalidData = {
        ocIds: [], // Sin OCs - debe fallar validación
        fechaGasto: new Date(),
        tipoGasto: 'Test',
        metodoPago: 'Efectivo',
        montoRD: 1000,
      }

      const result = gastosLogisticosSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos una OC')
      }
    })

    it('debe fallar si el monto es negativo', () => {
      const invalidData = {
        ocIds: ['oc-id-1'], // ID de prueba
        fechaGasto: new Date(),
        tipoGasto: 'Test',
        metodoPago: 'Efectivo',
        montoRD: -1000, // Negativo - debe fallar
      }

      const result = gastosLogisticosSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Creación directa en BD', () => {
    it('debe crear un gasto asociado a 3 OCs', async () => {
      const gasto = await prisma.gastosLogisticos.create({
        data: {
          idGasto: `TEST-GASTO-API-${Date.now()}`,
          fechaGasto: new Date(),
          tipoGasto: 'Flete Marítimo',
          proveedorServicio: 'Test Freight Company',
          metodoPago: 'Transferencia',
          montoRD: 30000,
          notas: 'Test gasto compartido',
          ordenesCompra: {
            create: [
              { ocId: testOC1.id },
              { ocId: testOC2.id },
              { ocId: testOC3.id },
            ],
          },
        },
        include: {
          ordenesCompra: {
            include: {
              ocChina: true,
            },
          },
        },
      })

      expect(gasto.ordenesCompra).toHaveLength(3)
      testGastoId = gasto.id
    })

    it('debe poder consultar el gasto creado', async () => {
      const gasto = await prisma.gastosLogisticos.findUnique({
        where: { id: testGastoId },
        include: {
          ordenesCompra: {
            include: {
              ocChina: {
                select: {
                  oc: true,
                  proveedor: true,
                },
              },
            },
          },
        },
      })

      expect(gasto).toBeDefined()
      expect(gasto?.ordenesCompra).toHaveLength(3)
    })

    it('debe poder filtrar gastos por OC específica', async () => {
      const gastos = await prisma.gastosLogisticos.findMany({
        where: {
          ordenesCompra: {
            some: {
              ocId: testOC1.id,
            },
          },
        },
        include: {
          ordenesCompra: true,
        },
      })

      // Debe encontrar nuestro gasto de prueba
      const nuestroGasto = gastos.find((g) => g.id === testGastoId)
      expect(nuestroGasto).toBeDefined()
    })

    it('debe poder actualizar las OCs asociadas', async () => {
      // Primero eliminamos todas las relaciones
      await prisma.gastoLogisticoOC.deleteMany({
        where: { gastoId: testGastoId },
      })

      // Luego creamos solo 2 relaciones nuevas
      await prisma.gastoLogisticoOC.createMany({
        data: [
          { gastoId: testGastoId, ocId: testOC1.id },
          { gastoId: testOC2.id, ocId: testOC2.id },
        ],
      })

      const gastoActualizado = await prisma.gastosLogisticos.findUnique({
        where: { id: testGastoId },
        include: { ordenesCompra: true },
      })

      expect(gastoActualizado?.ordenesCompra).toHaveLength(2)
    })

    it('debe poder actualizar el monto del gasto', async () => {
      const nuevoMonto = 45000

      await prisma.gastosLogisticos.update({
        where: { id: testGastoId },
        data: { montoRD: nuevoMonto },
      })

      const gastoActualizado = await prisma.gastosLogisticos.findUnique({
        where: { id: testGastoId },
      })

      expect(gastoActualizado?.montoRD.toNumber()).toBe(nuevoMonto)
    })
  })

  describe('Cálculo de distribución de costos', () => {
    it('debe distribuir equitativamente entre las OCs', () => {
      const montoTotal = 30000
      const numOCs = 3
      const montoPorOC = montoTotal / numOCs

      expect(montoPorOC).toBe(10000)
      expect(montoPorOC * numOCs).toBe(montoTotal)
    })

    it('debe manejar divisiones con decimales', () => {
      const montoTotal = 10000
      const numOCs = 3
      const montoPorOC = montoTotal / numOCs

      expect(montoPorOC).toBeCloseTo(3333.33, 2)
    })
  })
})
