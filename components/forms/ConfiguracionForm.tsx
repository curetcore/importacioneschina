"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectOption } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { apiPost, apiPut, getErrorMessage } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

interface Configuracion {
  id: string
  categoria: string
  valor: string
  orden: number
}

interface ConfiguracionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  configToEdit?: Configuracion | null
  categoria?: string
}

const categoriaOptions: SelectOption[] = [
  { value: "categorias", label: "Categorías Principales" },
  { value: "tiposPago", label: "Tipos de Pago" },
  { value: "metodosPago", label: "Métodos de Pago" },
  { value: "bodegas", label: "Bodegas" },
  { value: "tiposGasto", label: "Tipos de Gasto" },
]

export function ConfiguracionForm({
  open,
  onOpenChange,
  onSuccess,
  configToEdit,
  categoria
}: ConfiguracionFormProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const isEditMode = !!configToEdit

  const [formData, setFormData] = useState({
    categoria: categoria || "",
    valor: "",
    orden: 0,
  })

  useEffect(() => {
    if (configToEdit) {
      setFormData({
        categoria: configToEdit.categoria,
        valor: configToEdit.valor,
        orden: configToEdit.orden,
      })
    } else {
      setFormData({
        categoria: categoria || "",
        valor: "",
        orden: 0,
      })
    }
  }, [configToEdit, categoria])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.categoria) {
        throw new Error("Debes seleccionar una categoría")
      }
      if (!formData.valor.trim()) {
        throw new Error("El valor es requerido")
      }

      const result = isEditMode
        ? await apiPut(`/api/configuracion/${configToEdit.id}`, formData, { timeout: 15000 })
        : await apiPost("/api/configuracion", formData, { timeout: 15000 })

      if (!result.success) {
        throw new Error(result.error || `Error al ${isEditMode ? "actualizar" : "crear"} la configuración`)
      }

      addToast({
        type: "success",
        title: isEditMode ? "Configuración actualizada" : "Configuración creada",
        description: `${formData.valor} ${isEditMode ? "actualizado" : "creado"} exitosamente`,
      })

      setFormData({ categoria: categoria || "", valor: "", orden: 0 })
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
    setFormData({ categoria: categoria || "", valor: "", orden: 0 })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogClose onClose={handleCancel} />
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Item" : "Nuevo Item"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              <Select
                options={categoriaOptions}
                value={formData.categoria}
                onChange={(value) => setFormData({ ...formData, categoria: value })}
                placeholder="Selecciona una categoría"
                disabled={loading || isEditMode || !!categoria}
              />
            </div>

            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
                Valor <span className="text-red-500">*</span>
              </label>
              <Input
                id="valor"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="Ej: Zapatos"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="orden" className="block text-sm font-medium text-gray-700 mb-1">
                Orden
              </label>
              <Input
                id="orden"
                type="number"
                min="0"
                step="1"
                value={formData.orden}
                onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                placeholder="0"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Define el orden en que aparecerá en las listas</p>
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
                isEditMode ? "Actualizar" : "Crear"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
