import { z } from "zod"
import type { InputJsonValue } from "@prisma/client/runtime/library"

export const productoSchema = z.object({
  sku: z.string().min(1, "El SKU es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),

  // Proveedor
  proveedorId: z.string().optional(),

  // Descripción
  descripcion: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  categoria: z.string().optional(),

  // Precios de referencia
  precioReferenciaUSD: z.number().min(0).optional(),
  precioReferenciaCNY: z.number().min(0).optional(),

  // Especificaciones
  especificaciones: z.string().optional(),
  tallasDisponibles: z.any().optional(), // JSON field

  // Imágenes
  imagenPrincipal: z.string().url("URL inválida").optional().or(z.literal("")),
  imagenesAdicionales: z.any().optional(), // JSON field
  fichatecnica: z.string().url("URL inválida").optional().or(z.literal("")),

  // Estado
  activo: z.boolean().default(true),
})

export const updateProductoSchema = productoSchema.partial()

export type ProductoInput = z.infer<typeof productoSchema>
export type UpdateProductoInput = z.infer<typeof updateProductoSchema>

// Helper para validar y convertir tallasDisponibles
export function validarTallasDisponibles(tallas: unknown): InputJsonValue | undefined {
  if (!tallas) return undefined
  if (typeof tallas === "string") {
    try {
      tallas = JSON.parse(tallas)
    } catch {
      return undefined
    }
  }
  if (Array.isArray(tallas) || (typeof tallas === "object" && tallas !== null)) {
    return tallas as InputJsonValue
  }
  return undefined
}

// Helper para validar y convertir imagenesAdicionales
export function validarImagenesAdicionales(imagenes: unknown): InputJsonValue | undefined {
  if (!imagenes) return undefined
  if (typeof imagenes === "string") {
    try {
      imagenes = JSON.parse(imagenes)
    } catch {
      return undefined
    }
  }
  if (Array.isArray(imagenes)) {
    return imagenes as InputJsonValue
  }
  return undefined
}
