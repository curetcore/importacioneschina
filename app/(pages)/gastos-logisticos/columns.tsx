"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { AttachmentsList } from "@/components/ui/attachments-list"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Edit, Trash2, Paperclip } from "lucide-react"

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
  ocChina: {
    oc: string
    proveedor: string
  }
}

interface ColumnActions {
  onEdit: (gasto: GastoLogistico) => void
  onDelete: (gasto: GastoLogistico) => void
  onAddAttachments: (gasto: GastoLogistico) => void
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
        {row.original.adjuntos && row.original.adjuntos.length > 0 ? (
          <AttachmentsList attachments={row.original.adjuntos} compact />
        ) : (
          <Button
            variant="ghost"
            className="h-8 px-2 text-gray-400"
            onClick={e => {
              e.stopPropagation()
              actions.onAddAttachments(row.original)
            }}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        )}
      </div>
    ),
    enableSorting: false,
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
