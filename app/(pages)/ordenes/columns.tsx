"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { AttachmentsList } from "@/components/ui/attachments-list"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Eye, Edit, Trash2 } from "lucide-react"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

export interface OCChinaItem {
  id: string
  sku: string
  nombre: string
  cantidadTotal: number
  precioUnitarioUSD: number
  subtotalUSD: number
}

export interface OCChina {
  id: string
  oc: string
  proveedor: string
  fechaOC: string
  categoriaPrincipal: string
  descripcionLote?: string | null
  items?: OCChinaItem[]
  adjuntos?: FileAttachment[]
  _count?: {
    items: number
  }
}

interface ColumnActions {
  onView: (oc: OCChina) => void
  onEdit: (oc: OCChina) => void
  onDelete: (oc: OCChina) => void
}

export const getOrdenesColumns = (actions: ColumnActions): ColumnDef<OCChina>[] => [
  {
    accessorKey: "oc",
    header: "OC",
    cell: ({ row }) => (
      <div className="font-medium text-gray-900 whitespace-nowrap">{row.original.oc}</div>
    ),
  },
  {
    accessorKey: "proveedor",
    header: "Proveedor",
    cell: ({ row }) => (
      <div className="text-gray-700 whitespace-nowrap">{row.original.proveedor}</div>
    ),
  },
  {
    accessorKey: "fechaOC",
    header: "Fecha",
    cell: ({ row }) => (
      <div className="text-gray-500 whitespace-nowrap">{formatDate(row.original.fechaOC)}</div>
    ),
  },
  {
    accessorKey: "categoriaPrincipal",
    header: "Categoría",
    cell: ({ row }) => (
      <div className="text-gray-700 whitespace-nowrap">{row.original.categoriaPrincipal}</div>
    ),
  },
  {
    accessorKey: "productos",
    header: "Productos",
    cell: ({ row }) => {
      const numProductos = row.original.items?.length || 0
      return <div className="text-right text-gray-900 whitespace-nowrap">{numProductos}</div>
    },
  },
  {
    accessorKey: "unidades",
    header: "Unidades",
    cell: ({ row }) => {
      const totalUnidades =
        row.original.items?.reduce((sum, item) => sum + item.cantidadTotal, 0) || 0
      return (
        <div className="text-right text-gray-900 whitespace-nowrap">
          {totalUnidades.toLocaleString()}
        </div>
      )
    },
  },
  {
    accessorKey: "costoFOB",
    header: "Costo FOB",
    cell: ({ row }) => {
      const totalFOB = row.original.items?.reduce((sum, item) => sum + item.subtotalUSD, 0) || 0
      return (
        <div className="text-right font-medium text-gray-900 whitespace-nowrap">
          {formatCurrency(totalFOB, "USD")}
        </div>
      )
    },
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
            actions.onView(row.original)
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>
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
