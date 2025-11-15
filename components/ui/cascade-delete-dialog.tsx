"use client"

import { useState, useEffect } from "react"
import { AlertCircle, XCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface CascadeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  ocId: string
  ocNumber: string
  loading?: boolean
}

interface DeletePreview {
  oc: string
  hasRelatedData: boolean
  counts: {
    items: number
    pagos: number
    gastos: number
    inventario: number
  }
  details: {
    pagos: Array<{ id: string; monto: number }>
    gastos: Array<{ id: string; monto: number }>
    inventario: Array<{ id: string; cantidad: number }>
  }
}

export function CascadeDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  ocId,
  ocNumber,
  loading = false,
}: CascadeDeleteDialogProps) {
  const [preview, setPreview] = useState<DeletePreview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [understood, setUnderstood] = useState(false)

  useEffect(() => {
    if (open && ocId) {
      fetchPreview()
    } else {
      // Reset state when dialog closes
      setPreview(null)
      setConfirmText("")
      setUnderstood(false)
    }
  }, [open, ocId])

  const fetchPreview = async () => {
    setLoadingPreview(true)
    try {
      const response = await fetch(`/api/oc-china/${ocId}?preview=true`, {
        method: "DELETE",
      })
      const result = await response.json()
      if (result.success) {
        setPreview(result.data)
      }
    } catch (error) {
      console.error("Error fetching preview:", error)
    } finally {
      setLoadingPreview(false)
    }
  }

  const totalRecords =
    (preview?.counts.items || 0) +
    (preview?.counts.pagos || 0) +
    (preview?.counts.gastos || 0) +
    (preview?.counts.inventario || 0)

  const canConfirm = understood && confirmText === "ELIMINAR"

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Eliminar OC {ocNumber}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Esta acción eliminará la OC y TODOS sus datos relacionados
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingPreview ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Analizando datos a eliminar...</p>
            </div>
          ) : preview ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Se eliminarán un total de <span className="text-red-600 font-bold">{totalRecords}</span> registros:
                </p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• {preview.counts.items} productos</li>
                  {preview.counts.pagos > 0 && <li>• {preview.counts.pagos} pagos</li>}
                  {preview.counts.gastos > 0 && <li>• {preview.counts.gastos} gastos logísticos</li>}
                  {preview.counts.inventario > 0 && <li>• {preview.counts.inventario} recepciones de inventario</li>}
                </ul>
              </div>

              {/* Details */}
              {preview.hasRelatedData && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Detalles de lo que se eliminará:</h3>

                  {/* Pagos */}
                  {preview.details.pagos.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Pagos ({preview.details.pagos.length})
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {preview.details.pagos.map((pago) => (
                          <div key={pago.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{pago.id}</span>
                            <span className="font-medium text-gray-900">{formatCurrency(pago.monto)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gastos */}
                  {preview.details.gastos.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Gastos Logísticos ({preview.details.gastos.length})
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {preview.details.gastos.map((gasto) => (
                          <div key={gasto.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{gasto.id}</span>
                            <span className="font-medium text-gray-900">{formatCurrency(gasto.monto)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inventario */}
                  {preview.details.inventario.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Recepciones de Inventario ({preview.details.inventario.length})
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {preview.details.inventario.map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{inv.id}</span>
                            <span className="font-medium text-gray-900">{inv.cantidad} unidades</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900 mb-2">⚠️ Advertencia:</p>
                <p className="text-sm text-red-800">
                  Esta acción es IRREVERSIBLE. Todos los datos listados arriba serán eliminados permanentemente de la base de datos.
                </p>
              </div>

              {/* Confirmation checkbox */}
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={understood}
                    onChange={(e) => setUnderstood(e.target.checked)}
                    className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">
                    Entiendo que esta acción eliminará permanentemente la OC <strong>{ocNumber}</strong> y todos sus {totalRecords} registros relacionados, y que no se puede deshacer.
                  </span>
                </label>

                {/* Confirmation text */}
                {understood && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Para confirmar, escribe <span className="font-mono font-bold text-red-600">ELIMINAR</span>:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                      placeholder="ELIMINAR"
                      disabled={loading}
                      autoComplete="off"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-500">
              No se pudo cargar la información
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Eliminando...
              </>
            ) : (
              "Eliminar Todo"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
