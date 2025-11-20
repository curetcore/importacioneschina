import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, AlertTriangle, X, Info, Sparkles } from "lucide-react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "warning" | "critical" | "info" | "magic" | "default"
  size?: "sm" | "md" | "lg"
  icon?: boolean // Auto-add icon based on variant
  dot?: boolean // Show colored dot instead of icon
}

/**
 * Badge Component - Shopify Polaris 2025 Design System
 *
 * Variantes semánticas:
 * - success: Verde (#047b5d) - Estados exitosos, aprobados, completados
 * - warning: Amarillo (#ffb800) - Alertas, pendientes, en proceso
 * - critical: Rojo (#c70a24) - Errores, rechazados, cancelados
 * - info: Azul (#91d0ff) - Información general, notas
 * - magic: Morado (#8051ff) - IA, automatización
 * - default: Gris (#303030) - Estados neutros
 *
 * @example
 * // Con icono automático
 * <Badge variant="success" icon>Aprobado</Badge>
 * <Badge variant="warning" icon>Pendiente</Badge>
 * <Badge variant="critical" icon>Rechazado</Badge>
 *
 * // Con dot
 * <Badge variant="info" dot>Procesando</Badge>
 *
 * // Simple
 * <Badge variant="default">Neutral</Badge>
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    { className, variant = "default", size = "md", icon = false, dot = false, children, ...props },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors"

    const variants = {
      success:
        "bg-shopify-success-surface text-shopify-success-text border border-shopify-success-border",
      warning:
        "bg-shopify-warning-surface text-shopify-warning-text border border-shopify-warning-border",
      critical:
        "bg-shopify-critical-surface text-shopify-critical-text border border-shopify-critical-border",
      info: "bg-shopify-info-surface text-shopify-info-text border border-shopify-info-border",
      magic: "bg-shopify-magic-surface text-shopify-magic-text border border-shopify-magic-border",
      default: "bg-shopify-surface-neutral text-shopify-text border border-shopify-border",
    }

    const sizes = {
      sm: "text-xs px-2 py-0.5",
      md: "text-sm px-2.5 py-1",
      lg: "text-base px-3 py-1.5",
    }

    const iconSize = size === "sm" ? 12 : size === "md" ? 14 : 16

    // Auto-select icon based on variant
    const getIcon = () => {
      if (!icon) return null

      const iconProps = { size: iconSize }

      switch (variant) {
        case "success":
          return <Check {...iconProps} />
        case "warning":
          return <AlertTriangle {...iconProps} />
        case "critical":
          return <X {...iconProps} />
        case "info":
          return <Info {...iconProps} />
        case "magic":
          return <Sparkles {...iconProps} />
        default:
          return null
      }
    }

    // Colored dot
    const getDot = () => {
      if (!dot) return null

      const dotColors = {
        success: "bg-shopify-success-icon",
        warning: "bg-shopify-warning-icon",
        critical: "bg-shopify-critical-icon",
        info: "bg-shopify-info-icon",
        magic: "bg-shopify-magic-icon",
        default: "bg-shopify-border-strong",
      }

      return <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />
    }

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {getDot()}
        {getIcon()}
        <span>{children}</span>
      </div>
    )
  }
)

Badge.displayName = "Badge"

export { Badge }
