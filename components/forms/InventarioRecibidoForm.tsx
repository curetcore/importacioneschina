"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectOption } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/datepicker"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { bodegas } from "@/lib/validations"
import { distribuirGastosLogisticos } from "@/lib/calculations"
import { Loader2 } from "lucide-react"

interface InventarioRecibido {
  id: string
  idRecepcion: string
  ocId: string
  itemId?: string | null
  fechaLlegada: string
  bodegaInicial: string
  cantidadRecibida: number
  notas?: string | null
}

interface InventarioRecibidoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  inventarioToEdit?: InventarioRecibido | null
}

const bodegasOptions: SelectOption[] = bodegas.map(b => ({ value: b, label: b }))

export function InventarioRecibidoForm({ open, onOpenChange, onSuccess, inventarioToEdit }: InventarioRecibidoFormProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const isEditMode = !!inventarioToEdit

  const [ocsOptions, setOcsOptions] = useState<SelectOption[]>([])
  const [loadingOcs, setLoadingOcs] = useState(false)

  const [itemsOptions, setItemsOptions] = useState<SelectOption[]>([])
  const [selectedOcData, setSelectedOcData] = useState<any>(null)
  const [selectedItemData, setSelectedItemData] = useState<any>(null)

  const [formData, setFormData] = useState({
    idRecepcion: "",
    ocId: "",
    itemId: "",
    fechaLlegada: undefined as Date | undefined,
    bodegaInicial: "",
    cantidadRecibida: undefined as number | undefined,
    notas: "",
  })

  // Cargar lista de OCs
  useEffect(() => {
    if (open) {
      setLoadingOcs(true)
      fetch("/api/oc-china")
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setOcsOptions(result.data.map((oc: any) => ({
              value: oc.id,
              label: `${oc.oc} - ${oc.proveedor}`
            })))
          }
          setLoadingOcs(false)
        })
        .catch(() => setLoadingOcs(false))
    }
  }, [open])

  // Cargar datos de la OC y sus items cuando se selecciona
  useEffect(() => {
    if (formData.ocId) {
      fetch(`/api/oc-china/${formData.ocId}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            const oc = result.data
            setSelectedOcData(oc)

            // Crear opciones de items
            if (oc.items && oc.items.length > 0) {
              const itemOptions = oc.items.map((item: any) => ({
                value: item.id,
                label: `${item.sku} - ${item.nombre} (${item.cantidadTotal} unidades)`
              }))
              setItemsOptions(itemOptions)
            } else {
              setItemsOptions([])
            }
          }
        })
        .catch(() => {
          setSelectedOcData(null)
          setItemsOptions([])
        })
    } else {
      setSelectedOcData(null)
      setItemsOptions([])
      setFormData(prev => ({ ...prev, itemId: "" }))
    }
  }, [formData.ocId])

  // Calcular costos cuando se selecciona un item
  useEffect(() => {
    if (selectedOcData && formData.itemId) {
      const item = selectedOcData.items?.find((i: any) => i.id === formData.itemId)
      if (item) {
        // Calcular distribución de gastos para obtener costo unitario
        const itemsConCostos = distribuirGastosLogisticos(
          selectedOcData.items,
          selectedOcData.gastosLogisticos || [],
          selectedOcData.pagosChina || []
        )
        const itemConCosto = itemsConCostos.find(i => i.id === formData.itemId)
        setSelectedItemData(itemConCosto || null)
      } else {
        setSelectedItemData(null)
      }
    } else {
      setSelectedItemData(null)
    }
  }, [selectedOcData, formData.itemId])

  // Calculos
  const costoUnitarioRD = selectedItemData?.costoUnitarioRD || 0
  const costoTotalRecepcionRD = costoUnitarioRD * (formData.cantidadRecibida || 0)

  useEffect(() => {
    if (inventarioToEdit) {
      setFormData({
        idRecepcion: inventarioToEdit.idRecepcion,
        ocId: inventarioToEdit.ocId,
        itemId: inventarioToEdit.itemId || "",
        fechaLlegada: new Date(inventarioToEdit.fechaLlegada),
        bodegaInicial: inventarioToEdit.bodegaInicial,
        cantidadRecibida: inventarioToEdit.cantidadRecibida,
        notas: inventarioToEdit.notas || "",
      })
    } else {
      setFormData({
        idRecepcion: "",
        ocId: "",
        itemId: "",
        fechaLlegada: undefined,
        bodegaInicial: "",
        cantidadRecibida: undefined,
        notas: "",
      })
    }
  }, [inventarioToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones (en modo creación, idRecepcion no es requerido ya que se genera automáticamente)
      if (isEditMode && !formData.idRecepcion) {
        throw new Error("El ID de recepción es requerido en modo edición")
      }

      if (!formData.ocId || !formData.fechaLlegada ||
          !formData.bodegaInicial || !formData.cantidadRecibida) {
        throw new Error("Por favor completa todos los campos requeridos")
      }

      const payload = {
        ...(isEditMode ? { idRecepcion: formData.idRecepcion } : {}),
        ocId: formData.ocId,
        itemId: formData.itemId || null,
        fechaLlegada: formData.fechaLlegada,
        bodegaInicial: formData.bodegaInicial,
        cantidadRecibida: formData.cantidadRecibida,
        costoUnitarioFinalRD: costoUnitarioRD,
        costoTotalRecepcionRD: costoTotalRecepcionRD,
        notas: formData.notas || null,
      }

      const url = isEditMode
        ? `/api/inventario-recibido/${inventarioToEdit.id}`
        : "/api/inventario-recibido"
      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || `Error al ${isEditMode ? "actualizar" : "crear"} el inventario`)
      }

      addToast({
        type: "success",
        title: isEditMode ? "Inventario actualizado" : "Inventario creado",
        description: `Recepción ${result.data?.idRecepcion || formData.idRecepcion} ${isEditMode ? "actualizada" : "creada"} exitosamente`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al procesar el inventario"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogClose onClose={handleCancel} />
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Recepción de Inventario" : "Nueva Recepción de Inventario"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* ID Recepción - Solo mostrar en modo edición */}
            {isEditMode && (
              <div>
                <label htmlFor="idRecepcion" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Recepción
                </label>
                <Input
                  id="idRecepcion"
                  value={formData.idRecepcion}
                  disabled={true}
                  className="bg-gray-100"
                />
              </div>
            )}

            <div>
              <label htmlFor="ocId" className="block text-sm font-medium text-gray-700 mb-1">
                Orden de Compra <span className="text-red-500">*</span>
              </label>
              <Select
                options={ocsOptions}
                value={formData.ocId || ""}
                onChange={(value) => setFormData({ ...formData, ocId: value, itemId: "" })}
                placeholder={loadingOcs ? "Cargando OCs..." : "Selecciona una OC"}
                disabled={loading || loadingOcs}
              />
            </div>

            {/* Selector de Producto/Item */}
            {formData.ocId && itemsOptions.length > 0 && (
              <div>
                <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 mb-1">
                  Producto (opcional)
                </label>
                <Select
                  options={[
                    { value: "", label: "Todos los productos de la orden" },
                    ...itemsOptions
                  ]}
                  value={formData.itemId || ""}
                  onChange={(value) => setFormData({ ...formData, itemId: value })}
                  placeholder="Selecciona un producto específico"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si seleccionas un producto, el costo se calculará específicamente para ese producto
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fechaLlegada" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Llegada <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  id="fechaLlegada"
                  value={formData.fechaLlegada}
                  onChange={(date) => setFormData({ ...formData, fechaLlegada: date || undefined })}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="bodegaInicial" className="block text-sm font-medium text-gray-700 mb-1">
                  Bodega Inicial <span className="text-red-500">*</span>
                </label>
                <Select
                  options={bodegasOptions}
                  value={formData.bodegaInicial || ""}
                  onChange={(value) => setFormData({ ...formData, bodegaInicial: value })}
                  placeholder="Selecciona bodega"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="cantidadRecibida" className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Recibida <span className="text-red-500">*</span>
              </label>
              <Input
                id="cantidadRecibida"
                type="number"
                min="1"
                step="1"
                value={formData.cantidadRecibida ?? ""}
                onChange={(e) => setFormData({ ...formData, cantidadRecibida: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Ej: 500"
                disabled={loading}
              />
            </div>

            {/* Cálculos Automáticos */}
            {selectedItemData && formData.itemId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Costos del Producto: {selectedItemData.sku}
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Costo FOB RD$
                    </label>
                    <div className="text-base font-semibold text-gray-900">
                      RD$ {selectedItemData.costoFOBRD.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Total del lote
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Gastos Distribuidos
                    </label>
                    <div className="text-base font-semibold text-gray-900">
                      RD$ {selectedItemData.gastosLogisticosRD.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedItemData.porcentajeFOB.toFixed(1)}% del total
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Costo Unitario
                    </label>
                    <div className="text-base font-semibold text-blue-700">
                      RD$ {costoUnitarioRD.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Por unidad
                    </p>
                  </div>
                </div>
                {formData.cantidadRecibida && formData.cantidadRecibida > 0 && (
                  <div className="pt-3 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">
                        Costo Total de Esta Recepción:
                      </label>
                      <div className="text-lg font-bold text-green-700">
                        RD$ {costoTotalRecepcionRD.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.cantidadRecibida} unidades × RD$ {costoUnitarioRD.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje cuando no hay item seleccionado */}
            {formData.ocId && !formData.itemId && selectedOcData && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  No has seleccionado un producto específico. El costo se calculará como promedio de toda la orden.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <Textarea
                id="notas"
                value={formData.notas || ""}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Notas adicionales sobre la recepción..."
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                isEditMode ? "Actualizar Recepción" : "Crear Recepción"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
