import { z } from "zod"

export const proveedorSchema = z.object({
  codigo: z.string().optional(), // Auto-generado si no se proporciona
  nombre: z.string().min(1, "El nombre es requerido"),

  // Información de contacto
  contactoPrincipal: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional(),
  whatsapp: z.string().optional(),
  wechat: z.string().optional(),

  // Ubicación
  pais: z.string().default("China"),
  ciudad: z.string().optional(),
  direccion: z.string().optional(),

  // Información comercial
  sitioWeb: z.string().url("URL inválida").optional().or(z.literal("")),
  categoriaProductos: z.string().optional(),
  tiempoEntregaDias: z.number().int().min(1).optional(),
  monedaPreferida: z.enum(["USD", "CNY", "EUR"]).default("USD"),

  // Términos comerciales
  terminosPago: z.string().optional(),
  minimoOrden: z.number().min(0).optional(),

  // Notas y calificación
  notas: z.string().optional(),
  calificacion: z.number().int().min(0).max(5).default(0),

  // Estado
  activo: z.boolean().default(true),
})

export const updateProveedorSchema = proveedorSchema.partial()

export type ProveedorInput = z.infer<typeof proveedorSchema>
export type UpdateProveedorInput = z.infer<typeof updateProveedorSchema>
