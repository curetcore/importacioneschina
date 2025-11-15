"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectOption } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/datepicker"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { proveedores, categorias } from "@/lib/validations"
import { apiPost, apiPut, getErrorMessage } from "@/lib/api-client"
import { Loader2, Plus, Trash2, ChevronDown, ChevronUp, PackagePlus, Upload, FileText, X } from "lucide-react"

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
}

interface OCChina {
  id: string
  oc: string
  proveedor: string
  fechaOC: string
  categoriaPrincipal: string
  descripcionLote?: string | null
  archivoFactura?: string | null
  items?: OCChinaItem[]
}

interface OCChinaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  ocToEdit?: OCChina | null
}

const proveedorOptions: SelectOption[] = proveedores.map(p => ({
  value: p,
  label: p
}))

const categoriaOptions: SelectOption[] = categorias.map(c => ({
  value: c,
  label: c
}))

export function OCChinaForm({ open, onOpenChange, onSuccess, ocToEdit }: OCChinaFormProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const isEditMode = !!ocToEdit

  const [formData, setFormData] = useState({
    oc: "",
    proveedor: "",
    fechaOC: undefined as Date | undefined,
    descripcionLote: "",
    categoriaPrincipal: "",
    archivoFactura: "",
  })

  const [items, setItems] = useState<OCChinaItem[]>([])
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Cargar datos cuando se abre en modo edición
  useEffect(() => {
    if (ocToEdit) {
      setFormData({
        oc: ocToEdit.oc,
        proveedor: ocToEdit.proveedor,
        fechaOC: new Date(ocToEdit.fechaOC),
        descripcionLote: ocToEdit.descripcionLote || "",
        categoriaPrincipal: ocToEdit.categoriaPrincipal,
        archivoFactura: ocToEdit.archivoFactura || "",
      })
      setItems(ocToEdit.items || [])
      setExpandedItems(new Set())
      setSelectedFile(null)
    } else {
      setFormData({
        oc: "",
        proveedor: "",
        fechaOC: undefined,
        descripcionLote: "",
        categoriaPrincipal: "",
        archivoFactura: "",
      })
      setItems([])
      setExpandedItems(new Set())
      setSelectedFile(null)
    }
  }, [ocToEdit, open])

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
        const [talla, cantidad] = part.split(':').map(s => s.trim())
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        addToast({
          type: "error",
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos PDF e imágenes (JPG, PNG, WEBP)",
        })
        return
      }
      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        addToast({
          type: "error",
          title: "Archivo muy grande",
          description: "El archivo no debe exceder 10MB",
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setFormData({ ...formData, archivoFactura: "" })
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploadingFile(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tipo', 'oc-china')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Error al subir el archivo')
      }

      const data = await response.json()
      return data.filePath
    } catch (error) {
      console.error('Error uploading file:', error)
      addToast({
        type: "error",
        title: "Error al subir archivo",
        description: "No se pudo subir el archivo. Intenta de nuevo.",
      })
      return null
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones
      if (!formData.proveedor || !formData.fechaOC || !formData.categoriaPrincipal) {
        throw new Error("Por favor completa todos los campos requeridos")
      }

      // En modo edición, validar que exista el código OC
      if (isEditMode && !formData.oc) {
        throw new Error("El código OC es requerido en modo edición")
      }

      if (items.length === 0) {
        throw new Error("Debes agregar al menos un producto")
      }

      // Validar cada item
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item.sku || !item.nombre || !item.cantidadTotal || !item.precioUnitarioUSD) {
          throw new Error(`El producto #${i + 1} tiene campos incompletos (SKU, nombre, cantidad o precio)`)
        }
      }

      // Subir archivo si hay uno seleccionado
      let archivoFacturaPath = formData.archivoFactura
      if (selectedFile) {
        const uploadedPath = await uploadFile(selectedFile)
        if (uploadedPath) {
          archivoFacturaPath = uploadedPath
        }
      }

      // En modo creación, no enviar el campo 'oc' (se genera automáticamente)
      const payload = {
        ...(isEditMode ? formData : { ...formData, oc: undefined }),
        archivoFactura: archivoFacturaPath || null,
        items: items.map(item => ({
          sku: item.sku,
          nombre: item.nombre,
          material: item.material || null,
          color: item.color || null,
          especificaciones: item.especificaciones || null,
          tallaDistribucion: item.tallaDistribucion,
          cantidadTotal: item.cantidadTotal,
          precioUnitarioUSD: item.precioUnitarioUSD,
        })),
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
        description: `Orden ${result.data?.oc || formData.oc} ${isEditMode ? "actualizada" : "creada"} con ${items.length} producto(s)`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: getErrorMessage(error),
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={handleCancel} />
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Orden de Compra" : "Nueva Orden de Compra"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
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
                    <Input
                      value={formData.oc}
                      disabled={true}
                      className="bg-gray-100"
                    />
                  </div>
                )}

                {/* Proveedor */}
                <div className={isEditMode ? "" : "col-span-2"}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={proveedorOptions}
                    value={formData.proveedor || ""}
                    onChange={(value) => setFormData({ ...formData, proveedor: value })}
                    placeholder="Selecciona un proveedor"
                    disabled={loading}
                  />
                </div>

                {/* Fecha OC */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha OC <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formData.fechaOC}
                    onChange={(date) => setFormData({ ...formData, fechaOC: date || undefined })}
                    disabled={loading}
                  />
                </div>

                {/* Categoría Principal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría Principal <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={categoriaOptions}
                    value={formData.categoriaPrincipal || ""}
                    onChange={(value) => setFormData({ ...formData, categoriaPrincipal: value })}
                    placeholder="Selecciona una categoría"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Descripción Lote */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del Lote
                </label>
                <Textarea
                  value={formData.descripcionLote || ""}
                  onChange={(e) => setFormData({ ...formData, descripcionLote: e.target.value })}
                  placeholder="Descripción opcional del lote..."
                  rows={2}
                  disabled={loading}
                />
              </div>

              {/* Adjuntar Factura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Factura (PDF o imagen)
                </label>
                {!selectedFile && !formData.archivoFactura ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileChange}
                      disabled={loading || uploadingFile}
                      className="flex-1"
                    />
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="flex-1 text-sm truncate">
                      {selectedFile?.name || formData.archivoFactura?.split('/').pop()}
                    </span>
                    {formData.archivoFactura && !selectedFile && (
                      <a
                        href={`/api/files/${formData.archivoFactura.replace('uploads/', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Ver
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={removeFile}
                      disabled={loading || uploadingFile}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Formatos permitidos: PDF, JPG, PNG, WEBP (máx. 10MB)
                </p>
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
                  disabled={loading}
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
                              Producto #{index + 1}: {item.sku || "(Sin SKU)"} - {item.nombre || "(Sin nombre)"}
                            </span>
                          </div>
                          {!expandedItems.has(index) && (
                            <div className="ml-7 text-sm text-gray-500">
                              {item.cantidadTotal} unidades × ${item.precioUnitarioUSD.toFixed(2)} = ${(item.cantidadTotal * item.precioUnitarioUSD).toFixed(2)}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeItem(index)}
                          disabled={loading}
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
                                onChange={(e) => updateItem(index, 'sku', e.target.value)}
                                placeholder="Ej: 6018"
                                disabled={loading}
                              />
                            </div>

                            {/* Nombre */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre <span className="text-red-500">*</span>
                              </label>
                              <Input
                                value={item.nombre}
                                onChange={(e) => updateItem(index, 'nombre', e.target.value)}
                                placeholder="Ej: men leather shoes"
                                disabled={loading}
                              />
                            </div>

                            {/* Material */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Material
                              </label>
                              <Input
                                value={item.material || ""}
                                onChange={(e) => updateItem(index, 'material', e.target.value)}
                                placeholder="Ej: COW LEATHER + EVA SOLE"
                                disabled={loading}
                              />
                            </div>

                            {/* Color */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Color
                              </label>
                              <Input
                                value={item.color || ""}
                                onChange={(e) => updateItem(index, 'color', e.target.value)}
                                placeholder="Ej: brown leather + brown lace"
                                disabled={loading}
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
                                onChange={(e) => updateItem(index, 'cantidadTotal', parseInt(e.target.value) || 0)}
                                placeholder="Ej: 90"
                                disabled={loading}
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
                                onChange={(e) => updateItem(index, 'precioUnitarioUSD', parseFloat(e.target.value) || 0)}
                                placeholder="Ej: 25.50"
                                disabled={loading}
                              />
                            </div>
                          </div>

                          {/* Especificaciones */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Especificaciones
                            </label>
                            <Textarea
                              value={item.especificaciones || ""}
                              onChange={(e) => updateItem(index, 'especificaciones', e.target.value)}
                              placeholder="Notas adicionales sobre el producto..."
                              rows={2}
                              disabled={loading}
                            />
                          </div>

                          {/* Distribución de Tallas */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Distribución de Tallas (opcional)
                            </label>
                            <Input
                              value={item.tallaDistribucion ? JSON.stringify(item.tallaDistribucion) : ""}
                              onChange={(e) => updateItem(index, 'tallaDistribucion', parseTallaDistribucion(e.target.value))}
                              placeholder='Ej: {"38": 10, "39": 20, "40": 20} o 38:10 / 39:20 / 40:20'
                              disabled={loading}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Formato JSON o "talla:cantidad / talla:cantidad"
                            </p>
                          </div>

                          {/* Subtotal calculado */}
                          <div className="bg-blue-50 p-2 rounded text-sm">
                            <strong>Subtotal:</strong> ${(item.cantidadTotal * item.precioUnitarioUSD).toFixed(2)} USD
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
                    Total Unidades: <span className="text-blue-600">{totalUnidades.toLocaleString()}</span>
                  </div>
                  <div>
                    Total FOB: <span className="text-blue-600">${totalUSD.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                isEditMode ? "Actualizar Orden" : "Crear Orden"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
