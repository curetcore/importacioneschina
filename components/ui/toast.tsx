"use client"

import { toast as sonnerToast } from "sonner"
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"

export type ToastType = "success" | "error" | "info" | "warning"

export interface Toast {
  id?: string
  title: string
  description?: string
  type: ToastType
  duration?: number
  details?: string
}

/**
 * Hook para mostrar notificaciones toast usando Sonner
 * Mantiene la misma API que el sistema anterior para retrocompatibilidad
 */
export function useToast() {
  const addToast = (options: Omit<Toast, "id">) => {
    const { type, title, description, duration, details } = options
    const isDev = process.env.NODE_ENV === "development"

    // Configurar iconos personalizados con colores contextuales
    const iconConfig = {
      success: { Icon: CheckCircle2, className: "h-5 w-5 text-green-600" },
      error: { Icon: AlertCircle, className: "h-5 w-5 text-red-600" },
      info: { Icon: Info, className: "h-5 w-5 text-blue-600" },
      warning: { Icon: AlertTriangle, className: "h-5 w-5 text-orange-600" },
    }

    const { Icon, className } = iconConfig[type]

    // Mensaje completo con detalles técnicos en desarrollo
    const fullDescription =
      isDev && details ? `${description || ""}\n\nDetalles técnicos: ${details}` : description

    // Mapear tipos a funciones de Sonner
    const toastFunctions = {
      success: sonnerToast.success,
      error: sonnerToast.error,
      info: sonnerToast.info,
      warning: sonnerToast.warning,
    }

    toastFunctions[type](title, {
      description: fullDescription,
      duration: duration || 5000,
      icon: <Icon className={className} />,
    })
  }

  // removeToast no es necesario con Sonner (maneja auto-dismiss)
  const removeToast = () => {
    sonnerToast.dismiss()
  }

  return { addToast, removeToast, toasts: [] }
}
