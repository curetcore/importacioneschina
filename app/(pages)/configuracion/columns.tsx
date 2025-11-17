"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Check, X } from "lucide-react"

export interface Configuracion {
  id: string
  categoria: string
  valor: string
  orden: number
  activo: boolean
}

interface ColumnActions {
  onEdit: (config: Configuracion) => void
  onDelete: (config: Configuracion) => void
}

export const getConfiguracionColumns = (actions: ColumnActions): ColumnDef<Configuracion>[] => [
  {
    accessorKey: "categoria",
    header: "Categoría",
    cell: ({ row }) => (
      <div className="text-gray-700 whitespace-nowrap capitalize">{row.original.categoria}</div>
    ),
  },
  {
    accessorKey: "valor",
    header: "Valor",
    cell: ({ row }) => (
      <div className="font-medium text-gray-900 whitespace-nowrap">{row.original.valor}</div>
    ),
  },
  {
    accessorKey: "orden",
    header: "Orden",
    cell: ({ row }) => (
      <div className="text-center text-gray-700 whitespace-nowrap">{row.original.orden}</div>
    ),
  },
  {
    accessorKey: "activo",
    header: "Estado",
    cell: ({ row }) => (
      <div className="text-center whitespace-nowrap">
        {row.original.activo ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="w-3 h-3" />
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <X className="w-3 h-3" />
            Inactivo
          </span>
        )}
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
