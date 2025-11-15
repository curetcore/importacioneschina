"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectOption } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/datepicker"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { ocChinaSchema, OCChinaInput, proveedores, categorias } from "@/lib/validations"
import { apiPost, apiPut, getErrorMessage } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

interface OCChina {
  id: string
  oc: string
  proveedor: string
  fechaOC: string
  categoriaPrincipal: string
  cantidadOrdenada: number
  costoFOBTotalUSD: number
  descripcionLote?: string | null
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
  const [errors, setErrors] = useState<Partial<Record<keyof OCChinaInput, string>>>({})
  const isEditMode = !!ocToEdit

  const [formData, setFormData] = useState<Partial<OCChinaInput>>({
    oc: "",
    proveedor: "",
    fechaOC: undefined,
    descripcionLote: "",
    categoriaPrincipal: "",
    cantidadOrdenada: undefined,
    costoFOBTotalUSD: undefined,
  })

  // Cargar datos cuando se abre en modo edición
  useEffect(() => {
    if (ocToEdit) {
      setFormData({
        oc: ocToEdit.oc,
        proveedor: ocToEdit.proveedor,
        fechaOC: new Date(ocToEdit.fechaOC),
        descripcionLote: ocToEdit.descripcionLote || "",
        categoriaPrincipal: ocToEdit.categoriaPrincipal,
        cantidadOrdenada: ocToEdit.cantidadOrdenada,
        costoFOBTotalUSD: ocToEdit.costoFOBTotalUSD,
      })
    } else {
      setFormData({
        oc: "",
        proveedor: "",
        fechaOC: undefined,
        descripcionLote: "",
        categoriaPrincipal: "",
        cantidadOrdenada: undefined,
        costoFOBTotalUSD: undefined,
      })
    }
    setErrors({})
  }, [ocToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validar con Zod
      const validatedData = ocChinaSchema.parse(formData)

      // Enviar al API con manejo mejorado de errores
      const result = isEditMode
        ? await apiPut(`/api/oc-china/${ocToEdit.id}`, validatedData, { timeout: 15000 })
        : await apiPost("/api/oc-china", validatedData, { timeout: 15000 })

      if (!result.success) {
        throw new Error(result.error || `Error al ${isEditMode ? "actualizar" : "crear"} la orden`)
      }

      // Éxito
      addToast({
        type: "success",
        title: isEditMode ? "Orden actualizada" : "Orden creada",
        description: `Orden ${validatedData.oc} ${isEditMode ? "actualizada" : "creada"} exitosamente`,
      })

      // Resetear formulario
      setFormData({
        oc: "",
        proveedor: "",
        fechaOC: undefined,
        descripcionLote: "",
        categoriaPrincipal: "",
        cantidadOrdenada: undefined,
        costoFOBTotalUSD: undefined,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      if (error.errors) {
        // Errores de validación Zod
        const validationErrors: Partial<Record<keyof OCChinaInput, string>> = {}
        error.errors.forEach((err: any) => {
          const field = err.path[0] as keyof OCChinaInput
          validationErrors[field] = err.message
        })
        setErrors(validationErrors)
      } else {
        // Otros errores (red, timeout, API, etc.)
        addToast({
          type: "error",
          title: "Error",
          description: getErrorMessage(error),
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      oc: "",
      proveedor: "",
      fechaOC: undefined,
      descripcionLote: "",
      categoriaPrincipal: "",
      cantidadOrdenada: undefined,
      costoFOBTotalUSD: undefined,
    })
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogClose onClose={handleCancel} />
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Orden de Compra" : "Nueva Orden de Compra"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Código OC */}
            <div>
              <label htmlFor="oc" className="block text-sm font-medium text-gray-700 mb-1">
                Código OC <span className="text-red-500">*</span>
              </label>
              <Input
                id="oc"
                value={formData.oc}
                onChange={(e) => setFormData({ ...formData, oc: e.target.value })}
                error={errors.oc}
                placeholder="Ej: OC-2024-001"
                disabled={loading}
              />
            </div>

            {/* Proveedor */}
            <div>
              <label htmlFor="proveedor" className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <Select
                options={proveedorOptions}
                value={formData.proveedor || ""}
                onChange={(value) => setFormData({ ...formData, proveedor: value })}
                error={errors.proveedor}
                placeholder="Selecciona un proveedor"
                disabled={loading}
              />
            </div>

            {/* Fecha OC */}
            <div>
              <label htmlFor="fechaOC" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha OC <span className="text-red-500">*</span>
              </label>
              <DatePicker
                id="fechaOC"
                value={formData.fechaOC}
                onChange={(date) => setFormData({ ...formData, fechaOC: date || undefined })}
                error={errors.fechaOC}
                disabled={loading}
              />
            </div>

            {/* Categoría Principal */}
            <div>
              <label htmlFor="categoriaPrincipal" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría Principal <span className="text-red-500">*</span>
              </label>
              <Select
                options={categoriaOptions}
                value={formData.categoriaPrincipal || ""}
                onChange={(value) => setFormData({ ...formData, categoriaPrincipal: value })}
                error={errors.categoriaPrincipal}
                placeholder="Selecciona una categoría"
                disabled={loading}
              />
            </div>

            {/* Cantidad Ordenada */}
            <div>
              <label htmlFor="cantidadOrdenada" className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Ordenada <span className="text-red-500">*</span>
              </label>
              <Input
                id="cantidadOrdenada"
                type="number"
                min="1"
                step="1"
                value={formData.cantidadOrdenada ?? ""}
                onChange={(e) => setFormData({ ...formData, cantidadOrdenada: e.target.value ? parseInt(e.target.value) : undefined })}
                error={errors.cantidadOrdenada}
                placeholder="Ej: 500"
                disabled={loading}
              />
            </div>

            {/* Costo FOB Total USD */}
            <div>
              <label htmlFor="costoFOBTotalUSD" className="block text-sm font-medium text-gray-700 mb-1">
                Costo FOB Total (USD) <span className="text-red-500">*</span>
              </label>
              <Input
                id="costoFOBTotalUSD"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.costoFOBTotalUSD ?? ""}
                onChange={(e) => setFormData({ ...formData, costoFOBTotalUSD: e.target.value ? parseFloat(e.target.value) : undefined })}
                error={errors.costoFOBTotalUSD}
                placeholder="Ej: 12500.00"
                disabled={loading}
              />
            </div>

            {/* Descripción Lote (Opcional) */}
            <div>
              <label htmlFor="descripcionLote" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción del Lote
              </label>
              <Textarea
                id="descripcionLote"
                value={formData.descripcionLote || ""}
                onChange={(e) => setFormData({ ...formData, descripcionLote: e.target.value })}
                error={errors.descripcionLote}
                placeholder="Descripción opcional del lote..."
                rows={3}
                disabled={loading}
              />
            </div>
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
