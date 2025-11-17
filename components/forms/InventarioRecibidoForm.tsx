"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectOption } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/datepicker"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { distribuirGastosLogisticos } from "@/lib/calculations"
import { inventarioRecibidoSchema, type InventarioRecibidoInput } from "@/lib/validations"
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

export function InventarioRecibidoForm({ open, onOpenChange, onSuccess, inventarioToEdit }: InventarioRecibidoFormProps) {
  const { addToast } = useToast()
  const isEditMode = !!inventarioToEdit

  const [ocsOptions, setOcsOptions] = useState<SelectOption[]>([])
  const [loadingOcs, setLoadingOcs] = useState(false)

  // Opciones de configuración dinámica
  const [bodegasOptions, setBodegasOptions] = useState<SelectOption[]>([])
  const [loadingConfig, setLoadingConfig] = useState(false)

  const [itemsOptions, setItemsOptions] = useState<SelectOption[]>([])
  const [selectedOcData, setSelectedOcData] = useState<any>(null)
  const [selectedItemData, setSelectedItemData] = useState<any>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InventarioRecibidoInput>({
    resolver: zodResolver(inventarioRecibidoSchema),
    defaultValues: {
      idRecepcion: "",
      ocId: "",
      itemId: "",
      fechaLlegada: undefined,
      bodegaInicial: "",
      cantidadRecibida: undefined,
      notas: "",
    },
  })

  const ocIdValue = watch("ocId")
  const itemIdValue = watch("itemId")
  const fechaLlegadaValue = watch("fechaLlegada")
  const cantidadRecibidaValue = watch("cantidadRecibida")

  // Cargar lista de OCs y configuraciones
  useEffect(() => {
    if (open) {
      // Cargar OCs
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

      // Cargar configuraciones dinámicas
      setLoadingConfig(true)
      fetch("/api/configuracion?categoria=bodegas")
        .then(res => res.json())
        .then((result) => {
          if (result.success) {
            setBodegasOptions(result.data.map((item: any) => ({
              value: item.valor,
              label: item.valor
            })))
          }
          setLoadingConfig(false)
        })
        .catch(() => setLoadingConfig(false))
    }
  }, [open])

  // Cargar datos de la OC y sus items cuando se selecciona
  useEffect(() => {
    if (ocIdValue) {
      fetch(`/api/oc-china/${ocIdValue}`)
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
      setValue("itemId", "")
    }
  }, [ocIdValue, setValue])

  // Calcular costos cuando se selecciona un item
  useEffect(() => {
    if (selectedOcData && itemIdValue) {
      const item = selectedOcData.items?.find((i: any) => i.id === itemIdValue)
      if (item) {
        // Calcular distribución de gastos para obtener costo unitario
        const itemsConCostos = distribuirGastosLogisticos(
          selectedOcData.items,
          selectedOcData.gastosLogisticos || [],
          selectedOcData.pagosChina || []
        )
        const itemConCosto = itemsConCostos.find(i => i.id === itemIdValue)
        setSelectedItemData(itemConCosto || null)
      } else {
        setSelectedItemData(null)
      }
    } else {
      setSelectedItemData(null)
    }
  }, [selectedOcData, itemIdValue])

  // Calculos
  const costoUnitarioRD = selectedItemData?.costoUnitarioRD || 0
  const costoTotalRecepcionRD = costoUnitarioRD * (cantidadRecibidaValue || 0)

  useEffect(() => {
    if (inventarioToEdit) {
      reset({
        idRecepcion: inventarioToEdit.idRecepcion,
        ocId: inventarioToEdit.ocId,
        itemId: inventarioToEdit.itemId || "",
        fechaLlegada: new Date(inventarioToEdit.fechaLlegada),
        bodegaInicial: inventarioToEdit.bodegaInicial,
        cantidadRecibida: inventarioToEdit.cantidadRecibida,
        notas: inventarioToEdit.notas || "",
      })
    } else {
      reset({
        idRecepcion: "",
        ocId: "",
        itemId: "",
        fechaLlegada: undefined,
        bodegaInicial: "",
        cantidadRecibida: undefined,
        notas: "",
      })
    }
  }, [inventarioToEdit, open, reset])

  const onSubmit = async (data: InventarioRecibidoInput) => {
    try {
      const payload = {
        ...(isEditMode ? { idRecepcion: data.idRecepcion } : {}),
        ocId: data.ocId,
        itemId: data.itemId || null,
        fechaLlegada: data.fechaLlegada,
        bodegaInicial: data.bodegaInicial,
        cantidadRecibida: data.cantidadRecibida,
        costoUnitarioFinalRD: costoUnitarioRD,
        costoTotalRecepcionRD: costoTotalRecepcionRD,
        notas: data.notas || null,
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
        description: `Recepción ${result.data?.idRecepcion || data.idRecepcion} ${isEditMode ? "actualizada" : "creada"} exitosamente`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al procesar el inventario"
      })
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

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4">
            {/* ID Recepción - Solo mostrar en modo edición */}
            {isEditMode && (
              <div>
                <label htmlFor="idRecepcion" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Recepción
                </label>
                <Input
                  id="idRecepcion"
                  {...register("idRecepcion")}
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
                value={ocIdValue || ""}
                onChange={(value) => {
                  setValue("ocId", value)
                  setValue("itemId", "")
                }}
                placeholder={loadingOcs ? "Cargando OCs..." : "Selecciona una OC"}
                disabled={isSubmitting || loadingOcs}
              />
              {errors.ocId && (
                <p className="text-xs text-red-600 mt-1">{errors.ocId.message}</p>
              )}
            </div>

            {/* Selector de Producto/Item */}
            {ocIdValue && itemsOptions.length > 0 && (
              <div>
                <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 mb-1">
                  Producto (opcional)
                </label>
                <Select
                  options={[
                    { value: "", label: "Todos los productos de la orden" },
                    ...itemsOptions
                  ]}
                  value={itemIdValue || ""}
                  onChange={(value) => setValue("itemId", value)}
                  placeholder="Selecciona un producto específico"
                  disabled={isSubmitting}
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
                  value={fechaLlegadaValue}
                  onChange={(date) => setValue("fechaLlegada", date as any)}
                  disabled={isSubmitting}
                />
                {errors.fechaLlegada && (
                  <p className="text-xs text-red-600 mt-1">{errors.fechaLlegada.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="bodegaInicial" className="block text-sm font-medium text-gray-700 mb-1">
                  Bodega Inicial <span className="text-red-500">*</span>
                </label>
                <Select
                  options={bodegasOptions}
                  value={watch("bodegaInicial") || ""}
                  onChange={(value) => setValue("bodegaInicial", value)}
                  placeholder={loadingConfig ? "Cargando bodegas..." : "Selecciona bodega"}
                  disabled={isSubmitting || loadingConfig}
                />
                {errors.bodegaInicial && (
                  <p className="text-xs text-red-600 mt-1">{errors.bodegaInicial.message}</p>
                )}
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
                {...register("cantidadRecibida", { valueAsNumber: true })}
                placeholder="Ej: 500"
                disabled={isSubmitting}
              />
              {errors.cantidadRecibida && (
                <p className="text-xs text-red-600 mt-1">{errors.cantidadRecibida.message}</p>
              )}
            </div>

            {/* Cálculos Automáticos */}
            {selectedItemData && itemIdValue && (
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
                {cantidadRecibidaValue && cantidadRecibidaValue > 0 && (
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
                      {cantidadRecibidaValue} unidades × RD$ {costoUnitarioRD.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje cuando no hay item seleccionado */}
            {ocIdValue && !itemIdValue && selectedOcData && (
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
                {...register("notas")}
                placeholder="Notas adicionales sobre la recepción..."
                rows={3}
                disabled={isSubmitting}
              />
              {errors.notas && (
                <p className="text-xs text-red-600 mt-1">{errors.notas.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
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
