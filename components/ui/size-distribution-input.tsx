"use client"

import { useState, useEffect } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Plus, X } from "lucide-react"

interface SizeDistributionInputProps {
  value: Record<string, number> | null
  onChange: (value: Record<string, number> | null) => void
  disabled?: boolean
  expectedTotal?: number // Cantidad total esperada para validación
}

// Tallas comunes predefinidas
const COMMON_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
]

export function SizeDistributionInput({
  value,
  onChange,
  disabled = false,
  expectedTotal,
}: SizeDistributionInputProps) {
  const [sizes, setSizes] = useState<Record<string, number>>(value || {})
  const [customSize, setCustomSize] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Sync with parent value
  useEffect(() => {
    setSizes(value || {})
  }, [value])

  // Update parent when sizes change
  const handleSizeChange = (newSizes: Record<string, number>) => {
    setSizes(newSizes)
    // Remove sizes with 0 or empty quantities
    const cleaned = Object.entries(newSizes).reduce(
      (acc, [size, qty]) => {
        if (qty > 0) {
          acc[size] = qty
        }
        return acc
      },
      {} as Record<string, number>
    )
    onChange(Object.keys(cleaned).length > 0 ? cleaned : null)
  }

  const handleQuantityChange = (size: string, quantity: number) => {
    const newSizes = { ...sizes }
    if (quantity > 0) {
      newSizes[size] = quantity
    } else {
      delete newSizes[size]
    }
    handleSizeChange(newSizes)
  }

  const addCustomSize = () => {
    if (customSize.trim() && !sizes[customSize.trim()]) {
      const newSizes = { ...sizes, [customSize.trim()]: 0 }
      handleSizeChange(newSizes)
      setCustomSize("")
      setShowCustomInput(false)
    }
  }

  const removeSize = (size: string) => {
    const newSizes = { ...sizes }
    delete newSizes[size]
    handleSizeChange(newSizes)
  }

  const quickAddSize = (size: string) => {
    if (!sizes[size]) {
      handleQuantityChange(size, 0)
    }
  }

  // Calculate total
  const total = Object.values(sizes).reduce((sum, qty) => sum + qty, 0)

  // Validation: check if total matches expected
  const hasExpectedTotal = expectedTotal !== undefined && expectedTotal > 0
  const isValid = !hasExpectedTotal || total === expectedTotal
  const hasSizes = Object.keys(sizes).length > 0

  // Sort sizes for display (numbers first, then letters)
  const sortedSizes = Object.keys(sizes).sort((a, b) => {
    const aNum = parseInt(a)
    const bNum = parseInt(b)
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum
    }
    if (!isNaN(aNum)) return -1
    if (!isNaN(bNum)) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-3">
      {/* Quick add buttons */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-gray-600">Tallas rápidas:</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowCustomInput(!showCustomInput)}
            disabled={disabled}
            className="text-xs h-6 px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Personalizada
          </Button>
        </div>

        {showCustomInput && (
          <div className="flex gap-2 mb-2">
            <Input
              value={customSize}
              onChange={e => setCustomSize(e.target.value)}
              placeholder="Ej: 2XL, 46, etc."
              disabled={disabled}
              className="h-8 text-sm"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addCustomSize()
                }
              }}
            />
            <Button
              type="button"
              onClick={addCustomSize}
              disabled={disabled || !customSize.trim()}
              className="h-8 px-3 text-xs"
            >
              Agregar
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {COMMON_SIZES.map(size => {
            const isAdded = size in sizes
            return (
              <button
                key={size}
                type="button"
                onClick={() => quickAddSize(size)}
                disabled={disabled || isAdded}
                className={`
                  px-2 py-1 text-xs rounded border transition-colors
                  ${
                    isAdded
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
                  }
                `}
              >
                {size}
              </button>
            )
          })}
        </div>
      </div>

      {/* Active sizes with quantities */}
      {sortedSizes.length > 0 && (
        <div
          className={`border rounded-lg p-3 ${isValid ? "bg-gray-50" : "bg-yellow-50 border-yellow-300"}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Distribución de Tallas</span>
            {hasExpectedTotal ? (
              <div className="text-sm font-semibold">
                <span className={isValid ? "text-green-600" : "text-yellow-600"}>
                  Total: {total} {isValid ? "✓" : "⚠"}
                </span>
                {!isValid && (
                  <span className="text-xs text-yellow-600 ml-2">(Esperado: {expectedTotal})</span>
                )}
              </div>
            ) : (
              total > 0 && (
                <span className="text-sm font-semibold text-blue-600">Total: {total} unidades</span>
              )
            )}
          </div>

          <div className="space-y-2">
            {sortedSizes.map(size => (
              <div key={size} className="flex items-center gap-2">
                <div className="w-16 text-sm font-medium text-gray-700 text-center bg-white border rounded px-2 py-1.5">
                  {size}
                </div>
                <Input
                  type="number"
                  min="0"
                  value={sizes[size] || ""}
                  onChange={e => handleQuantityChange(size, parseInt(e.target.value) || 0)}
                  placeholder="Cantidad"
                  disabled={disabled}
                  className="h-9 flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeSize(size)}
                  disabled={disabled}
                  className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {sortedSizes.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500 border border-dashed rounded">
          Haz clic en las tallas de arriba para empezar
        </div>
      )}

      {/* Warning when totals don't match */}
      {hasExpectedTotal && hasSizes && !isValid && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold text-lg">⚠</span>
            <div className="flex-1">
              <div className="font-semibold text-yellow-900 mb-1">
                Distribución de tallas incompleta
              </div>
              <div className="text-yellow-700">
                <span className="font-medium">Cantidad total del pedido:</span> {expectedTotal}{" "}
                unidades
              </div>
              <div className="text-yellow-700">
                <span className="font-medium">Suma de tallas:</span> {total} unidades
              </div>
              <div className="text-yellow-600 font-medium mt-2">
                {total < expectedTotal
                  ? `Faltan ${expectedTotal - total} unidades por distribuir`
                  : `Hay ${total - expectedTotal} unidades de más`}
              </div>
              <div className="text-yellow-700 text-xs mt-2 italic">
                Puedes seguir agregando tallas. La validación se aplicará al guardar la orden.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
