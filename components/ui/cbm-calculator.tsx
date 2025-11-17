"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"

interface CBMCalculatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCalculate: (cbm: number) => void
}

export function CBMCalculator({ open, onOpenChange, onCalculate }: CBMCalculatorProps) {
  const [length, setLength] = useState<string>("")
  const [width, setWidth] = useState<string>("")
  const [height, setHeight] = useState<string>("")

  const calculateCBM = () => {
    const l = parseFloat(length) || 0
    const w = parseFloat(width) || 0
    const h = parseFloat(height) || 0

    if (l > 0 && w > 0 && h > 0) {
      // CBM = (L × W × H) / 1,000,000 (if dimensions are in cm)
      const cbm = (l * w * h) / 1_000_000
      onCalculate(cbm)
      onOpenChange(false)

      // Reset
      setLength("")
      setWidth("")
      setHeight("")
    }
  }

  const cbmPreview = () => {
    const l = parseFloat(length) || 0
    const w = parseFloat(width) || 0
    const h = parseFloat(height) || 0

    if (l > 0 && w > 0 && h > 0) {
      return ((l * w * h) / 1_000_000).toFixed(6)
    }
    return "0.000000"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculadora de CBM
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-4">
          <p className="text-sm text-gray-600">
            Ingresa las dimensiones del producto en <strong>centímetros (cm)</strong>:
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Largo (cm)</label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={length}
                onChange={e => setLength(e.target.value)}
                placeholder="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ancho (cm)</label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={width}
                onChange={e => setWidth(e.target.value)}
                placeholder="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alto (cm)</label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="15"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Resultado:</div>
            <div className="text-2xl font-bold text-gray-900">
              {cbmPreview()} <span className="text-sm font-normal text-gray-500">CBM</span>
            </div>
            {parseFloat(cbmPreview()) > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {length} × {width} × {height} ÷ 1,000,000
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={calculateCBM} disabled={!length || !width || !height}>
              Usar este valor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
