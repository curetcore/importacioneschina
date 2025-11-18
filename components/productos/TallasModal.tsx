"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ProductoRow } from "@/app/(pages)/productos/columns"

type TallasModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: ProductoRow | null
}

export function TallasModal({ open, onOpenChange, producto }: TallasModalProps) {
  if (!producto) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-sm text-blue-600">{producto.sku}</span>
            <span className="text-gray-400">•</span>
            <span>{producto.nombre}</span>
          </DialogTitle>
          <DialogDescription>
            Distribución de {producto.cantidadTotal} unidades en {producto.numeroTallas}{" "}
            {producto.numeroTallas === 1 ? "talla" : "tallas"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-2">
            {producto.tallas.map(({ talla, cantidad }) => {
              const porcentaje = (cantidad / producto.cantidadTotal) * 100

              return (
                <div
                  key={talla}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Talla {talla}</div>
                    <div className="text-xs text-gray-500">{porcentaje.toFixed(1)}%</div>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{cantidad}</div>
                </div>
              )
            })}
          </div>

          {/* Resumen */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Total de unidades:</span>
              <span className="text-lg font-bold text-gray-900">{producto.cantidadTotal}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
