"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatDate, formatCurrency } from "@/lib/utils"

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
  onView: (inventario: InventarioRecibido) => void
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
]
