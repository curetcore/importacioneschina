/**
 * Activity Helpers
 * Mapeos y utilidades para rastrear y mostrar actividad de usuarios
 */

/**
 * Mapeo de rutas a nombres legibles e iconos (lucide-react)
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
    icon: "BarChart3",
    color: "text-blue-600",
  },
  "/ordenes": {
    name: "Órdenes de Compra",
    icon: "ClipboardList",
    color: "text-purple-600",
  },
  "/pagos-china": {
    name: "Pagos China",
    icon: "DollarSign",
    color: "text-green-600",
  },
  "/gastos-logisticos": {
    name: "Gastos Logísticos",
    icon: "Truck",
    color: "text-orange-600",
  },
  "/inventario-recibido": {
    name: "Inventario",
    icon: "Package",
    color: "text-indigo-600",
  },
  "/documentos": {
    name: "Documentos",
    icon: "FileText",
    color: "text-gray-600",
  },
  "/configuracion": {
    name: "Configuración",
    icon: "Settings",
    color: "text-slate-600",
  },
  "/analisis-costos": {
    name: "Análisis de Costos",
    icon: "TrendingUp",
    color: "text-emerald-600",
  },
  "/notificaciones": {
    name: "Notificaciones",
    icon: "Bell",
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
    icon: "Globe",
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
 * Detectar si una ruta contiene un ID de entidad
 */
export function extractEntityId(pathname: string): { type: string; id: string } | null {
  // Patrones para rutas con ID: /ordenes/123, /pagos-china/456, etc.
  const patterns = [
    { regex: /^\/ordenes\/([^/]+)$/, type: "ordenes" },
    { regex: /^\/pagos-china\/([^/]+)$/, type: "pagos-china" },
    { regex: /^\/gastos-logisticos\/([^/]+)$/, type: "gastos-logisticos" },
    { regex: /^\/inventario-recibido\/([^/]+)$/, type: "inventario-recibido" },
  ]

  for (const pattern of patterns) {
    const match = pathname.match(pattern.regex)
    if (match) {
      return { type: pattern.type, id: match[1] }
    }
  }

  return null
}

/**
 * Obtener nombre legible de una entidad desde la API
 */
export async function fetchEntityName(type: string, id: string): Promise<string | null> {
  try {
    const endpoints: Record<string, string> = {
      ordenes: `/api/oc-china/${id}`,
      "pagos-china": `/api/pagos-china/${id}`,
      "gastos-logisticos": `/api/gastos-logisticos/${id}`,
      "inventario-recibido": `/api/inventario-recibido/${id}`,
    }

    const endpoint = endpoints[type]
    if (!endpoint) return null

    const response = await fetch(endpoint)
    if (!response.ok) return null

    const data = await response.json()
    if (!data.success) return null

    // Extraer el nombre según el tipo de entidad
    switch (type) {
      case "ordenes":
        return data.data?.oc || null
      case "pagos-china":
        return data.data?.idPago || null
      case "gastos-logisticos":
        return data.data?.idGasto || null
      case "inventario-recibido":
        return data.data?.item?.sku || null
      default:
        return null
    }
  } catch (error) {
    console.error(`Failed to fetch entity name for ${type}/${id}:`, error)
    return null
  }
}

/**
 * Detectar la acción que está realizando el usuario (Fase 6)
 */
export function detectAction(pathname: string, searchParams?: URLSearchParams): string {
  // Rutas de creación (páginas "nuevo")
  if (
    pathname === "/ordenes/nuevo" ||
    pathname === "/pagos-china/nuevo" ||
    pathname === "/gastos-logisticos/nuevo" ||
    pathname === "/inventario-recibido/nuevo"
  ) {
    return "Creando"
  }

  // Detectar modo edición desde query params
  if (searchParams?.get("mode") === "edit" || searchParams?.get("edit") === "true") {
    return "Editando"
  }

  // Si está viendo una entidad específica, es "Viendo"
  const entityInfo = extractEntityId(pathname)
  if (entityInfo) {
    return "Viendo"
  }

  // Por defecto, está navegando la página
  return "En"
}

/**
 * Tipos de actividad del usuario
 */
export interface UserActivity {
  page: string // Ruta actual: "/ordenes"
  pageName: string // Nombre legible: "Órdenes de Compra"
  pageIcon: string // Ícono lucide-react: "ClipboardList"
  pageColor?: string // Color: "text-purple-600" (opcional)
  entityName?: string // Nombre de entidad: "OC-2024-001"
  action?: string // Fase 6: "Viendo", "Editando", "Creando", "En"
  timestamp: number // Timestamp de última actividad
}
