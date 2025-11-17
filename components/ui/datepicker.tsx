"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: Date | string
  onChange?: (date: Date | null) => void
  error?: string
  min?: string
  max?: string
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, value, onChange, error, min, max, disabled, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState("")

    React.useEffect(() => {
      if (value) {
        const date = value instanceof Date ? value : new Date(value)
        if (!isNaN(date.getTime())) {
          // Format as YYYY-MM-DD for input[type="date"]
          const formatted = date.toISOString().split("T")[0]
          setInputValue(formatted)
        }
      } else {
        setInputValue("")
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)

      if (newValue) {
        const date = new Date(newValue)
        if (!isNaN(date.getTime())) {
          onChange?.(date)
        }
      } else {
        onChange?.(null)
      }
    }

    return (
      <div className="relative w-full">
        <div className="relative">
          <input
            ref={ref}
            type="date"
            value={inputValue}
            onChange={handleChange}
            min={min}
            max={max}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
              "ring-offset-white placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "[color-scheme:light]", // Prevent dark mode on date picker
              error && "border-red-500 focus:ring-red-400",
              className
            )}
            {...props}
          />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)

DatePicker.displayName = "DatePicker"

export { DatePicker }
