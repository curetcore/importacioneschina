"use client"

import { ReactNode, useState } from "react"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"

interface Column {
  key: string
  header: string
  minWidth?: string
  align?: "left" | "center" | "right"
  sortable?: boolean
  render?: (value: any, row: any) => ReactNode
}

interface AirtableTableProps {
  columns: Column[]
  data: any[]
  onRowClick?: (row: any) => void
  minWidth?: string
}

export function AirtableTable({ columns, data, onRowClick, minWidth = "1200px" }: AirtableTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1
    }
    return 0
  })

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown size={14} className="text-gray-400" />
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} className="text-blue-600" />
    ) : (
      <ChevronDown size={14} className="text-blue-600" />
    )
  }

  return (
    <div className="overflow-x-auto airtable-table-container">
      <table className="airtable-table" style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`airtable-th ${column.align || "left"} ${column.sortable ? "sortable" : ""}`}
                style={{ minWidth: column.minWidth }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="airtable-th-content">
                  <span>{column.header}</span>
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`airtable-tr ${onRowClick ? "clickable" : ""}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`airtable-td ${column.align || "left"}`}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Componentes auxiliares para badges y estados
export function TableBadge({
  children,
  variant = "default"
}: {
  children: ReactNode
  variant?: "default" | "success" | "warning" | "error" | "info"
}) {
  const variants = {
    default: "bg-gray-100 text-gray-700 border-gray-200",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${variants[variant]}`}>
      {children}
    </span>
  )
}

export function TableStatusDot({
  status
}: {
  status: "active" | "inactive" | "pending" | "completed"
}) {
  const colors = {
    active: "bg-green-500",
    inactive: "bg-gray-400",
    pending: "bg-yellow-500",
    completed: "bg-blue-500",
  }

  const labels = {
    active: "Activo",
    inactive: "Inactivo",
    pending: "Pendiente",
    completed: "Completado",
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span className="text-sm text-gray-700">{labels[status]}</span>
    </div>
  )
}

export function TableCount({ count, variant = "blue" }: { count: number; variant?: "blue" | "green" | "purple" | "orange" }) {
  const variants = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-green-100 text-green-700 border-green-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
  }

  return (
    <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md text-sm font-semibold border ${variants[variant]}`}>
      {count}
    </span>
  )
}
