/**
 * Paleta de colores profesional para gráficas
 * Diseñada para ser accesible, distinguible y profesional
 */

// Paleta principal - Moderna y vibrante
export const CHART_COLORS = [
  "#2563EB", // Azul vibrante (primary)
  "#10B981", // Verde esmeralda
  "#F59E0B", // Ámbar
  "#EF4444", // Rojo coral
  "#8B5CF6", // Púrpura
  "#06B6D4", // Cyan
  "#EC4899", // Rosa
  "#F97316", // Naranja
]

// Paleta alternativa - Tonos tierra profesionales
export const CHART_COLORS_ALT = [
  "#0EA5E9", // Azul cielo
  "#14B8A6", // Teal
  "#F59E0B", // Ámbar
  "#F97316", // Naranja
  "#8B5CF6", // Violeta
  "#EC4899", // Rosa
  "#64748B", // Gris azulado
  "#EF4444", // Rojo
]

// Paleta para gráficas de barras (tonos más oscuros)
export const BAR_COLORS = {
  primary: "#1E40AF", // Azul oscuro
  secondary: "#059669", // Verde oscuro
  tertiary: "#D97706", // Ámbar oscuro
  quaternary: "#DC2626", // Rojo oscuro
}

// Paleta monocromática para datos progresivos
export const GRADIENT_COLORS = {
  blue: ["#DBEAFE", "#93C5FD", "#3B82F6", "#1D4ED8", "#1E3A8A"],
  green: ["#D1FAE5", "#6EE7B7", "#10B981", "#059669", "#065F46"],
  amber: ["#FEF3C7", "#FCD34D", "#F59E0B", "#D97706", "#92400E"],
  red: ["#FEE2E2", "#FCA5A5", "#EF4444", "#DC2626", "#991B1B"],
}

// Colores específicos por categoría
export const CATEGORY_COLORS = {
  financial: "#2563EB", // Azul para finanzas
  logistics: "#10B981", // Verde para logística
  inventory: "#F59E0B", // Ámbar para inventario
  payments: "#8B5CF6", // Púrpura para pagos
  expenses: "#EF4444", // Rojo para gastos
  suppliers: "#06B6D4", // Cyan para proveedores
}

// Función auxiliar para obtener color por índice
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}

// Función para obtener colores con opacidad
export function getChartColorWithOpacity(index: number, opacity: number): string {
  const color = CHART_COLORS[index % CHART_COLORS.length]
  const hex = color.replace("#", "")
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
