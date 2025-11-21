/**
 * Activity Helpers
 * Mapeos y utilidades para rastrear y mostrar actividad de usuarios
 */

/**
 * Mapeo de rutas a nombres legibles y emojis
 */
export const PAGE_CONFIG: Record<
  string,
  {
    name: string
    icon: string
    color: string
  }
> = {
  "/dashboard": {
    name: "Dashboard",
    icon: "📊",
    color: "text-blue-600",
  },
  "/ordenes": {
    name: "Órdenes de Compra",
    icon: "📋",
    color: "text-purple-600",
  },
  "/pagos-china": {
    name: "Pagos China",
    icon: "💰",
    color: "text-green-600",
  },
  "/gastos-logisticos": {
    name: "Gastos Logísticos",
    icon: "🚚",
    color: "text-orange-600",
  },
  "/inventario-recibido": {
    name: "Inventario",
    icon: "📦",
    color: "text-indigo-600",
  },
  "/documentos": {
    name: "Documentos",
    icon: "📄",
    color: "text-gray-600",
  },
  "/configuracion": {
    name: "Configuración",
    icon: "⚙️",
    color: "text-slate-600",
  },
  "/analisis-costos": {
    name: "Análisis de Costos",
    icon: "💹",
    color: "text-emerald-600",
  },
  "/notificaciones": {
    name: "Notificaciones",
    icon: "🔔",
    color: "text-yellow-600",
  },
}

/**
 * Obtener configuración de página desde una ruta
 */
export function getPageConfig(pathname: string): {
  name: string
  icon: string
  color: string
} {
  // Buscar coincidencia exacta
  if (PAGE_CONFIG[pathname]) {
    return PAGE_CONFIG[pathname]
  }

  // Buscar coincidencia por prefijo (para rutas con ID como /ordenes/123)
  const baseRoute = Object.keys(PAGE_CONFIG).find(route => pathname.startsWith(route))

  if (baseRoute) {
    return PAGE_CONFIG[baseRoute]
  }

  // Fallback para rutas no mapeadas
  return {
    name: "Navegando",
    icon: "🌐",
    color: "text-gray-500",
  }
}

/**
 * Formatear actividad para mostrar
 */
export function formatActivity(pathname: string, entityName?: string): string {
  const config = getPageConfig(pathname)

  if (entityName) {
    return `${config.icon} Viendo ${entityName}`
  }

  return `${config.icon} En ${config.name}`
}

/**
 * Tipos de actividad del usuario
 */
export interface UserActivity {
  page: string // Ruta actual: "/ordenes"
  pageName: string // Nombre legible: "Órdenes de Compra"
  pageIcon: string // Emoji: "📋"
  pageColor: string // Color: "text-purple-600"
  entityName?: string // Nombre de entidad: "OC-2024-001"
  timestamp: number // Timestamp de última actividad
}
