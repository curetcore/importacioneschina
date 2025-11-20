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

export interface Pago {
  id: string
  idPago: string
  ocId: string
  fechaPago: string
  tipoPago: string
  metodoPago: string
  moneda: "USD" | "RD$"
  montoOriginal: number
  tasaCambio: number
  comisionBancoUSD: number
  montoRD: number
  montoRDNeto: number
  adjuntos?: FileAttachment[]
  ocChina: {
    oc: string
    proveedor: string
  }
}

interface ColumnActions {
  onView: (pago: Pago) => void
}

export const getPagosColumns = (actions: ColumnActions): ColumnDef<Pago>[] => [
  {
    accessorKey: "idPago",
    header: "ID Pago",
    cell: ({ row }) => (
      <div className="font-medium text-gray-900 whitespace-nowrap">{row.original.idPago}</div>
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
    accessorKey: "fechaPago",
    header: "Fecha",
    cell: ({ row }) => (
      <div className="text-gray-500 whitespace-nowrap">{formatDate(row.original.fechaPago)}</div>
    ),
  },
  {
    accessorKey: "tipoPago",
    header: "Tipo",
    cell: ({ row }) => (
      <div className="text-gray-700 whitespace-nowrap">{row.original.tipoPago}</div>
    ),
  },
  {
    accessorKey: "metodoPago",
    header: "Método",
    cell: ({ row }) => (
      <div className="text-gray-700 whitespace-nowrap">{row.original.metodoPago}</div>
    ),
  },
  {
    accessorKey: "moneda",
    header: "Moneda",
    cell: ({ row }) => (
      <div className="text-center">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {row.original.moneda}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "montoOriginal",
    header: "Monto Original",
    cell: ({ row }) => (
      <div className="text-right font-medium text-gray-900 whitespace-nowrap">
        {formatCurrency(row.original.montoOriginal, row.original.moneda)}
      </div>
    ),
  },
  {
    accessorKey: "tasaCambio",
    header: "Tasa",
    cell: ({ row }) => (
      <div className="text-right text-gray-700 whitespace-nowrap">
        {parseFloat(row.original.tasaCambio.toString()).toFixed(2)}
      </div>
    ),
  },
  {
    accessorKey: "montoRDNeto",
    header: "Monto RD$ (Neto)",
    cell: ({ row }) => (
      <div className="text-right">
        <div className="font-medium text-gray-900 whitespace-nowrap">
          {formatCurrency(row.original.montoRDNeto)}
        </div>
        {row.original.comisionBancoUSD > 0 && (
          <div className="text-gray-600 text-xs whitespace-nowrap">
            + {formatCurrency(row.original.comisionBancoUSD * row.original.tasaCambio)} com.
          </div>
        )}
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
