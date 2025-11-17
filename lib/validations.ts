import { z } from "zod";

// Validador de fecha que no permite fechas futuras
const pastDateValidator = (date: Date) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Permitir fechas de hoy hasta las 11:59:59 PM
  return date <= today;
};

// Schema base para OC (sin items, cantidadOrdenada y costoFOBTotalUSD se calculan desde items)
export const ocChinaSchema = z.object({
  oc: z.string().min(1, "El codigo OC es requerido").optional(), // Opcional en CREATE (autogenerado)
  proveedor: z.string().min(1, "El proveedor es requerido"),
  fechaOC: z.coerce
    .date({
      required_error: "La fecha es requerida",
    })
    .refine(pastDateValidator, {
      message: "La fecha no puede ser futura",
    }),
  descripcionLote: z.string().optional(),
  categoriaPrincipal: z.string().min(1, "La categoria es requerida"),
});

export type OCChinaInput = z.infer<typeof ocChinaSchema>;

export const pagosChinaSchema = z.object({
  idPago: z.string().min(1, "El ID de pago es requerido").optional(), // Opcional en CREATE (autogenerado)
  ocId: z.string().min(1, "La OC es requerida"),
  fechaPago: z.coerce
    .date({
      required_error: "La fecha de pago es requerida",
    })
    .refine(pastDateValidator, {
      message: "La fecha de pago no puede ser futura",
    }),
  tipoPago: z.string().min(1, "El tipo de pago es requerido"),
  metodoPago: z.string().min(1, "El metodo de pago es requerido"),
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
    .nonnegative("La comision no puede ser negativa")
    .default(0),
});

export type PagosChinaInput = z.infer<typeof pagosChinaSchema>;

export const gastosLogisticosSchema = z.object({
  idGasto: z.string().min(1, "El ID de gasto es requerido").optional(), // Opcional en CREATE (autogenerado)
  ocId: z.string().min(1, "La OC es requerida"),
  fechaGasto: z.coerce
    .date({
      required_error: "La fecha del gasto es requerida",
    })
    .refine(pastDateValidator, {
      message: "La fecha del gasto no puede ser futura",
    }),
  tipoGasto: z.string().min(1, "El tipo de gasto es requerido"),
  proveedorServicio: z.string().optional(),
  metodoPago: z.string().min(1, "El metodo de pago es requerido"),
  montoRD: z.coerce
    .number()
    .positive("El monto debe ser mayor a 0"),
  notas: z.string().optional(),
});

export type GastosLogisticosInput = z.infer<typeof gastosLogisticosSchema>;

export const inventarioRecibidoSchema = z.object({
  idRecepcion: z.string().min(1, "El ID de recepcion es requerido").optional(), // Opcional en CREATE (autogenerado)
  ocId: z.string().min(1, "La OC es requerida"),
  itemId: z.string().optional(), // Vincular a producto específico (opcional)
  fechaLlegada: z.coerce
    .date({
      required_error: "La fecha de llegada es requerida",
    })
    .refine(pastDateValidator, {
      message: "La fecha de llegada no puede ser futura",
    }),
  bodegaInicial: z.string().min(1, "La bodega es requerida"),
  cantidadRecibida: z.coerce
    .number()
    .int()
    .positive("La cantidad debe ser mayor a 0"),
  notas: z.string().optional(),
});

export type InventarioRecibidoInput = z.infer<typeof inventarioRecibidoSchema>;

export const tiposPago = [
  "Anticipo",
  "Pago final",
  "Flete",
  "Impuestos",
  "Broker",
  "Otros",
] as const;

export const metodosPago = [
  "Transferencia",
  "Tarjeta de credito",
  "Tarjeta de debito",
  "Efectivo",
  "Cheque",
] as const;

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

export const proveedores = [
  "China 1",
  "China 2",
  "Fabrica X",
  "Otro",
] as const;

export const categorias = [
  "Zapatos",
  "Carteras",
  "Cinturones",
  "Accesorios",
  "Mix",
] as const;

export const bodegas = [
  "Boveda",
  "Piantini",
  "Villa Mella",
  "Oficina",
  "Otra",
] as const;

export const monedas = ["USD", "CNY", "RD$"] as const;

// Schema para Configuración
export const configuracionSchema = z.object({
  categoria: z.string().min(1, "La categoría es requerida"),
  valor: z.string().min(1, "El valor es requerido"),
  orden: z.coerce.number().int().nonnegative("El orden no puede ser negativo").default(0),
});

export type ConfiguracionInput = z.infer<typeof configuracionSchema>;
