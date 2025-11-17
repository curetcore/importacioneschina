import * as XLSX from "xlsx"

/**
 * Exporta datos a un archivo Excel (.xlsx)
 * @param data - Array de objetos con los datos a exportar
 * @param filename - Nombre del archivo sin extensión
 * @param sheetName - Nombre de la hoja (opcional, default: "Datos")
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = "Datos"
): void {
  if (data.length === 0) {
    console.warn("No hay datos para exportar")
    return
  }

  // Crear hoja de cálculo desde los datos
  const worksheet = XLSX.utils.json_to_sheet(data)

  // Ajustar ancho de columnas automáticamente
  const maxWidth = 50
  const columnWidths = Object.keys(data[0]).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => String(row[key] || "").length)
    )
    return { wch: Math.min(maxLength + 2, maxWidth) }
  })
  worksheet["!cols"] = columnWidths

  // Crear libro de trabajo y agregar la hoja
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Generar y descargar el archivo
  const timestamp = new Date().toISOString().split("T")[0]
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`)
}

/**
 * Formatea un valor para exportación (convierte null/undefined a string vacío)
 */
export function formatExportValue(value: any): string | number {
  if (value === null || value === undefined) return ""
  if (typeof value === "object") return JSON.stringify(value)
  return value
}
