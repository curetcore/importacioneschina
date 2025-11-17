"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  options: SelectOption[]
  placeholder?: string
  onChange?: (value: string) => void
  value?: string
  error?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, onChange, value, error, disabled, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectedValue, setSelectedValue] = React.useState(value || "")
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value)
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

    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue)
      onChange?.(optionValue)
      setIsOpen(false)
    }

    const selectedOption = options.find(opt => opt.value === selectedValue)

    return (
      <div ref={containerRef} className="relative w-full">
        {/* Hidden native select for form compatibility */}
        <select
          ref={ref}
          value={selectedValue}
          onChange={e => handleSelect(e.target.value)}
          className="sr-only"
          disabled={disabled}
          {...props}
        >
          <option value="">{placeholder || "Seleccionar..."}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom select UI */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
            "ring-offset-white placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-400",
            className
          )}
        >
          <span className={cn("truncate", !selectedValue && "text-gray-400")}>
            {selectedOption ? selectedOption.label : placeholder || "Seleccionar..."}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-500 transition-transform",
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
                options.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "relative flex w-full items-center rounded-sm px-3 py-2 text-sm outline-none cursor-pointer",
                      "hover:bg-gray-100 transition-colors",
                      selectedValue === option.value && "bg-gray-100 font-medium"
                    )}
                  >
                    <span className="flex-1 text-left">{option.label}</span>
                    {selectedValue === option.value && <Check className="h-4 w-4 text-gray-900" />}
                  </button>
                ))
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

Select.displayName = "Select"

export { Select }
