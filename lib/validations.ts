import { z } from "zod";

// ==========================================
// Esquemas de Validación con Zod
// ==========================================

/**
 * Esquema para OC China
 */
export const ocChinaSchema = z.object({
  oc: z.string().min(1, "El código OC es requerido"),
  proveedor: z.string().min(1, "El proveedor es requerido"),
  fechaOC: z.coerce.date({
    required_error: "La fecha es requerida",
  }),
  descripcionLote: z.string().optional(),
  categoriaPrincipal: z.string().min(1, "La categoría es requerida"),
  cantidadOrdenada: z.coerce
    .number()
    .int()
    .positive("La cantidad debe ser mayor a 0"),
  costoFOBTotalUSD: z.coerce
    .number()
    .positive("El costo FOB debe ser mayor a 0"),
});

export type OCChinaInput = z.infer<typeof ocChinaSchema>;

/**
 * Esquema para Pagos China
 */
export const pagosChinaSchema = z.object({
  idPago: z.string().min(1, "El ID de pago es requerido"),
  ocId: z.string().min(1, "La OC es requerida"),
  fechaPago: z.coerce.date({
    required_error: "La fecha de pago es requerida",
  }),
  tipoPago: z.string().min(1, "El tipo de pago es requerido"),
  metodoPago: z.string().min(1, "El método de pago es requerido"),
  moneda: z.enum(["USD", "CNY", "RD$"], {
    required_error: "La moneda es requerida",
  }),
  montoOriginal: z.coerce
    .number()
    .positive("El monto debe ser mayor a 0"),
  tasaCambio: z.coerce
    .number()
    .positive("La tasa de cambio debe ser mayor a 0")
    .default(1),
  comisionBancoRD: z.coerce
    .number()
    .nonnegative("La comisión no puede ser negativa")
    .default(0),
});

export type PagosChinaInput = z.infer<typeof pagosChinaSchema>;

/**
 * Esquema para Gastos Logísticos
 */
export const gastosLogisticosSchema = z.object({
  idGasto: z.string().min(1, "El ID de gasto es requerido"),
  ocId: z.string().min(1, "La OC es requerida"),
  fechaGasto: z.coerce.date({
    required_error: "La fecha del gasto es requerida",
  }),
  tipoGasto: z.string().min(1, "El tipo de gasto es requerido"),
  proveedorServicio: z.string().optional(),
  montoRD: z.coerce
    .number()
    .positive("El monto debe ser mayor a 0"),
  notas: z.string().optional(),
});

export type GastosLogisticosInput = z.infer<typeof gastosLogisticosSchema>;

/**
 * Esquema para Inventario Recibido
 */
export const inventarioRecibidoSchema = z.object({
  idRecepcion: z.string().min(1, "El ID de recepción es requerido"),
  ocId: z.string().min(1, "La OC es requerida"),
  fechaLlegada: z.coerce.date({
    required_error: "La fecha de llegada es requerida",
  }),
  bodegaInicial: z.string().min(1, "La bodega es requerida"),
  cantidadRecibida: z.coerce
    .number()
    .int()
    .positive("La cantidad debe ser mayor a 0"),
  notas: z.string().optional(),
});

export type InventarioRecibidoInput = z.infer<typeof inventarioRecibidoSchema>;

/**
 * Opciones para tipos de pago
 */
export const tiposPago = [
  "Anticipo",
  "Pago final",
  "Flete",
  "Impuestos",
  "Broker",
  "Otros",
] as const;

/**
 * Opciones para métodos de pago
 */
export const metodosPago = [
  "Transferencia",
  "Tarjeta de crédito",
  "Tarjeta de débito",
  "Efectivo",
  "Cheque",
] as const;

/**
 * Opciones para tipos de gasto
 */
export const tiposGasto = [
  "Flete internacional",
  "Seguro",
  "Aduana / DGA",
  "Impuestos",
  "Broker",
  "Almacenaje",
  "Transporte local",
  "Otros",
] as const;

/**
 * Opciones para proveedores
 */
export const proveedores = [
  "China 1",
  "China 2",
  "Fábrica X",
  "Otro",
] as const;

/**
 * Opciones para categorías
 */
export const categorias = [
  "Zapatos",
  "Carteras",
  "Cinturones",
  "Accesorios",
  "Mix",
] as const;

/**
 * Opciones para bodegas
 */
export const bodegas = [
  "Bóveda",
  "Piantini",
  "Villa Mella",
  "Oficina",
  "Otra",
] as const;

/**
 * Opciones para monedas
 */
export const monedas = ["USD", "CNY", "RD$"] as const;
