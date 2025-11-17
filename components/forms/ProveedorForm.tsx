"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { proveedorSchema, type ProveedorInput } from "@/lib/validations/proveedor"
import { getErrorMessage, getErrorDetails } from "@/lib/api-client"

interface Proveedor {
  id: string
  codigo: string
  nombre: string
  contactoPrincipal?: string | null
  email?: string | null
  telefono?: string | null
  whatsapp?: string | null
  wechat?: string | null
  pais: string
  ciudad?: string | null
  direccion?: string | null
  sitioWeb?: string | null
  categoriaProductos?: string | null
  tiempoEntregaDias?: number | null
  monedaPreferida?: string | null
  terminosPago?: string | null
  minimoOrden?: number | null
  notas?: string | null
  calificacion?: number | null
  activo: boolean
}

interface ProveedorFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  proveedorToEdit?: Proveedor | null
}

export function ProveedorForm({ open, onOpenChange, onSuccess, proveedorToEdit }: ProveedorFormProps) {
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProveedorInput>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      contactoPrincipal: "",
      email: "",
      telefono: "",
      whatsapp: "",
      wechat: "",
      pais: "China",
      ciudad: "",
      direccion: "",
      sitioWeb: "",
      categoriaProductos: "",
      tiempoEntregaDias: 30,
      monedaPreferida: "USD",
      terminosPago: "",
      minimoOrden: 0,
      notas: "",
      calificacion: 0,
      activo: true,
    },
  })

  useEffect(() => {
    if (proveedorToEdit) {
      reset({
        codigo: proveedorToEdit.codigo,
        nombre: proveedorToEdit.nombre,
        contactoPrincipal: proveedorToEdit.contactoPrincipal || "",
        email: proveedorToEdit.email || "",
        telefono: proveedorToEdit.telefono || "",
        whatsapp: proveedorToEdit.whatsapp || "",
        wechat: proveedorToEdit.wechat || "",
        pais: proveedorToEdit.pais,
        ciudad: proveedorToEdit.ciudad || "",
        direccion: proveedorToEdit.direccion || "",
        sitioWeb: proveedorToEdit.sitioWeb || "",
        categoriaProductos: proveedorToEdit.categoriaProductos || "",
        tiempoEntregaDias: proveedorToEdit.tiempoEntregaDias || undefined,
        monedaPreferida: (proveedorToEdit.monedaPreferida as "USD" | "CNY" | "EUR") || "USD",
        terminosPago: proveedorToEdit.terminosPago || "",
        minimoOrden: proveedorToEdit.minimoOrden || undefined,
        notas: proveedorToEdit.notas || "",
        calificacion: proveedorToEdit.calificacion || 0,
        activo: proveedorToEdit.activo,
      })
    } else {
      reset({
        codigo: "",
        nombre: "",
        contactoPrincipal: "",
        email: "",
        telefono: "",
        whatsapp: "",
        wechat: "",
        pais: "China",
        ciudad: "",
        direccion: "",
        sitioWeb: "",
        categoriaProductos: "",
        tiempoEntregaDias: 30,
        monedaPreferida: "USD",
        terminosPago: "",
        minimoOrden: 0,
        notas: "",
        calificacion: 0,
        activo: true,
      })
    }
  }, [proveedorToEdit, open, reset])

  const onSubmit = async (data: ProveedorInput) => {
    try {
      const url = proveedorToEdit ? `/api/proveedores/${proveedorToEdit.id}` : "/api/proveedores"
      const method = proveedorToEdit ? "PUT" : "POST"

      // Remove codigo for new proveedores (auto-generated)
      const dataToSend = proveedorToEdit
        ? data
        : Object.fromEntries(
            Object.entries(data).filter(([key]) => key !== "codigo")
          )

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al guardar proveedor")
      }

      addToast({
        type: "success",
        title: proveedorToEdit ? "Proveedor actualizado" : "Proveedor creado",
        description: `${data.nombre} ${proveedorToEdit ? "actualizado" : "creado"} exitosamente`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: getErrorMessage(error),
        details: getErrorDetails(error),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {proveedorToEdit ? "Editar Proveedor" : "Nuevo Proveedor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 px-6 pb-6">
          {/* Información básica */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Información Básica</h3>
            <div className="grid grid-cols-2 gap-6">
              {proveedorToEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código
                  </label>
                  <input
                    type="text"
                    disabled
                    {...register("codigo")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              )}
              <div className={proveedorToEdit ? "" : "col-span-2"}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  {...register("nombre")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nike China Factory"
                  disabled={isSubmitting}
                />
                {errors.nombre && (
                  <p className="text-xs text-red-600 mt-1">{errors.nombre.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Información de Contacto</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contacto Principal
                </label>
                <input
                  type="text"
                  {...register("contactoPrincipal")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  {...register("telefono")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="text"
                  {...register("whatsapp")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WeChat
                </label>
                <input
                  type="text"
                  {...register("wechat")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sitio Web
                </label>
                <input
                  type="url"
                  {...register("sitioWeb")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://..."
                  disabled={isSubmitting}
                />
                {errors.sitioWeb && (
                  <p className="text-xs text-red-600 mt-1">{errors.sitioWeb.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Ubicación</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                <input
                  type="text"
                  {...register("pais")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  {...register("ciudad")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  {...register("direccion")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Información comercial */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Información Comercial</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría de Productos
                </label>
                <input
                  type="text"
                  {...register("categoriaProductos")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Zapatos, Carteras, etc."
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo de Entrega (días)
                </label>
                <input
                  type="number"
                  {...register("tiempoEntregaDias", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda Preferida
                </label>
                <select
                  {...register("monedaPreferida")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mínimo de Orden
                </label>
                <input
                  type="number"
                  {...register("minimoOrden", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Términos de Pago
                </label>
                <input
                  type="text"
                  {...register("terminosPago")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50% anticipo, 50% antes de envío"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calificación (0-5)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  {...register("calificacion", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Notas Adicionales</h3>
            <div>
              <textarea
                {...register("notas")}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Información adicional sobre el proveedor..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : proveedorToEdit ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
