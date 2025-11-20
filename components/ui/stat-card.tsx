import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon to display (Lucide React component) */
  icon?: React.ReactNode
  /** Main label/title */
  label: string
  /** Primary value to display */
  value: string | number
  /** Optional subtitle/description */
  subtitle?: string
  /** Optional loading state */
  loading?: boolean
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, icon, label, value, subtitle, loading = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white border border-shopify-border-card rounded-lg p-5 hover:border-shopify-border transition-colors",
          className
        )}
        {...props}
      >
        {/* Header: Label + Icon */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-shopify-text-subdued uppercase tracking-wide">
            {label}
          </p>
          {icon && <div className="text-shopify-text-subdued w-4 h-4">{icon}</div>}
        </div>

        {/* Value */}
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
        ) : (
          <p className="text-2xl font-semibold text-shopify-text">{value}</p>
        )}

        {/* Optional Subtitle */}
        {subtitle && <p className="text-xs text-shopify-text-subdued mt-1">{subtitle}</p>}
      </div>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
