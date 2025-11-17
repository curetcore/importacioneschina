import {
  ocChinaSchema,
  pagosChinaSchema,
  gastosLogisticosSchema,
  inventarioRecibidoSchema,
} from '../validations'

describe('Schemas de Validación Zod', () => {
  describe('ocChinaSchema', () => {
    it('debe validar OC correcta', () => {
      const validData = {
        oc: 'OC-001',
        proveedor: 'Proveedor Test',
        fechaOC: new Date('2024-01-15'),
        categoriaPrincipal: 'Ropa',
      }

      const result = ocChinaSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe rechazar proveedor vacío', () => {
      const invalidData = {
        proveedor: '',
        fechaOC: new Date('2024-01-15'),
        categoriaPrincipal: 'Ropa',
      }

      const result = ocChinaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('proveedor')
      }
    })

    it('debe rechazar categoría vacía', () => {
      const invalidData = {
        proveedor: 'Proveedor Test',
        fechaOC: new Date('2024-01-15'),
        categoriaPrincipal: '',
      }

      const result = ocChinaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('categoria')
      }
    })

    it('debe rechazar fechas futuras', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const invalidData = {
        proveedor: 'Proveedor Test',
        fechaOC: futureDate,
        categoriaPrincipal: 'Ropa',
      }

      const result = ocChinaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('futura')
      }
    })

    it('debe permitir fecha de hoy', () => {
      const today = new Date()

      const validData = {
        proveedor: 'Proveedor Test',
        fechaOC: today,
        categoriaPrincipal: 'Ropa',
      }

      const result = ocChinaSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe permitir descripcionLote opcional', () => {
      const validData = {
        proveedor: 'Proveedor Test',
        fechaOC: new Date('2024-01-15'),
        categoriaPrincipal: 'Ropa',
        descripcionLote: 'Lote de invierno 2024',
      }

      const result = ocChinaSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('pagosChinaSchema', () => {
    it('debe validar pago correcto en USD', () => {
      const validData = {
        idPago: 'PAGO-001',
        ocId: 'oc-123',
        fechaPago: new Date('2024-01-15'),
        tipoPago: 'Anticipo',
        metodoPago: 'Transferencia',
        moneda: 'USD',
        montoOriginal: 1000,
        tasaCambio: 60,
        comisionBancoRD: 500,
      }

      const result = pagosChinaSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe validar pago en RD$ sin tasa de cambio', () => {
      const validData = {
        ocId: 'oc-123',
        fechaPago: new Date('2024-01-15'),
        tipoPago: 'Anticipo',
        metodoPago: 'Efectivo',
        moneda: 'RD$',
        montoOriginal: 50000,
        tasaCambio: 1,
        comisionBancoRD: 0,
      }

      const result = pagosChinaSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe rechazar monto original negativo', () => {
      const invalidData = {
        ocId: 'oc-123',
        fechaPago: new Date('2024-01-15'),
        tipoPago: 'Anticipo',
        metodoPago: 'Transferencia',
        moneda: 'USD',
        montoOriginal: -1000,
        tasaCambio: 60,
      }

      const result = pagosChinaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mayor a 0')
      }
    })

    it('debe rechazar monto original en cero', () => {
      const invalidData = {
        ocId: 'oc-123',
        fechaPago: new Date('2024-01-15'),
        tipoPago: 'Anticipo',
        metodoPago: 'Transferencia',
        moneda: 'USD',
        montoOriginal: 0,
        tasaCambio: 60,
      }

      const result = pagosChinaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mayor a 0')
      }
    })

    it('debe rechazar tasa de cambio negativa', () => {
      const invalidData = {
        ocId: 'oc-123',
        fechaPago: new Date('2024-01-15'),
        tipoPago: 'Anticipo',
        metodoPago: 'Transferencia',
        moneda: 'USD',
        montoOriginal: 1000,
        tasaCambio: -60,
      }

      const result = pagosChinaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('tasa de cambio')
      }
    })

    it('debe rechazar tasa de cambio en cero', () => {
      const invalidData = {
        ocId: 'oc-123',
        fechaPago: new Date('2024-01-15'),
        tipoPago: 'Anticipo',
        metodoPago: 'Transferencia',
        moneda: 'USD',
        montoOriginal: 1000,
        tasaCambio: 0,
      }

      const result = pagosChinaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe rechazar comisión negativa', () => {
      const invalidData = {
        ocId: 'oc-123',
        fechaPago: new Date('2024-01-15'),
        tipoPago: 'Anticipo',
        metodoPago: 'Transferencia',
        moneda: 'USD',
        montoOriginal: 1000,
        tasaCambio: 60,
        comisionBancoRD: -100,
      }

      const result = pagosChinaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('comision')
      }
    })

    it('debe permitir comisión en cero', () => {
      const validData = {
        ocId: 'oc-123',
        fechaPago: new Date('2024-01-15'),
        tipoPago: 'Anticipo',
        metodoPago: 'Transferencia',
        moneda: 'USD',
        montoOriginal: 1000,
        tasaCambio: 60,
        comisionBancoRD: 0,
      }

      const result = pagosChinaSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe rechazar moneda inválida', () => {
      const invalidData = {
        ocId: 'oc-123',
        fechaPago: new Date('2024-01-15'),
        tipoPago: 'Anticipo',
        metodoPago: 'Transferencia',
        moneda: 'EUR',
        montoOriginal: 1000,
        tasaCambio: 60,
      }

      const result = pagosChinaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe aceptar las 3 monedas válidas', () => {
      const monedas = ['USD', 'CNY', 'RD$']

      monedas.forEach((moneda) => {
        const validData = {
          ocId: 'oc-123',
          fechaPago: new Date('2024-01-15'),
          tipoPago: 'Anticipo',
          metodoPago: 'Transferencia',
          moneda,
          montoOriginal: 1000,
          tasaCambio: 60,
        }

        const result = pagosChinaSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('debe rechazar fechas futuras en pagos', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const invalidData = {
        ocId: 'oc-123',
        fechaPago: futureDate,
        tipoPago: 'Anticipo',
        metodoPago: 'Transferencia',
        moneda: 'USD',
        montoOriginal: 1000,
        tasaCambio: 60,
      }

      const result = pagosChinaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('futura')
      }
    })

    it('debe usar valor default para tasaCambio si no se provee', () => {
      const data = {
        ocId: 'oc-123',
        fechaPago: new Date('2024-01-15'),
        tipoPago: 'Anticipo',
        metodoPago: 'Transferencia',
        moneda: 'USD',
        montoOriginal: 1000,
      }

      const result = pagosChinaSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tasaCambio).toBe(1)
      }
    })

    it('debe usar valor default para comisionBancoRD si no se provee', () => {
      const data = {
        ocId: 'oc-123',
        fechaPago: new Date('2024-01-15'),
        tipoPago: 'Anticipo',
        metodoPago: 'Transferencia',
        moneda: 'USD',
        montoOriginal: 1000,
        tasaCambio: 60,
      }

      const result = pagosChinaSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.comisionBancoRD).toBe(0)
      }
    })
  })

  describe('gastosLogisticosSchema', () => {
    it('debe validar gasto logístico correcto', () => {
      const validData = {
        idGasto: 'GASTO-001',
        ocId: 'oc-123',
        fechaGasto: new Date('2024-01-15'),
        tipoGasto: 'Transporte',
        metodoPago: 'Transferencia',
        montoRD: 5000,
        notas: 'Transporte desde puerto',
      }

      const result = gastosLogisticosSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe rechazar monto negativo', () => {
      const invalidData = {
        ocId: 'oc-123',
        fechaGasto: new Date('2024-01-15'),
        tipoGasto: 'Transporte',
        metodoPago: 'Transferencia',
        montoRD: -5000,
      }

      const result = gastosLogisticosSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mayor a 0')
      }
    })

    it('debe rechazar monto en cero', () => {
      const invalidData = {
        ocId: 'oc-123',
        fechaGasto: new Date('2024-01-15'),
        tipoGasto: 'Transporte',
        metodoPago: 'Transferencia',
        montoRD: 0,
      }

      const result = gastosLogisticosSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe permitir proveedorServicio y notas opcionales', () => {
      const validData = {
        ocId: 'oc-123',
        fechaGasto: new Date('2024-01-15'),
        tipoGasto: 'Transporte',
        metodoPago: 'Transferencia',
        montoRD: 5000,
      }

      const result = gastosLogisticosSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe rechazar fechas futuras', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const invalidData = {
        ocId: 'oc-123',
        fechaGasto: futureDate,
        tipoGasto: 'Transporte',
        metodoPago: 'Transferencia',
        montoRD: 5000,
      }

      const result = gastosLogisticosSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('futura')
      }
    })
  })

  describe('inventarioRecibidoSchema', () => {
    it('debe validar recepción de inventario correcta', () => {
      const validData = {
        idRecepcion: 'RECEP-001',
        ocId: 'oc-123',
        itemId: 'item-456',
        fechaLlegada: new Date('2024-01-15'),
        bodegaInicial: 'Bodega Principal',
        cantidadRecibida: 100,
        notas: 'Recepción completa',
      }

      const result = inventarioRecibidoSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe rechazar cantidad negativa', () => {
      const invalidData = {
        ocId: 'oc-123',
        fechaLlegada: new Date('2024-01-15'),
        bodegaInicial: 'Bodega Principal',
        cantidadRecibida: -10,
      }

      const result = inventarioRecibidoSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mayor a 0')
      }
    })

    it('debe rechazar cantidad en cero', () => {
      const invalidData = {
        ocId: 'oc-123',
        fechaLlegada: new Date('2024-01-15'),
        bodegaInicial: 'Bodega Principal',
        cantidadRecibida: 0,
      }

      const result = inventarioRecibidoSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe rechazar cantidad decimal (no entero)', () => {
      const invalidData = {
        ocId: 'oc-123',
        fechaLlegada: new Date('2024-01-15'),
        bodegaInicial: 'Bodega Principal',
        cantidadRecibida: 10.5,
      }

      const result = inventarioRecibidoSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe aceptar cantidad entera', () => {
      const validData = {
        ocId: 'oc-123',
        fechaLlegada: new Date('2024-01-15'),
        bodegaInicial: 'Bodega Principal',
        cantidadRecibida: 100,
      }

      const result = inventarioRecibidoSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe rechazar bodega vacía', () => {
      const invalidData = {
        ocId: 'oc-123',
        fechaLlegada: new Date('2024-01-15'),
        bodegaInicial: '',
        cantidadRecibida: 100,
      }

      const result = inventarioRecibidoSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('bodega')
      }
    })

    it('debe permitir itemId opcional', () => {
      const validData = {
        ocId: 'oc-123',
        fechaLlegada: new Date('2024-01-15'),
        bodegaInicial: 'Bodega Principal',
        cantidadRecibida: 100,
      }

      const result = inventarioRecibidoSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe rechazar fechas futuras', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const invalidData = {
        ocId: 'oc-123',
        fechaLlegada: futureDate,
        bodegaInicial: 'Bodega Principal',
        cantidadRecibida: 100,
      }

      const result = inventarioRecibidoSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('futura')
      }
    })
  })
})
