import { z } from "zod"

export const metodoPagoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  tipo: z.enum(["banco", "tarjeta", "monedero_digital"], {
    errorMap: () => ({ message: "Tipo debe ser: banco, tarjeta o monedero_digital" }),
  }),

  // Proveedor asociado (opcional)
  proveedorId: z.string().optional(),

  // Información específica del método
  moneda: z.enum(["USD", "CNY", "EUR", "DOP"], {
    errorMap: () => ({ message: "Moneda debe ser: USD, CNY, EUR o DOP" }),
  }),

  // Datos bancarios
  banco: z.string().optional(),
  numeroCuenta: z.string().optional(),
  titular: z.string().optional(),
  swift: z.string().optional(),
  iban: z.string().optional(),

  // Datos de tarjeta
  ultimos4Digitos: z.string().length(4, "Debe tener 4 dígitos").optional().or(z.literal("")),
  tipoTarjeta: z.enum(["credito", "debito"]).optional(),

  // Datos de monedero digital
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional(),
  idCuenta: z.string().optional(),

  // Límites y comisiones
  limiteTransaccion: z.number().min(0).optional(),
  comisionPorcentaje: z.number().min(0).max(100).optional(),
  comisionFija: z.number().min(0).optional(),

  // Balance actual
  balanceActual: z.number().optional(),

  // Notas
  notas: z.string().optional(),

  // Estado
  activo: z.boolean().default(true),
})

export const updateMetodoPagoSchema = metodoPagoSchema.partial()

export type MetodoPagoInput = z.infer<typeof metodoPagoSchema>
export type UpdateMetodoPagoInput = z.infer<typeof updateMetodoPagoSchema>
