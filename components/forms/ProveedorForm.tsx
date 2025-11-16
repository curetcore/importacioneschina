"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
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
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
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
  })

  useEffect(() => {
    if (proveedorToEdit) {
      setFormData({
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
        tiempoEntregaDias: proveedorToEdit.tiempoEntregaDias || 30,
        monedaPreferida: proveedorToEdit.monedaPreferida || "USD",
        terminosPago: proveedorToEdit.terminosPago || "",
        minimoOrden: proveedorToEdit.minimoOrden ? Number(proveedorToEdit.minimoOrden) : 0,
        notas: proveedorToEdit.notas || "",
        calificacion: proveedorToEdit.calificacion || 0,
      })
    } else {
      // Reset form for new proveedor
      setFormData({
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
      })
    }
  }, [proveedorToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = proveedorToEdit ? `/api/proveedores/${proveedorToEdit.id}` : "/api/proveedores"
      const method = proveedorToEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al guardar proveedor")
      }

      addToast({
        type: "success",
        title: proveedorToEdit ? "Proveedor actualizado" : "Proveedor creado",
        description: `${formData.nombre} ${proveedorToEdit ? "actualizado" : "creado"} exitosamente`,
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {proveedorToEdit ? "Editar Proveedor" : "Nuevo Proveedor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Información Básica</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  required
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="PROV-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Nike China Factory"
                />
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Información de Contacto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contacto Principal
                </label>
                <input
                  type="text"
                  value={formData.contactoPrincipal}
                  onChange={(e) => setFormData({ ...formData, contactoPrincipal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Ubicación</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País
                </label>
                <input
                  type="text"
                  value={formData.pais}
                  onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Información comercial */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Información Comercial</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría de Productos
                </label>
                <input
                  type="text"
                  value={formData.categoriaProductos}
                  onChange={(e) => setFormData({ ...formData, categoriaProductos: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Zapatos, Carteras, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo de Entrega (días)
                </label>
                <input
                  type="number"
                  value={formData.tiempoEntregaDias}
                  onChange={(e) => setFormData({ ...formData, tiempoEntregaDias: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda Preferida
                </label>
                <select
                  value={formData.monedaPreferida}
                  onChange={(e) => setFormData({ ...formData, monedaPreferida: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calificación (0-5)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={formData.calificacion}
                  onChange={(e) => setFormData({ ...formData, calificacion: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : proveedorToEdit ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
