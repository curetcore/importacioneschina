"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectOption } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/datepicker"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { inventarioRecibidoSchema, InventarioRecibidoInput, bodegas } from "@/lib/validations"
import { Loader2 } from "lucide-react"

interface InventarioRecibido {
  id: string
  idRecepcion: string
  ocId: string
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
  const [errors, setErrors] = useState<Partial<Record<keyof InventarioRecibidoInput, string>>>({})
  const isEditMode = !!inventarioToEdit

  const [ocsOptions, setOcsOptions] = useState<SelectOption[]>([])
  const [loadingOcs, setLoadingOcs] = useState(false)

  const [formData, setFormData] = useState<Partial<InventarioRecibidoInput>>({
    idRecepcion: "",
    ocId: "",
    fechaLlegada: undefined,
    bodegaInicial: "",
    cantidadRecibida: undefined,
    notas: "",
  })

  useEffect(() => {
    if (open) {
      setLoadingOcs(true)
      fetch("/api/oc-china")
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setOcsOptions(result.data.map((oc: any) => ({ value: oc.id, label: `${oc.oc} - ${oc.proveedor}` })))
          }
          setLoadingOcs(false)
        })
        .catch(() => setLoadingOcs(false))
    }
  }, [open])

  useEffect(() => {
    if (inventarioToEdit) {
      setFormData({
        idRecepcion: inventarioToEdit.idRecepcion,
        ocId: inventarioToEdit.ocId,
        fechaLlegada: new Date(inventarioToEdit.fechaLlegada),
        bodegaInicial: inventarioToEdit.bodegaInicial,
        cantidadRecibida: inventarioToEdit.cantidadRecibida,
        notas: inventarioToEdit.notas || "",
      })
    } else {
      setFormData({
        idRecepcion: "",
        ocId: "",
        fechaLlegada: undefined,
        bodegaInicial: "",
        cantidadRecibida: undefined,
        notas: "",
      })
    }
    setErrors({})
  }, [inventarioToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      const validatedData = inventarioRecibidoSchema.parse(formData)

      const url = isEditMode ? `/api/inventario-recibido/${inventarioToEdit.id}` : "/api/inventario-recibido"
      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || `Error al ${isEditMode ? "actualizar" : "crear"} el inventario`)
      }

      addToast({
        type: "success",
        title: isEditMode ? "Inventario actualizado" : "Inventario creado",
        description: `Recepción ${validatedData.idRecepcion} ${isEditMode ? "actualizada" : "creada"} exitosamente`,
      })

      setFormData({ idRecepcion: "", ocId: "", fechaLlegada: undefined, bodegaInicial: "", cantidadRecibida: undefined, notas: "" })
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      if (error.errors) {
        const validationErrors: Partial<Record<keyof InventarioRecibidoInput, string>> = {}
        error.errors.forEach((err: any) => {
          validationErrors[err.path[0] as keyof InventarioRecibidoInput] = err.message
        })
        setErrors(validationErrors)
      } else {
        addToast({ type: "error", title: "Error", description: error.message || "Error al procesar el inventario" })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({ idRecepcion: "", ocId: "", fechaLlegada: undefined, bodegaInicial: "", cantidadRecibida: undefined, notas: "" })
    setErrors({})
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
            <div>
              <label htmlFor="idRecepcion" className="block text-sm font-medium text-gray-700 mb-1">
                ID Recepción <span className="text-red-500">*</span>
              </label>
              <Input
                id="idRecepcion"
                value={formData.idRecepcion}
                onChange={(e) => setFormData({ ...formData, idRecepcion: e.target.value })}
                error={errors.idRecepcion}
                placeholder="Ej: REC-2024-001"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="ocId" className="block text-sm font-medium text-gray-700 mb-1">
                Orden de Compra <span className="text-red-500">*</span>
              </label>
              <Select
                options={ocsOptions}
                value={formData.ocId || ""}
                onChange={(value) => setFormData({ ...formData, ocId: value })}
                error={errors.ocId}
                placeholder={loadingOcs ? "Cargando OCs..." : "Selecciona una OC"}
                disabled={loading || loadingOcs}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fechaLlegada" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Llegada <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  id="fechaLlegada"
                  value={formData.fechaLlegada}
                  onChange={(date) => setFormData({ ...formData, fechaLlegada: date || undefined })}
                  error={errors.fechaLlegada}
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
                  error={errors.bodegaInicial}
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
                error={errors.cantidadRecibida}
                placeholder="Ej: 500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <Textarea
                id="notas"
                value={formData.notas || ""}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                error={errors.notas}
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
