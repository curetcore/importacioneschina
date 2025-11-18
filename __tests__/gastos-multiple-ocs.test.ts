/**
 * Tests para Gastos con Múltiples OCs
 *
 * Verifica que:
 * 1. Un gasto puede asociarse a múltiples OCs
 * 2. La distribución de costos funciona correctamente
 * 3. Los cálculos son precisos
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Gastos con Múltiples OCs', () => {
  let testOC1: any
  let testOC2: any
  let testOC3: any
  let testGasto: any

  beforeAll(async () => {
    // Crear OCs de prueba
    testOC1 = await prisma.oCChina.create({
      data: {
        oc: `TEST-OC-001-${Date.now()}`,
        proveedor: 'Proveedor Test',
        fechaOC: new Date(),
        categoriaPrincipal: 'Test',
      },
    })

    testOC2 = await prisma.oCChina.create({
      data: {
        oc: `TEST-OC-002-${Date.now()}`,
        proveedor: 'Proveedor Test',
        fechaOC: new Date(),
        categoriaPrincipal: 'Test',
      },
    })

    testOC3 = await prisma.oCChina.create({
      data: {
        oc: `TEST-OC-003-${Date.now()}`,
        proveedor: 'Proveedor Test',
        fechaOC: new Date(),
        categoriaPrincipal: 'Test',
      },
    })
  })

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testGasto) {
      await prisma.gastosLogisticos.delete({ where: { id: testGasto.id } })
    }
    if (testOC1) await prisma.oCChina.delete({ where: { id: testOC1.id } })
    if (testOC2) await prisma.oCChina.delete({ where: { id: testOC2.id } })
    if (testOC3) await prisma.oCChina.delete({ where: { id: testOC3.id } })
    await prisma.$disconnect()
  })

  describe('Creación de Gasto con Múltiples OCs', () => {
    it('debe crear un gasto asociado a 3 OCs', async () => {
      testGasto = await prisma.gastosLogisticos.create({
        data: {
          idGasto: `TEST-GASTO-${Date.now()}`,
          fechaGasto: new Date(),
          tipoGasto: 'Flete Marítimo',
          proveedorServicio: 'Test Freight',
          metodoPago: 'Transferencia',
          montoRD: 15000,
          notas: 'Gasto de prueba',
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

      expect(testGasto).toBeDefined()
      expect(testGasto.ordenesCompra).toHaveLength(3)
      expect(testGasto.montoRD.toNumber()).toBe(15000)
    })

    it('debe distribuir el costo equitativamente entre las 3 OCs', () => {
      const montoTotal = testGasto.montoRD.toNumber()
      const numOCs = testGasto.ordenesCompra.length
      const montoPorOC = montoTotal / numOCs

      expect(montoPorOC).toBe(5000)
      expect(montoPorOC * numOCs).toBe(montoTotal)
    })
  })

  describe('Validaciones de Integridad', () => {
    // NOTA: La validación "al menos 1 OC" se hace en Zod (gastosLogisticosSchema),
    // no a nivel de base de datos. Ver tests de validación en gastos-api.test.ts

    it('no debe permitir OCs duplicadas en el mismo gasto', async () => {
      await expect(async () => {
        await prisma.gastosLogisticos.create({
          data: {
            idGasto: `TEST-DUP-${Date.now()}`,
            fechaGasto: new Date(),
            tipoGasto: 'Test',
            metodoPago: 'Efectivo',
            montoRD: 1000,
            ordenesCompra: {
              create: [
                { ocId: testOC1.id },
                { ocId: testOC1.id }, // Duplicado - debe fallar por UNIQUE constraint
              ],
            },
          },
        })
      }).rejects.toThrow()
    })
  })

  describe('Actualización de Gastos', () => {
    it('debe poder cambiar las OCs asociadas', async () => {
      // Actualizar para que solo tenga OC1 y OC2 (eliminar OC3)
      const updated = await prisma.$transaction(async (tx) => {
        // Eliminar todas las relaciones existentes
        await tx.gastoLogisticoOC.deleteMany({
          where: { gastoId: testGasto.id },
        })

        // Crear nuevas relaciones
        await tx.gastoLogisticoOC.createMany({
          data: [
            { gastoId: testGasto.id, ocId: testOC1.id },
            { gastoId: testGasto.id, ocId: testOC2.id },
          ],
        })

        // Retornar gasto actualizado
        return tx.gastosLogisticos.findUnique({
          where: { id: testGasto.id },
          include: {
            ordenesCompra: {
              include: {
                ocChina: true,
              },
            },
          },
        })
      })

      expect(updated?.ordenesCompra).toHaveLength(2)

      // Ahora el costo se distribuye entre 2 OCs
      const montoPorOC = updated!.montoRD.toNumber() / 2
      expect(montoPorOC).toBe(7500)
    })
  })

  describe('Queries de Búsqueda', () => {
    it('debe encontrar el gasto al buscar por OC1', async () => {
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

      expect(gastos.length).toBeGreaterThan(0)
      const nuestroGasto = gastos.find((g) => g.id === testGasto.id)
      expect(nuestroGasto).toBeDefined()
    })

    it('debe encontrar el gasto al buscar por OC2', async () => {
      const gastos = await prisma.gastosLogisticos.findMany({
        where: {
          ordenesCompra: {
            some: {
              ocId: testOC2.id,
            },
          },
        },
      })

      const nuestroGasto = gastos.find((g) => g.id === testGasto.id)
      expect(nuestroGasto).toBeDefined()
    })
  })

  describe('Eliminación en Cascada', () => {
    it('debe eliminar las relaciones cuando se elimina el gasto', async () => {
      // Contar relaciones antes
      const relacionesAntes = await prisma.gastoLogisticoOC.count({
        where: { gastoId: testGasto.id },
      })
      expect(relacionesAntes).toBeGreaterThan(0)

      // Crear un gasto temporal para eliminar
      const tempGasto = await prisma.gastosLogisticos.create({
        data: {
          idGasto: `TEMP-${Date.now()}`,
          fechaGasto: new Date(),
          tipoGasto: 'Temp',
          metodoPago: 'Efectivo',
          montoRD: 100,
          ordenesCompra: {
            create: [{ ocId: testOC1.id }],
          },
        },
      })

      // Eliminar el gasto
      await prisma.gastosLogisticos.delete({
        where: { id: tempGasto.id },
      })

      // Verificar que las relaciones también se eliminaron
      const relacionesDespues = await prisma.gastoLogisticoOC.count({
        where: { gastoId: tempGasto.id },
      })
      expect(relacionesDespues).toBe(0)
    })
  })
})
