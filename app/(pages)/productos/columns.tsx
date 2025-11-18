"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X, Pencil } from "lucide-react"
import { useState } from "react"

export type ProductoRow = {
  sku: string
  nombre: string
  cantidadTotal: number
  numeroTallas: number
  tallas: { talla: string; cantidad: number }[]
  costoPromedioCompra: number
  costoTotalCompra: number
  precioVenta: number | null
  gananciaPorUnidad: number | null
  gananciaPorcentaje: number | null
  gananciaTotalEstimada: number | null
}

type ColumnOptions = {
  onPrecioVentaChange: (sku: string, precioVenta: number | null) => Promise<void>
  onTallasClick: (producto: ProductoRow) => void
}

// Componente de celda editable para precio de venta
function EditablePrecioVenta({
  sku,
  value,
  onChange,
}: {
  sku: string
  value: number | null
  onChange: (sku: string, precioVenta: number | null) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value?.toString() || "")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const precio = inputValue.trim() === "" ? null : parseFloat(inputValue)
      await onChange(sku, precio)
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving precio venta:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setInputValue(value?.toString() || "")
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          className="h-7 w-24 text-xs"
          autoFocus
          onKeyDown={e => {
            if (e.key === "Enter") handleSave()
            if (e.key === "Escape") handleCancel()
          }}
          disabled={isSaving}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="font-medium">{value ? formatCurrency(value) : "—"}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="h-3 w-3 text-gray-400" />
      </Button>
    </div>
  )
}

export function getProductosColumns(options: ColumnOptions): ColumnDef<ProductoRow>[] {
  const { onPrecioVentaChange, onTallasClick } = options

  return [
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("sku")}</span>,
    },
    {
      accessorKey: "nombre",
      header: "Producto",
      cell: ({ row }) => <span className="font-medium">{row.getValue("nombre")}</span>,
    },
    {
      accessorKey: "cantidadTotal",
      header: "Cantidad",
      cell: ({ row }) => (
        <span className="font-semibold">{row.getValue<number>("cantidadTotal")}</span>
      ),
    },
    {
      id: "tallas",
      header: "Tallas",
      cell: ({ row }) => {
        const numeroTallas = row.original.numeroTallas
        return (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-blue-600 hover:text-blue-800"
            onClick={() => onTallasClick(row.original)}
          >
            {numeroTallas} {numeroTallas === 1 ? "talla" : "tallas"}
          </Button>
        )
      },
    },
    {
      accessorKey: "costoPromedioCompra",
      header: "Precio Compra",
      cell: ({ row }) => {
        const costo = row.getValue<number>("costoPromedioCompra")
        return <span className="text-gray-700">{formatCurrency(costo)}</span>
      },
    },
    {
      accessorKey: "costoTotalCompra",
      header: "Costo Total",
      cell: ({ row }) => {
        const costoTotal = row.getValue<number>("costoTotalCompra")
        return <span className="font-semibold text-gray-900">{formatCurrency(costoTotal)}</span>
      },
    },
    {
      id: "precioVenta",
      header: "Precio Venta",
      cell: ({ row }) => (
        <EditablePrecioVenta
          sku={row.original.sku}
          value={row.original.precioVenta}
          onChange={onPrecioVentaChange}
        />
      ),
    },
    {
      id: "ganancia",
      header: "Ganancia",
      cell: ({ row }) => {
        const gananciaPorUnidad = row.original.gananciaPorUnidad
        const gananciaPorcentaje = row.original.gananciaPorcentaje

        if (gananciaPorUnidad === null || gananciaPorcentaje === null) {
          return <span className="text-gray-400 text-xs">Sin precio venta</span>
        }

        const color =
          gananciaPorcentaje >= 50
            ? "text-green-700"
            : gananciaPorcentaje >= 30
              ? "text-blue-700"
              : "text-orange-700"

        return (
          <div className="flex flex-col">
            <span className={`font-semibold ${color}`}>{formatCurrency(gananciaPorUnidad)}</span>
            <span className={`text-xs ${color}`}>({gananciaPorcentaje.toFixed(1)}%)</span>
          </div>
        )
      },
    },
  ]
}
