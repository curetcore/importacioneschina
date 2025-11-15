"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"

export type ToastType = "success" | "error" | "info" | "warning"

export interface Toast {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
  details?: string // Detalles técnicos para desarrollo
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-md w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [showDetails, setShowDetails] = React.useState(false)
  const isDev = process.env.NODE_ENV === 'development'

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  }

  const styles = {
    success: "bg-green-50 border-green-200 text-green-900",
    error: "bg-red-50 border-red-200 text-red-900",
    info: "bg-blue-50 border-blue-200 text-blue-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
  }

  const iconColors = {
    success: "text-green-600",
    error: "text-red-600",
    info: "text-blue-600",
    warning: "text-yellow-600",
  }

  const Icon = icons[toast.type]

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 rounded-lg border shadow-lg",
        "animate-in slide-in-from-top-2 duration-300",
        styles[toast.type]
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColors[toast.type])} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description && (
            <p className="text-xs mt-1 opacity-90">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </button>
      </div>

      {/* Detalles técnicos en desarrollo */}
      {isDev && toast.details && (
        <div className="ml-8 border-t border-current opacity-20 pt-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-mono opacity-70 hover:opacity-100 transition-opacity"
          >
            {showDetails ? '▼' : '▶'} Detalles técnicos
          </button>
          {showDetails && (
            <pre className="text-[10px] font-mono mt-2 p-2 bg-black bg-opacity-10 rounded overflow-x-auto max-h-40 overflow-y-auto">
              {toast.details}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
