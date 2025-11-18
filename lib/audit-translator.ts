/**
 * Servicio para traducir cambios de audit logs a lenguaje natural
 */

/**
 * Mapeo de nombres de campos técnicos a nombres legibles en español
 */
const FIELD_LABELS: Record<string, Record<string, string>> = {
  OCChina: {
    oc: "Número de OC",
    proveedor: "Proveedor",
    categoria_principal: "Categoría principal",
    descripcion_lote: "Descripción del lote",
    fecha_oc: "Fecha de OC",
    fecha_estimada_llegada: "Fecha estimada de llegada",
    total_fob_usd: "Total FOB (USD)",
    total_fob_cny: "Total FOB (CNY)",
    total_piezas: "Total de piezas",
    total_pares: "Total de pares",
    estado_orden: "Estado de la orden",
    notas: "Notas",
    tracking_link: "Link de tracking",
  },
  PagosChina: {
    id_pago: "ID de pago",
    fecha_pago: "Fecha de pago",
    tipo_pago: "Tipo de pago",
    metodo_pago: "Método de pago",
    monto_pagado_usd: "Monto pagado (USD)",
    monto_pagado_cny: "Monto pagado (CNY)",
    tasa_cambio: "Tasa de cambio",
    moneda: "Moneda",
    referencia_transaccion: "Referencia de transacción",
    banco_origen: "Banco origen",
    banco_destino: "Banco destino",
    notas: "Notas",
  },
  GastosLogisticos: {
    id_gasto: "ID de gasto",
    fecha_gasto: "Fecha del gasto",
    tipo_gasto: "Tipo de gasto",
    monto_usd: "Monto (USD)",
    monto_dop: "Monto (DOP)",
    proveedor_servicio: "Proveedor del servicio",
    descripcion: "Descripción",
    factura_numero: "Número de factura",
    notas: "Notas",
  },
  InventarioRecibido: {
    id_recepcion: "ID de recepción",
    fecha_recepcion: "Fecha de recepción",
    bodega_inicial: "Bodega inicial",
    total_piezas_recibidas: "Total de piezas recibidas",
    total_pares_recibidos: "Total de pares recibidos",
    estado_inspeccion: "Estado de inspección",
    notas: "Notas",
  },
  Proveedor: {
    codigo: "Código",
    nombre: "Nombre",
    contacto_principal: "Contacto principal",
    email: "Email",
    telefono: "Teléfono",
    whatsapp: "WhatsApp",
    wechat: "WeChat",
    direccion: "Dirección",
    ciudad: "Ciudad",
    provincia: "Provincia",
    pais: "País",
    categoria_productos: "Categoría de productos",
    calificacion: "Calificación",
    notas: "Notas",
    activo: "Activo",
  },
}

/**
 * Obtener label legible para un campo
 */
function getFieldLabel(entidad: string, field: string): string {
  return FIELD_LABELS[entidad]?.[field] || field
}

/**
 * Formatear valor según su tipo
 */
function formatValue(value: any, field: string): string {
  if (value === null || value === undefined) {
    return "Sin especificar"
  }

  // Fechas
  if (field.includes("fecha") || field.includes("date")) {
    try {
      const date = new Date(value)
      return date.toLocaleDateString("es-DO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return String(value)
    }
  }

  // Montos
  if (field.includes("monto") || field.includes("total") || field.includes("precio")) {
    if (typeof value === "number") {
      return new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: field.includes("usd") ? "USD" : field.includes("cny") ? "CNY" : "DOP",
        minimumFractionDigits: 2,
      }).format(value)
    }
  }

  // Booleanos
  if (typeof value === "boolean") {
    return value ? "Sí" : "No"
  }

  // Números
  if (typeof value === "number") {
    return new Intl.NumberFormat("es-DO").format(value)
  }

  // Arrays
  if (Array.isArray(value)) {
    return value.join(", ")
  }

  // Objetos
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

/**
 * Interfaz para un cambio traducido
 */
export interface TranslatedChange {
  field: string
  label: string
  before: string
  after: string
  beforeRaw: any
  afterRaw: any
}

/**
 * Traducir cambios de un audit log a lenguaje natural
 */
export function translateAuditChanges(
  entidad: string,
  before: Record<string, any> | null,
  after: Record<string, any> | null,
  modifiedFields?: string[]
): TranslatedChange[] {
  const changes: TranslatedChange[] = []

  // Si solo tenemos "after" (CREATE)
  if (!before && after) {
    const fieldsToShow = modifiedFields || Object.keys(after).filter(key => !key.includes("id"))

    fieldsToShow.forEach(field => {
      if (after[field] !== null && after[field] !== undefined) {
        changes.push({
          field,
          label: getFieldLabel(entidad, field),
          before: "",
          after: formatValue(after[field], field),
          beforeRaw: null,
          afterRaw: after[field],
        })
      }
    })

    return changes
  }

  // Si solo tenemos "before" (DELETE)
  if (before && !after) {
    const fieldsToShow = modifiedFields || Object.keys(before).filter(key => !key.includes("id"))

    fieldsToShow.forEach(field => {
      if (before[field] !== null && before[field] !== undefined) {
        changes.push({
          field,
          label: getFieldLabel(entidad, field),
          before: formatValue(before[field], field),
          after: "",
          beforeRaw: before[field],
          afterRaw: null,
        })
      }
    })

    return changes
  }

  // Si tenemos ambos (UPDATE)
  if (before && after) {
    const fieldsToCheck = modifiedFields || Object.keys(after)

    fieldsToCheck.forEach(field => {
      const beforeValue = before[field]
      const afterValue = after[field]

      // Solo incluir si realmente cambió
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changes.push({
          field,
          label: getFieldLabel(entidad, field),
          before: formatValue(beforeValue, field),
          after: formatValue(afterValue, field),
          beforeRaw: beforeValue,
          afterRaw: afterValue,
        })
      }
    })

    return changes
  }

  return changes
}

/**
 * Generar frase descriptiva para una acción
 */
export function getActionPhrase(accion: string, entidad: string, userName?: string): string {
  const entityNames: Record<string, string> = {
    OCChina: "la orden de compra",
    PagosChina: "el pago",
    GastosLogisticos: "el gasto logístico",
    InventarioRecibido: "el inventario",
    Proveedor: "el proveedor",
  }

  const entityName = entityNames[entidad] || entidad
  const user = userName || "Un usuario"

  const actions: Record<string, string> = {
    CREATE: `${user} creó ${entityName}`,
    UPDATE: `${user} modificó ${entityName}`,
    DELETE: `${user} eliminó ${entityName}`,
    RESTORE: `${user} restauró ${entityName}`,
  }

  return actions[accion] || `${user} realizó una acción en ${entityName}`
}

/**
 * Generar resumen de cambios en texto
 */
export function generateChangeSummary(changes: TranslatedChange[]): string {
  if (changes.length === 0) {
    return "No se detectaron cambios"
  }

  if (changes.length === 1) {
    const change = changes[0]
    if (!change.before) {
      return `Se estableció ${change.label.toLowerCase()} como "${change.after}"`
    }
    if (!change.after) {
      return `Se eliminó ${change.label.toLowerCase()}`
    }
    return `Se cambió ${change.label.toLowerCase()} de "${change.before}" a "${change.after}"`
  }

  return `Se modificaron ${changes.length} campos`
}
