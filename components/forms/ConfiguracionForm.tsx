"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectOption } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { apiPost, apiPut, getErrorMessage, getErrorDetails } from "@/lib/api-client"
import { configuracionSchema, type ConfiguracionInput } from "@/lib/validations"
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
  { value: "proveedores", label: "Proveedores" },
]

export function ConfiguracionForm({
  open,
  onOpenChange,
  onSuccess,
  configToEdit,
  categoria
}: ConfiguracionFormProps) {
  const { addToast } = useToast()
  const isEditMode = !!configToEdit

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConfiguracionInput>({
    resolver: zodResolver(configuracionSchema),
    defaultValues: {
      categoria: categoria || "",
      valor: "",
      orden: 0,
    },
  })

  const categoriaValue = watch("categoria")

  // Reset form when dialog opens/closes or edit data changes
  useEffect(() => {
    if (configToEdit) {
      reset({
        categoria: configToEdit.categoria,
        valor: configToEdit.valor,
        orden: configToEdit.orden,
      })
    } else {
      reset({
        categoria: categoria || "",
        valor: "",
        orden: 0,
      })
    }
  }, [configToEdit, categoria, reset])

  const onSubmit = async (data: ConfiguracionInput) => {
    try {
      const result = isEditMode
        ? await apiPut(`/api/configuracion/${configToEdit.id}`, data, { timeout: 15000 })
        : await apiPost("/api/configuracion", data, { timeout: 15000 })

      if (!result.success) {
        throw new Error(result.error || `Error al ${isEditMode ? "actualizar" : "crear"} la configuración`)
      }

      addToast({
        type: "success",
        title: isEditMode ? "Configuración actualizada" : "Configuración creada",
        description: `${data.valor} ${isEditMode ? "actualizado" : "creado"} exitosamente`,
      })

      reset({ categoria: categoria || "", valor: "", orden: 0 })
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: getErrorMessage(error),
        details: getErrorDetails(error),
      })
    }
  }

  const handleCancel = () => {
    reset({ categoria: categoria || "", valor: "", orden: 0 })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogClose onClose={handleCancel} />
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Item" : "Nuevo Item"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              <Select
                options={categoriaOptions}
                value={categoriaValue}
                onChange={(value) => setValue("categoria", value)}
                placeholder="Selecciona una categoría"
                disabled={isSubmitting || isEditMode || !!categoria}
              />
              {errors.categoria && (
                <p className="text-xs text-red-600 mt-1">{errors.categoria.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
                Valor <span className="text-red-500">*</span>
              </label>
              <Input
                id="valor"
                {...register("valor")}
                placeholder="Ej: Zapatos"
                disabled={isSubmitting}
              />
              {errors.valor && (
                <p className="text-xs text-red-600 mt-1">{errors.valor.message}</p>
              )}
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
                {...register("orden")}
                placeholder="0"
                disabled={isSubmitting}
              />
              {errors.orden && (
                <p className="text-xs text-red-600 mt-1">{errors.orden.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Define el orden en que aparecerá en las listas</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
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
