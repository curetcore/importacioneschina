import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Shopify Polaris 2025 variants (nuevos)
  variant?:
    | "primary" // Gris oscuro (acción principal)
    | "success" // Verde (acciones positivas)
    | "critical" // Rojo (acciones destructivas)
    | "secondary" // Outline (acciones secundarias)
    | "plain" // Texto (acciones terciarias)
    // Legacy variants (mantener compatibilidad)
    | "default"
    | "outline"
    | "ghost"
    | "destructive"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  fullWidth?: boolean
}

/**
 * Button Component - Shopify Polaris 2025 Design System
 *
 * Nuevas variantes Polaris 2025:
 * - primary: Acción principal (fondo gris oscuro #303030)
 * - success: Acciones positivas (fondo verde #047b5d)
 * - critical: Acciones destructivas (fondo rojo #c70a24)
 * - secondary: Acciones secundarias (outline gris)
 * - plain: Enlaces/acciones terciarias (solo texto azul)
 *
 * Legacy variants (siguen funcionando):
 * - default: Mapea a primary
 * - outline: Mapea a secondary
 * - ghost: Similar a plain
 * - destructive: Mapea a critical
 *
 * @example
 * // Polaris 2025
 * <Button variant="primary">Guardar</Button>
 * <Button variant="critical" isLoading>Eliminar</Button>
 *
 * // Legacy (sigue funcionando)
 * <Button variant="default">Guardar</Button>
 * <Button variant="destructive">Eliminar</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      loadingText,
      icon,
      iconPosition = "left",
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Mapear variants legacy a Polaris 2025
    const normalizedVariant =
      variant === "default"
        ? "primary"
        : variant === "outline"
          ? "secondary"
          : variant === "ghost"
            ? "plain"
            : variant === "destructive"
              ? "critical"
              : variant

    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

    const variants = {
      // Shopify Polaris 2025 variants
      primary:
        "bg-shopify-primary text-white hover:bg-shopify-primary-hover active:bg-shopify-primary-pressed focus:ring-shopify-primary shadow-sm",
      success:
        "bg-shopify-success-fill text-white hover:bg-[#036349] active:bg-[#025741] focus:ring-shopify-success-fill shadow-sm",
      critical:
        "bg-shopify-critical-fill text-white hover:bg-[#a00820] active:bg-[#8a071c] focus:ring-shopify-critical-fill shadow-sm",
      secondary:
        "bg-white text-shopify-text border-2 border-shopify-border hover:bg-shopify-surface-hovered active:bg-shopify-surface-pressed focus:ring-shopify-interactive",
      plain:
        "bg-transparent text-shopify-interactive hover:text-shopify-interactive-hover underline-offset-4 hover:underline focus:ring-shopify-interactive",
    }

    const sizes = {
      sm: "text-sm px-3 py-1.5 min-h-[32px]",
      md: "text-sm px-4 py-2 min-h-[40px]",
      lg: "text-base px-5 py-2.5 min-h-[48px]",
    }

    const widthClass = fullWidth ? "w-full" : ""

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[normalizedVariant as keyof typeof variants],
          sizes[size],
          widthClass,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && icon && iconPosition === "left" && <span>{icon}</span>}
        {isLoading ? loadingText || children : children}
        {!isLoading && icon && iconPosition === "right" && <span>{icon}</span>}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
