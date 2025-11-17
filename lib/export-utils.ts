import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

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
  const columnWidths = Object.keys(data[0]).map(key => {
    const maxLength = Math.max(key.length, ...data.map(row => String(row[key] || "").length))
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

/**
 * Exporta datos a un archivo PDF con tabla profesional
 * @param data - Array de objetos con los datos a exportar
 * @param filename - Nombre del archivo sin extensión
 * @param title - Título del reporte (opcional)
 * @param orientation - Orientación del PDF: 'portrait' o 'landscape' (default: 'landscape')
 */
export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  filename: string,
  title?: string,
  orientation: "portrait" | "landscape" = "landscape"
): void {
  if (data.length === 0) {
    console.warn("No hay datos para exportar")
    return
  }

  // Crear documento PDF
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  })

  // Agregar título si existe
  if (title) {
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text(title, 14, 15)
  }

  // Extraer headers y datos
  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header]
      if (value === null || value === undefined) return ""
      if (typeof value === "object") return JSON.stringify(value)
      return String(value)
    })
  )

  // Generar tabla con autoTable
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? 22 : 10,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue-500
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // Gray-50
    },
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    theme: "striped",
  })

  // Agregar footer con fecha y página
  const pageCount = (doc as any).internal.getNumberOfPages()
  const timestamp = new Date().toLocaleString("es-DO")

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)

    // Footer izquierdo: fecha
    doc.text(`Generado: ${timestamp}`, 14, doc.internal.pageSize.height - 10)

    // Footer derecho: página
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width - 14,
      doc.internal.pageSize.height - 10,
      { align: "right" }
    )
  }

  // Generar y descargar el archivo
  const fileTimestamp = new Date().toISOString().split("T")[0]
  doc.save(`${filename}_${fileTimestamp}.pdf`)
}
