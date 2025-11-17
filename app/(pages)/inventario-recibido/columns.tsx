"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Edit, Trash2 } from "lucide-react"

export interface InventarioRecibido {
  id: string
  idRecepcion: string
  ocId: string
  itemId: string | null
  fechaLlegada: string
  bodegaInicial: string
  cantidadRecibida: number
  costoUnitarioFinalRD: number | null
  costoTotalRecepcionRD: number | null
  notas: string | null
  ocChina: {
    oc: string
    proveedor: string
  }
  item: {
    sku: string
    nombre: string
    cantidadTotal: number
  } | null
}

interface ColumnActions {
  onEdit: (inventario: InventarioRecibido) => void
  onDelete: (inventario: InventarioRecibido) => void
}

export const getInventarioColumns = (actions: ColumnActions): ColumnDef<InventarioRecibido>[] => [
  {
    accessorKey: "idRecepcion",
    header: "ID Recepción",
    cell: ({ row }) => (
      <div className="font-medium text-gray-900 whitespace-nowrap">{row.original.idRecepcion}</div>
    ),
  },
  {
    accessorKey: "ocChina",
    header: "OC / Proveedor",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        <div className="font-medium text-gray-900">{row.original.ocChina.oc}</div>
        <div className="text-gray-500 text-xs">{row.original.ocChina.proveedor}</div>
      </div>
    ),
  },
  {
    accessorKey: "item",
    header: "Producto",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {row.original.item ? (
          <>
            <div className="font-medium text-gray-900">{row.original.item.sku}</div>
            <div className="text-gray-500 text-xs">{row.original.item.nombre}</div>
          </>
        ) : (
          <span className="text-gray-400 text-sm">Sin vincular</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "fechaLlegada",
    header: "Fecha Llegada",
    cell: ({ row }) => (
      <div className="text-gray-500 whitespace-nowrap">{formatDate(row.original.fechaLlegada)}</div>
    ),
  },
  {
    accessorKey: "bodegaInicial",
    header: "Bodega",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {row.original.bodegaInicial}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "cantidadRecibida",
    header: "Cantidad",
    cell: ({ row }) => (
      <div className="text-center font-medium text-gray-900 whitespace-nowrap">
        {row.original.cantidadRecibida.toLocaleString()} uds
      </div>
    ),
  },
  {
    accessorKey: "costoUnitarioFinalRD",
    header: "Costo Unit.",
    cell: ({ row }) => (
      <div className="text-right text-gray-700 whitespace-nowrap">
        {row.original.costoUnitarioFinalRD
          ? formatCurrency(row.original.costoUnitarioFinalRD)
          : "-"}
      </div>
    ),
  },
  {
    accessorKey: "costoTotalRecepcionRD",
    header: "Costo Total",
    cell: ({ row }) => (
      <div className="text-right font-medium text-gray-900 whitespace-nowrap">
        {row.original.costoTotalRecepcionRD
          ? formatCurrency(row.original.costoTotalRecepcionRD)
          : "-"}
      </div>
    ),
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={e => {
            e.stopPropagation()
            actions.onEdit(row.original)
          }}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={e => {
            e.stopPropagation()
            actions.onDelete(row.original)
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    ),
    enableSorting: false,
  },
]
