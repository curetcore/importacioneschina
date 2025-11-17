"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check, X } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
}

export interface MultiSelectProps {
  options: SelectOption[]
  placeholder?: string
  onChange?: (values: string[]) => void
  value?: string[]
  error?: string
  disabled?: boolean
  className?: string
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ className, options, placeholder, onChange, value = [], error, disabled }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectedValues, setSelectedValues] = React.useState<string[]>(value)
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValues(value)
      }
    }, [value])

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside)
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [isOpen])

    const handleToggleOption = (optionValue: string) => {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue]

      setSelectedValues(newValues)
      onChange?.(newValues)
    }

    const handleRemove = (e: React.MouseEvent, optionValue: string) => {
      e.stopPropagation()
      const newValues = selectedValues.filter(v => v !== optionValue)
      setSelectedValues(newValues)
      onChange?.(newValues)
    }

    const selectedOptions = options.filter(opt => selectedValues.includes(opt.value))

    return (
      <div ref={containerRef} className="relative w-full">
        {/* Custom multi-select UI */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex min-h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
            "ring-offset-white placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-400",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-400">{placeholder || "Seleccionar..."}</span>
            ) : (
              selectedOptions.map(option => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, option.value)}
                    className="hover:text-gray-900"
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ml-2",
              isOpen && "transform rotate-180"
            )}
          />
        </button>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="max-h-60 overflow-auto p-1">
              {options.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">No hay opciones disponibles</div>
              ) : (
                options.map(option => {
                  const isSelected = selectedValues.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleToggleOption(option.value)}
                      className={cn(
                        "relative flex w-full items-center rounded-sm px-3 py-2 text-sm outline-none cursor-pointer",
                        "hover:bg-gray-100 transition-colors",
                        isSelected && "bg-gray-100 font-medium"
                      )}
                    >
                      <span className="flex-1 text-left">{option.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-gray-900" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)

MultiSelect.displayName = "MultiSelect"

export { MultiSelect }
