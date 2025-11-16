"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { getErrorMessage, getErrorDetails } from "@/lib/api-client"

interface Producto {
  id: string
  sku: string
  nombre: string
  proveedorId?: string | null
  descripcion?: string | null
  material?: string | null
  color?: string | null
  categoria?: string | null
  precioReferenciaUSD?: number | null
  precioReferenciaCNY?: number | null
  especificaciones?: string | null
  imagenPrincipal?: string | null
  activo: boolean
}

interface Proveedor {
  id: string
  codigo: string
  nombre: string
}

interface ProductoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  productoToEdit?: Producto | null
}

export function ProductoForm({ open, onOpenChange, onSuccess, productoToEdit }: ProductoFormProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])

  const [formData, setFormData] = useState({
    sku: "",
    nombre: "",
    proveedorId: "",
    descripcion: "",
    material: "",
    color: "",
    categoria: "",
    precioReferenciaUSD: 0,
    precioReferenciaCNY: 0,
    especificaciones: "",
    imagenPrincipal: "",
  })

  useEffect(() => {
    if (open) {
      fetchProveedores()
    }
  }, [open])

  const fetchProveedores = async () => {
    try {
      const response = await fetch("/api/proveedores?activo=true")
      const result = await response.json()
      if (result.success) {
        setProveedores(result.data)
      }
    } catch (error) {
      console.error("Error fetching proveedores:", error)
    }
  }

  useEffect(() => {
    if (productoToEdit) {
      setFormData({
        sku: productoToEdit.sku,
        nombre: productoToEdit.nombre,
        proveedorId: productoToEdit.proveedorId || "",
        descripcion: productoToEdit.descripcion || "",
        material: productoToEdit.material || "",
        color: productoToEdit.color || "",
        categoria: productoToEdit.categoria || "",
        precioReferenciaUSD: productoToEdit.precioReferenciaUSD || 0,
        precioReferenciaCNY: productoToEdit.precioReferenciaCNY || 0,
        especificaciones: productoToEdit.especificaciones || "",
        imagenPrincipal: productoToEdit.imagenPrincipal || "",
      })
    } else {
      setFormData({
        sku: "",
        nombre: "",
        proveedorId: "",
        descripcion: "",
        material: "",
        color: "",
        categoria: "",
        precioReferenciaUSD: 0,
        precioReferenciaCNY: 0,
        especificaciones: "",
        imagenPrincipal: "",
      })
    }
  }, [productoToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = productoToEdit ? `/api/productos/${productoToEdit.id}` : "/api/productos"
      const method = productoToEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al guardar producto")
      }

      addToast({
        type: "success",
        title: productoToEdit ? "Producto actualizado" : "Producto creado",
        description: `${formData.nombre} ${productoToEdit ? "actualizado" : "creado"} exitosamente`,
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
            {productoToEdit ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Información Básica</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="ZAP-001"
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
                  placeholder="Zapato de cuero premium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <select
                  value={formData.proveedorId}
                  onChange={(e) => setFormData({ ...formData, proveedorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Zapatos, Carteras, etc."
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Descripción</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Descripción detallada del producto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material
                </label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Cuero sintético, Algodón, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Negro, Café, Beige, etc."
                />
              </div>
            </div>
          </div>

          {/* Precios de referencia */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Precios de Referencia</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio USD
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precioReferenciaUSD}
                  onChange={(e) => setFormData({ ...formData, precioReferenciaUSD: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio CNY
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precioReferenciaCNY}
                  onChange={(e) => setFormData({ ...formData, precioReferenciaCNY: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Imagen Principal
            </label>
            <input
              type="url"
              value={formData.imagenPrincipal}
              onChange={(e) => setFormData({ ...formData, imagenPrincipal: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          {/* Especificaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especificaciones Técnicas
            </label>
            <textarea
              value={formData.especificaciones}
              onChange={(e) => setFormData({ ...formData, especificaciones: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Especificaciones técnicas detalladas..."
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
              {loading ? "Guardando..." : productoToEdit ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
