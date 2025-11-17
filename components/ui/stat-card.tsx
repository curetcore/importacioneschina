import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon to display (Lucide React component) */
  icon?: React.ReactNode
  /** Main label/title */
  label: string
  /** Primary value to display */
  value: string | number
  /** Optional subtitle/description */
  subtitle?: string
  /** Optional trend indicator */
  trend?: {
    value: number
    isPositive: boolean
  }
  /** Optional loading state */
  loading?: boolean
  /** Color variant */
  variant?: "default" | "primary" | "success" | "warning" | "danger"
}

const variantStyles = {
  default: {
    icon: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
  primary: {
    icon: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  success: {
    icon: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  warning: {
    icon: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  danger: {
    icon: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      icon,
      label,
      value,
      subtitle,
      trend,
      loading = false,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const styles = variantStyles[variant]

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-lg border bg-white p-5 shadow-sm transition-all hover:shadow-md",
          styles.border,
          className
        )}
        {...props}
      >
        {/* Icon Badge */}
        {icon && (
          <div className={cn("mb-3 inline-flex rounded-lg p-2.5", styles.bg)}>
            <div className={cn("h-5 w-5", styles.icon)}>{icon}</div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-1">
          {/* Label */}
          <p className="text-sm font-medium text-gray-600">{label}</p>

          {/* Value */}
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}

          {/* Subtitle or Trend */}
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 text-xs">
              {subtitle && <span className="text-gray-500">{subtitle}</span>}

              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                    trend.isPositive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Decorative gradient */}
        <div
          className={cn(
            "absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10",
            styles.bg
          )}
        />
      </div>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
