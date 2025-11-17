"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectOption } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/datepicker"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/ui/file-upload"
import { useToast } from "@/components/ui/toast"
import { apiPost, apiPut, getErrorMessage } from "@/lib/api-client"
import { ocChinaSchema, type OCChinaInput } from "@/lib/validations"
import {
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  PackagePlus,
  Calculator,
} from "lucide-react"
import { CBMCalculator } from "@/components/ui/cbm-calculator"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

interface OCChinaItem {
  id?: string
  sku: string
  nombre: string
  material?: string
  color?: string
  especificaciones?: string
  tallaDistribucion?: Record<string, number> | null
  cantidadTotal: number
  precioUnitarioUSD: number
  subtotalUSD?: number
  pesoUnitarioKg?: number | null
  volumenUnitarioCBM?: number | null
}

interface OCChina {
  id: string
  oc: string
  proveedor: string
  fechaOC: string
  categoriaPrincipal: string
  descripcionLote?: string | null
  items?: OCChinaItem[]
  adjuntos?: FileAttachment[]
}

interface OCChinaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  ocToEdit?: OCChina | null
}

export function OCChinaForm({ open, onOpenChange, onSuccess, ocToEdit }: OCChinaFormProps) {
  const { addToast } = useToast()
  const isEditMode = !!ocToEdit

  // Opciones de configuración dinámica
  const [proveedorOptions, setProveedorOptions] = useState<SelectOption[]>([])
  const [categoriaOptions, setCategoriaOptions] = useState<SelectOption[]>([])
  const [loadingConfig, setLoadingConfig] = useState(false)

  // Items and attachments kept in separate state (complex dynamic arrays)
  const [items, setItems] = useState<OCChinaItem[]>([])
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [adjuntos, setAdjuntos] = useState<FileAttachment[]>([])

  // CBM Calculator state
  const [cbmCalcOpen, setCbmCalcOpen] = useState(false)
  const [cbmCalcItemIndex, setCbmCalcItemIndex] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OCChinaInput>({
    resolver: zodResolver(ocChinaSchema),
    defaultValues: {
      oc: undefined,
      proveedor: "",
      fechaOC: undefined,
      descripcionLote: "",
      categoriaPrincipal: "",
    },
  })

  const proveedorValue = watch("proveedor")
  const fechaOCValue = watch("fechaOC")
  const categoriaPrincipalValue = watch("categoriaPrincipal")

  // Cargar configuraciones dinámicas
  useEffect(() => {
    if (open) {
      setLoadingConfig(true)
      Promise.all([
        fetch("/api/proveedores?activo=true").then(res => res.json()),
        fetch("/api/configuracion?categoria=categorias").then(res => res.json()),
      ])
        .then(([proveedoresRes, categoriasRes]) => {
          if (proveedoresRes.success) {
            setProveedorOptions(
              proveedoresRes.data.map((item: any) => ({
                value: item.nombre,
                label: item.nombre,
              }))
            )
          }
          if (categoriasRes.success) {
            setCategoriaOptions(
              categoriasRes.data.map((item: any) => ({
                value: item.valor,
                label: item.valor,
              }))
            )
          }
          setLoadingConfig(false)
        })
        .catch(() => setLoadingConfig(false))
    }
  }, [open])

  // Cargar datos cuando se abre en modo edición
  useEffect(() => {
    if (ocToEdit) {
      reset({
        oc: ocToEdit.oc,
        proveedor: ocToEdit.proveedor,
        fechaOC: new Date(ocToEdit.fechaOC),
        descripcionLote: ocToEdit.descripcionLote || "",
        categoriaPrincipal: ocToEdit.categoriaPrincipal,
      })
      setItems(ocToEdit.items || [])
      setAdjuntos(ocToEdit.adjuntos || [])
      setExpandedItems(new Set())
    } else {
      reset({
        oc: undefined,
        proveedor: "",
        fechaOC: undefined,
        descripcionLote: "",
        categoriaPrincipal: "",
      })
      setItems([])
      setAdjuntos([])
      setExpandedItems(new Set())
    }
  }, [ocToEdit, open, reset])

  const toggleItemExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const addNewItem = () => {
    const newItem: OCChinaItem = {
      sku: "",
      nombre: "",
      material: "",
      color: "",
      especificaciones: "",
      tallaDistribucion: null,
      cantidadTotal: 0,
      precioUnitarioUSD: 0,
    }
    setItems([...items, newItem])
    const newExpanded = new Set(expandedItems)
    newExpanded.add(items.length)
    setExpandedItems(newExpanded)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
    const newExpanded = new Set(expandedItems)
    newExpanded.delete(index)
    setExpandedItems(newExpanded)
  }

  const updateItem = (index: number, field: keyof OCChinaItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleCBMCalculate = (cbm: number) => {
    if (cbmCalcItemIndex !== null) {
      updateItem(cbmCalcItemIndex, "volumenUnitarioCBM", cbm)
    }
  }

  const openCBMCalculator = (index: number) => {
    setCbmCalcItemIndex(index)
    setCbmCalcOpen(true)
  }

  const parseTallaDistribucion = (text: string): Record<string, number> | null => {
    if (!text.trim()) return null
    try {
      // Intentar parsear como JSON
      return JSON.parse(text)
    } catch {
      // Intentar parsear formato: "38:10 / 39:20 / 40:20"
      const parts = text.split(/[\/,]/).map(p => p.trim())
      const result: Record<string, number> = {}
      for (const part of parts) {
        const [talla, cantidad] = part.split(":").map(s => s.trim())
        if (talla && cantidad) {
          result[talla] = parseInt(cantidad) || 0
        }
      }
      return Object.keys(result).length > 0 ? result : null
    }
  }

  const calculateTotals = () => {
    const totalUnidades = items.reduce((sum, item) => sum + (item.cantidadTotal || 0), 0)
    const totalUSD = items.reduce((sum, item) => {
      const subtotal = (item.cantidadTotal || 0) * (item.precioUnitarioUSD || 0)
      return sum + subtotal
    }, 0)
    return { totalUnidades, totalUSD }
  }

  const { totalUnidades, totalUSD } = calculateTotals()

  const onSubmit = async (data: OCChinaInput) => {
    try {
      // Validar items (no manejados por react-hook-form)
      if (items.length === 0) {
        throw new Error("Debes agregar al menos un producto")
      }

      // Validar cada item
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item.sku || !item.nombre || !item.cantidadTotal || !item.precioUnitarioUSD) {
          throw new Error(
            `El producto #${i + 1} tiene campos incompletos (SKU, nombre, cantidad o precio)`
          )
        }
      }

      // En modo creación, no enviar el campo 'oc' (se genera automáticamente)
      const payload = {
        ...(isEditMode ? data : { ...data, oc: undefined }),
        items: items.map(item => ({
          sku: item.sku,
          nombre: item.nombre,
          material: item.material || null,
          color: item.color || null,
          especificaciones: item.especificaciones || null,
          tallaDistribucion: item.tallaDistribucion,
          cantidadTotal: item.cantidadTotal,
          precioUnitarioUSD: item.precioUnitarioUSD,
          pesoUnitarioKg: item.pesoUnitarioKg || null,
          volumenUnitarioCBM: item.volumenUnitarioCBM || null,
        })),
        adjuntos: adjuntos.length > 0 ? adjuntos : undefined,
      }

      const result = isEditMode
        ? await apiPut(`/api/oc-china/${ocToEdit.id}`, payload, { timeout: 15000 })
        : await apiPost("/api/oc-china", payload, { timeout: 15000 })

      if (!result.success) {
        throw new Error(result.error || `Error al ${isEditMode ? "actualizar" : "crear"} la orden`)
      }

      addToast({
        type: "success",
        title: isEditMode ? "Orden actualizada" : "Orden creada",
        description: `Orden ${result.data?.oc || data.oc} ${isEditMode ? "actualizada" : "creada"} con ${items.length} producto(s)`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: getErrorMessage(error),
      })
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={handleCancel} />
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Orden de Compra" : "Nueva Orden de Compra"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            {/* SECCIÓN 1: Información General */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">Información General</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Código OC - Solo mostrar en modo edición */}
                {isEditMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código OC
                    </label>
                    <Input {...register("oc")} disabled={true} className="bg-gray-100" />
                  </div>
                )}

                {/* Proveedor */}
                <div className={isEditMode ? "" : "col-span-2"}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={proveedorOptions}
                    value={proveedorValue || ""}
                    onChange={value => setValue("proveedor", value)}
                    placeholder={
                      loadingConfig ? "Cargando proveedores..." : "Selecciona un proveedor"
                    }
                    disabled={isSubmitting || loadingConfig}
                  />
                  {errors.proveedor && (
                    <p className="text-xs text-red-600 mt-1">{errors.proveedor.message}</p>
                  )}
                </div>

                {/* Fecha OC */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha OC <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={fechaOCValue}
                    onChange={date => setValue("fechaOC", date as any)}
                    disabled={isSubmitting}
                  />
                  {errors.fechaOC && (
                    <p className="text-xs text-red-600 mt-1">{errors.fechaOC.message}</p>
                  )}
                </div>

                {/* Categoría Principal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría Principal <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={categoriaOptions}
                    value={categoriaPrincipalValue || ""}
                    onChange={value => setValue("categoriaPrincipal", value)}
                    placeholder={
                      loadingConfig ? "Cargando categorías..." : "Selecciona una categoría"
                    }
                    disabled={isSubmitting || loadingConfig}
                  />
                  {errors.categoriaPrincipal && (
                    <p className="text-xs text-red-600 mt-1">{errors.categoriaPrincipal.message}</p>
                  )}
                </div>
              </div>

              {/* Descripción Lote */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del Lote
                </label>
                <Textarea
                  {...register("descripcionLote")}
                  placeholder="Descripción opcional del lote..."
                  rows={2}
                  disabled={isSubmitting}
                />
                {errors.descripcionLote && (
                  <p className="text-xs text-red-600 mt-1">{errors.descripcionLote.message}</p>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: Productos */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-base">Productos ({items.length})</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addNewItem}
                  disabled={isSubmitting}
                  className="gap-1.5 text-xs h-8 px-3"
                >
                  <PackagePlus size={14} />
                  Agregar
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay productos. Haz clic en "Agregar" para empezar.
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4">
                      {/* Encabezado del item */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleItemExpanded(index)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {expandedItems.has(index) ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                            <span className="font-medium">
                              Producto #{index + 1}: {item.sku || "(Sin SKU)"} -{" "}
                              {item.nombre || "(Sin nombre)"}
                            </span>
                          </div>
                          {!expandedItems.has(index) && (
                            <div className="ml-7 text-sm text-gray-500">
                              {item.cantidadTotal} unidades × ${item.precioUnitarioUSD.toFixed(2)} =
                              ${(item.cantidadTotal * item.precioUnitarioUSD).toFixed(2)}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeItem(index)}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Detalles expandibles */}
                      {expandedItems.has(index) && (
                        <div className="ml-7 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            {/* SKU */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                SKU <span className="text-red-500">*</span>
                              </label>
                              <Input
                                value={item.sku}
                                onChange={e => updateItem(index, "sku", e.target.value)}
                                placeholder="Ej: 6018"
                                disabled={isSubmitting}
                              />
                            </div>

                            {/* Nombre */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre <span className="text-red-500">*</span>
                              </label>
                              <Input
                                value={item.nombre}
                                onChange={e => updateItem(index, "nombre", e.target.value)}
                                placeholder="Ej: men leather shoes"
                                disabled={isSubmitting}
                              />
                            </div>

                            {/* Material */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Material
                              </label>
                              <Input
                                value={item.material || ""}
                                onChange={e => updateItem(index, "material", e.target.value)}
                                placeholder="Ej: COW LEATHER + EVA SOLE"
                                disabled={isSubmitting}
                              />
                            </div>

                            {/* Color */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Color
                              </label>
                              <Input
                                value={item.color || ""}
                                onChange={e => updateItem(index, "color", e.target.value)}
                                placeholder="Ej: brown leather + brown lace"
                                disabled={isSubmitting}
                              />
                            </div>

                            {/* Cantidad Total */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad Total <span className="text-red-500">*</span>
                              </label>
                              <Input
                                type="number"
                                min="1"
                                value={item.cantidadTotal || ""}
                                onChange={e =>
                                  updateItem(index, "cantidadTotal", parseInt(e.target.value) || 0)
                                }
                                placeholder="Ej: 90"
                                disabled={isSubmitting}
                              />
                            </div>

                            {/* Precio Unitario */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio Unitario (USD) <span className="text-red-500">*</span>
                              </label>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.precioUnitarioUSD || ""}
                                onChange={e =>
                                  updateItem(
                                    index,
                                    "precioUnitarioUSD",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="Ej: 25.50"
                                disabled={isSubmitting}
                              />
                            </div>

                            {/* Peso Unitario */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Peso Unitario (kg)
                                <span className="text-xs text-gray-500 ml-1">(opcional)</span>
                              </label>
                              <Input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={item.pesoUnitarioKg || ""}
                                onChange={e =>
                                  updateItem(
                                    index,
                                    "pesoUnitarioKg",
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                                placeholder="Ej: 0.850"
                                disabled={isSubmitting}
                              />
                              <p className="text-xs text-gray-500 mt-0.5">
                                Para distribución de gastos de flete
                              </p>
                            </div>

                            {/* Volumen Unitario */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Volumen Unitario (CBM)
                                <span className="text-xs text-gray-500 ml-1">(opcional)</span>
                              </label>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="0.000001"
                                  step="0.000001"
                                  value={item.volumenUnitarioCBM || ""}
                                  onChange={e =>
                                    updateItem(
                                      index,
                                      "volumenUnitarioCBM",
                                      e.target.value ? parseFloat(e.target.value) : null
                                    )
                                  }
                                  placeholder="Ej: 0.012"
                                  disabled={isSubmitting}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => openCBMCalculator(index)}
                                  disabled={isSubmitting}
                                  className="px-3"
                                  title="Calcular CBM"
                                >
                                  <Calculator className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Metro cúbico (L×W×H÷1,000,000)
                              </p>
                            </div>
                          </div>

                          {/* Especificaciones */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Especificaciones
                            </label>
                            <Textarea
                              value={item.especificaciones || ""}
                              onChange={e => updateItem(index, "especificaciones", e.target.value)}
                              placeholder="Notas adicionales sobre el producto..."
                              rows={2}
                              disabled={isSubmitting}
                            />
                          </div>

                          {/* Distribución de Tallas */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Distribución de Tallas (opcional)
                            </label>
                            <Input
                              value={
                                item.tallaDistribucion ? JSON.stringify(item.tallaDistribucion) : ""
                              }
                              onChange={e =>
                                updateItem(
                                  index,
                                  "tallaDistribucion",
                                  parseTallaDistribucion(e.target.value)
                                )
                              }
                              placeholder='Ej: {"38": 10, "39": 20, "40": 20} o 38:10 / 39:20 / 40:20'
                              disabled={isSubmitting}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Formato JSON o "talla:cantidad / talla:cantidad"
                            </p>
                          </div>

                          {/* Subtotal calculado */}
                          <div className="bg-blue-50 p-2 rounded text-sm">
                            <strong>Subtotal:</strong> $
                            {(item.cantidadTotal * item.precioUnitarioUSD).toFixed(2)} USD
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN 3: Totales */}
            {items.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-lg font-semibold">
                  <div>
                    Total Unidades:{" "}
                    <span className="text-blue-600">{totalUnidades.toLocaleString()}</span>
                  </div>
                  <div>
                    Total FOB: <span className="text-blue-600">${totalUSD.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN 4: Adjuntos */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-lg">Adjuntos</h3>
              <FileUpload
                module="oc-china"
                attachments={adjuntos}
                onChange={setAdjuntos}
                disabled={isSubmitting}
              />
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
              ) : isEditMode ? (
                "Actualizar Orden"
              ) : (
                "Crear Orden"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* CBM Calculator Modal */}
      <CBMCalculator
        open={cbmCalcOpen}
        onOpenChange={setCbmCalcOpen}
        onCalculate={handleCBMCalculate}
      />
    </Dialog>
  )
}
