"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AttachmentsList } from "@/components/ui/attachments-list"
import { formatDate, formatCurrency } from "@/lib/utils"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

export interface GastoLogistico {
  id: string
  idGasto: string
  ocId: string
  fechaGasto: string
  tipoGasto: string
  proveedorServicio: string | null
  montoRD: number
  notas: string | null
  adjuntos?: FileAttachment[]
  ordenesCompra: {
    ocChina: {
      id: string
      oc: string
      proveedor: string
    }
  }[]
}

interface ColumnActions {
  onView: (gasto: GastoLogistico) => void
}

export const getGastosColumns = (actions: ColumnActions): ColumnDef<GastoLogistico>[] => [
  {
    accessorKey: "idGasto",
    header: "ID Gasto",
    cell: ({ row }) => (
      <div className="font-medium text-gray-900 whitespace-nowrap">{row.original.idGasto}</div>
    ),
  },
  {
    accessorKey: "ordenesCompra",
    header: "OCs Vinculadas",
    cell: ({ row }) => {
      const ordenesCompra = row.original.ordenesCompra || []
      if (ordenesCompra.length === 0) return <div className="text-gray-400">-</div>

      const count = ordenesCompra.length
      const label = count === 1 ? "OC vinculada" : "OC vinculadas"

      return (
        <div className="whitespace-nowrap">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {count} {label}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "fechaGasto",
    header: "Fecha",
    cell: ({ row }) => (
      <div className="text-gray-500 whitespace-nowrap">{formatDate(row.original.fechaGasto)}</div>
    ),
  },
  {
    accessorKey: "tipoGasto",
    header: "Tipo de Gasto",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.original.tipoGasto}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "proveedorServicio",
    header: "Proveedor Servicio",
    cell: ({ row }) => (
      <div className="text-gray-700 whitespace-nowrap">{row.original.proveedorServicio || "-"}</div>
    ),
  },
  {
    accessorKey: "montoRD",
    header: "Monto RD$",
    cell: ({ row }) => (
      <div className="text-right font-medium text-gray-900 whitespace-nowrap">
        {formatCurrency(row.original.montoRD)}
      </div>
    ),
  },
  {
    accessorKey: "adjuntos",
    header: "Adjuntos",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        <AttachmentsList attachments={row.original.adjuntos || []} compact />
      </div>
    ),
    enableSorting: false,
  },
]
