import { toast } from "sonner"

/**
 * Helper para mostrar notificaciones toast con Sonner
 *
 * @example
 * ```typescript
 * import { showToast } from "@/lib/toast"
 *
 * // Success toast
 * showToast.success("Orden creada exitosamente")
 *
 * // Error toast
 * showToast.error("Error al crear orden")
 *
 * // Loading con promise
 * showToast.promise(
 *   createOrder(data),
 *   {
 *     loading: "Creando orden...",
 *     success: "Orden creada exitosamente",
 *     error: "Error al crear orden"
 *   }
 * )
 *
 * // Toast con acción
 * showToast.success("Orden eliminada", {
 *   action: {
 *     label: "Deshacer",
 *     onClick: () => restoreOrder()
 *   }
 * })
 * ```
 */
export const showToast = {
  /**
   * Muestra un toast de éxito
   */
  success: (message: string, options?: {
    description?: string
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
  }) => {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration || 3000,
      position: "top-right",
      action: options?.action,
    })
  },

  /**
   * Muestra un toast de error
   */
  error: (message: string, options?: {
    description?: string
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
  }) => {
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      position: "top-right",
      action: options?.action,
    })
  },

  /**
   * Muestra un toast de advertencia
   */
  warning: (message: string, options?: {
    description?: string
    duration?: number
  }) => {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      position: "top-right",
    })
  },

  /**
   * Muestra un toast informativo
   */
  info: (message: string, options?: {
    description?: string
    duration?: number
  }) => {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration || 3000,
      position: "top-right",
    })
  },

  /**
   * Muestra un toast de carga (loading)
   * Retorna el ID del toast para poder actualizarlo o cerrarlo después
   */
  loading: (message: string, options?: {
    description?: string
  }) => {
    return toast.loading(message, {
      description: options?.description,
      position: "top-right",
    })
  },

  /**
   * Cierra un toast específico por su ID
   */
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId)
  },

  /**
   * Muestra un toast que rastrea el estado de una promesa
   * - Muestra loading mientras la promesa está pending
   * - Muestra success cuando la promesa se resuelve
   * - Muestra error cuando la promesa es rechazada
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: {
      description?: string
      duration?: number
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      duration: options?.duration,
      position: "top-right",
    })
  },

  /**
   * Toast personalizado con componente custom
   */
  custom: (message: string, options?: {
    description?: string
    duration?: number
    icon?: React.ReactNode
  }) => {
    return toast(message, {
      description: options?.description,
      duration: options?.duration || 3000,
      position: "top-right",
      icon: options?.icon,
    })
  },
}

/**
 * Helper para mostrar toast de validación de formulario
 */
export function showFormErrorToast(errors: Record<string, any>) {
  const firstError = Object.values(errors)[0]
  const message = firstError?.message || "Error de validación"

  showToast.error("Error en el formulario", {
    description: message,
    duration: 4000,
  })
}

/**
 * Helper para mostrar toast de confirmación antes de acción peligrosa
 *
 * @example
 * ```typescript
 * const confirmed = await confirmAction("¿Eliminar orden?", "Esta acción no se puede deshacer")
 * if (confirmed) {
 *   // Ejecutar acción
 * }
 * ```
 */
export function confirmToast(
  message: string,
  options?: {
    description?: string
    confirmLabel?: string
    cancelLabel?: string
  }
): Promise<boolean> {
  return new Promise((resolve) => {
    toast(message, {
      description: options?.description,
      position: "top-center",
      duration: Infinity,
      action: {
        label: options?.confirmLabel || "Confirmar",
        onClick: () => resolve(true),
      },
      cancel: {
        label: options?.cancelLabel || "Cancelar",
        onClick: () => resolve(false),
      },
    })
  })
}
