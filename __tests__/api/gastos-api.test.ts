/**
 * Tests para API de Gastos Logísticos
 *
 * Prueba los endpoints:
 * - POST /api/gastos-logisticos (crear con múltiples OCs)
 * - GET /api/gastos-logisticos (listar y filtrar)
 * - GET /api/gastos-logisticos/[id] (obtener detalle)
 * - PUT /api/gastos-logisticos/[id] (actualizar OCs)
 * - DELETE /api/gastos-logisticos/[id] (eliminar)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

describe('API Gastos Logísticos', () => {
  let testOCIds: string[] = []
  let testGastoId: string

  beforeAll(async () => {
    // Crear OCs de prueba via API
    const ocPromises = [1, 2, 3].map(async (i) => {
      const response = await fetch('http://localhost:3000/api/oc-china', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedor: `Test Provider ${i}`,
          fechaOC: new Date().toISOString(),
          categoriaPrincipal: 'Test',
          items: [
            {
              sku: `TEST-SKU-${i}`,
              nombre: `Test Product ${i}`,
              cantidadTotal: 100,
              precioUnitarioUSD: 10,
            },
          ],
        }),
      })
      const data = await response.json()
      return data.data.id
    })

    testOCIds = await Promise.all(ocPromises)
  })

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testGastoId) {
      await fetch(`http://localhost:3000/api/gastos-logisticos/${testGastoId}`, {
        method: 'DELETE',
      })
    }

    for (const ocId of testOCIds) {
      await fetch(`http://localhost:3000/api/oc-china/${ocId}`, {
        method: 'DELETE',
      })
    }
  })

  describe('POST /api/gastos-logisticos', () => {
    it('debe crear un gasto con múltiples OCs', async () => {
      const response = await fetch('http://localhost:3000/api/gastos-logisticos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocIds: testOCIds, // Array de 3 OCs
          fechaGasto: new Date().toISOString(),
          tipoGasto: 'Flete Marítimo',
          proveedorServicio: 'Test Freight Company',
          metodoPago: 'Transferencia',
          montoRD: 30000,
          notas: 'Test gasto compartido',
        }),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.ordenesCompra).toHaveLength(3)

      testGastoId = data.data.id
    })

    it('debe fallar si no se proporciona ninguna OC', async () => {
      const response = await fetch('http://localhost:3000/api/gastos-logisticos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocIds: [], // Sin OCs - debe fallar
          fechaGasto: new Date().toISOString(),
          tipoGasto: 'Test',
          metodoPago: 'Efectivo',
          montoRD: 1000,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('debe fallar si alguna OC no existe', async () => {
      const response = await fetch('http://localhost:3000/api/gastos-logisticos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocIds: ['OC-QUE-NO-EXISTE-123'],
          fechaGasto: new Date().toISOString(),
          tipoGasto: 'Test',
          metodoPago: 'Efectivo',
          montoRD: 1000,
        }),
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('GET /api/gastos-logisticos', () => {
    it('debe listar todos los gastos', async () => {
      const response = await fetch('http://localhost:3000/api/gastos-logisticos')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('debe filtrar gastos por OC específica', async () => {
      const ocIdToFilter = testOCIds[0]
      const response = await fetch(
        `http://localhost:3000/api/gastos-logisticos?ocId=${ocIdToFilter}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      // El gasto que creamos debe aparecer en los resultados
      const nuestroGasto = data.data.find((g: any) => g.id === testGastoId)
      expect(nuestroGasto).toBeDefined()

      // Verificar que el gasto está asociado a la OC filtrada
      const tieneOC = nuestroGasto.ordenesCompra.some(
        (rel: any) => rel.ocChina.id === ocIdToFilter
      )
      expect(tieneOC).toBe(true)
    })
  })

  describe('GET /api/gastos-logisticos/[id]', () => {
    it('debe obtener el detalle del gasto con todas sus OCs', async () => {
      const response = await fetch(
        `http://localhost:3000/api/gastos-logisticos/${testGastoId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testGastoId)
      expect(data.data.ordenesCompra).toHaveLength(3)

      // Verificar que cada relación tiene la información de la OC
      data.data.ordenesCompra.forEach((rel: any) => {
        expect(rel.ocChina).toBeDefined()
        expect(rel.ocChina.oc).toBeDefined()
        expect(rel.ocChina.proveedor).toBeDefined()
      })
    })

    it('debe devolver 404 para ID que no existe', async () => {
      const response = await fetch(
        'http://localhost:3000/api/gastos-logisticos/ID-QUE-NO-EXISTE'
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('PUT /api/gastos-logisticos/[id]', () => {
    it('debe actualizar las OCs asociadas', async () => {
      // Cambiar para que solo tenga las primeras 2 OCs
      const nuevasOCs = testOCIds.slice(0, 2)

      const response = await fetch(
        `http://localhost:3000/api/gastos-logisticos/${testGastoId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ocIds: nuevasOCs,
            fechaGasto: new Date().toISOString(),
            tipoGasto: 'Flete Marítimo',
            metodoPago: 'Transferencia',
            montoRD: 30000,
          }),
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.ordenesCompra).toHaveLength(2)

      // Verificar que solo tiene las OCs correctas
      const ocIdsEnRespuesta = data.data.ordenesCompra.map(
        (rel: any) => rel.ocChina.id
      )
      expect(ocIdsEnRespuesta).toContain(nuevasOCs[0])
      expect(ocIdsEnRespuesta).toContain(nuevasOCs[1])
      expect(ocIdsEnRespuesta).not.toContain(testOCIds[2])
    })

    it('debe actualizar el monto del gasto', async () => {
      const nuevoMonto = 45000

      const response = await fetch(
        `http://localhost:3000/api/gastos-logisticos/${testGastoId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ocIds: testOCIds.slice(0, 2),
            fechaGasto: new Date().toISOString(),
            tipoGasto: 'Flete Marítimo',
            metodoPago: 'Transferencia',
            montoRD: nuevoMonto,
          }),
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(parseFloat(data.data.montoRD)).toBe(nuevoMonto)
    })
  })

  describe('DELETE /api/gastos-logisticos/[id]', () => {
    it('debe eliminar el gasto (soft delete)', async () => {
      const response = await fetch(
        `http://localhost:3000/api/gastos-logisticos/${testGastoId}`,
        {
          method: 'DELETE',
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)

      // Verificar que ya no aparece en el listado
      const listResponse = await fetch('http://localhost:3000/api/gastos-logisticos')
      const listData = await listResponse.json()

      const gastoEliminado = listData.data.find((g: any) => g.id === testGastoId)
      expect(gastoEliminado).toBeUndefined()
    })
  })
})
