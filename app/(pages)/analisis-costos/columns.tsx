"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatCurrency } from "@/lib/utils"

export interface ProductoCosto {
  id: string
  idRecepcion: string
  sku: string
  nombre: string
  oc: string
  proveedor: string
  cantidad: number
  bodega: string
  fechaLlegada: Date
  desglose: {
    costoFobUsd: number
    tasaCambio: number
    costoFobRD: number
    pagos: number
    gastos: number
    comisiones: number
  }
  costoFinalUnitario: number
  costoTotalRecepcion: number
}

export const columns: ColumnDef<ProductoCosto>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <div className="font-medium text-gray-900">{row.getValue("sku")}</div>
    ),
  },
  {
    accessorKey: "nombre",
    header: "Producto",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-gray-900 truncate max-w-[200px]">
          {row.getValue("nombre")}
        </div>
        <div className="text-xs text-gray-500">
          {row.original.oc} · {row.original.proveedor}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "cantidad",
    header: () => <div className="text-right">Cant.</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.getValue("cantidad")}
      </div>
    ),
  },
  {
    id: "costoFobUsd",
    header: () => <div className="text-right">FOB (USD)</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <div className="font-medium text-gray-900">
          {formatCurrency(row.original.desglose.costoFobUsd, "USD")}
        </div>
        <div className="text-xs text-gray-500">
          @{row.original.desglose.tasaCambio.toFixed(2)}
        </div>
      </div>
    ),
  },
  {
    id: "costoFobRD",
    header: () => <div className="text-right">FOB (RD$)</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium text-gray-900">
        {formatCurrency(row.original.desglose.costoFobRD)}
      </div>
    ),
  },
  {
    id: "pagos",
    header: () => <div className="text-right">Pagos</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium text-blue-600">
        +{formatCurrency(row.original.desglose.pagos)}
      </div>
    ),
  },
  {
    id: "gastos",
    header: () => <div className="text-right">Gastos</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium text-orange-600">
        +{formatCurrency(row.original.desglose.gastos)}
      </div>
    ),
  },
  {
    id: "comisiones",
    header: () => <div className="text-right">Comisiones</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium text-purple-600">
        +{formatCurrency(row.original.desglose.comisiones)}
      </div>
    ),
  },
  {
    accessorKey: "costoFinalUnitario",
    header: () => <div className="text-right font-semibold">Costo Final</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <div className="font-bold text-gray-900 text-base">
          {formatCurrency(row.getValue("costoFinalUnitario"))}
        </div>
        <div className="text-xs text-gray-500">
          Total: {formatCurrency(row.original.costoTotalRecepcion)}
        </div>
      </div>
    ),
  },
]
