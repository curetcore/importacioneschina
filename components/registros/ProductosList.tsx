"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { Plus, Edit, DollarSign, Package as PackageIcon, Tag } from "lucide-react"
import { getErrorMessage, getErrorDetails } from "@/lib/api-client"

interface Producto {
  id: string
  sku: string
  nombre: string
  categoria?: string | null
  material?: string | null
  color?: string | null
  precioReferenciaUSD?: number | null
  precioReferenciaCNY?: number | null
  imagenPrincipal?: string | null
  activo: boolean
  proveedor?: {
    id: string
    codigo: string
    nombre: string
  } | null
}

interface ProductosListProps {
  onAdd: () => void
  onEdit: (producto: Producto) => void
}

export function ProductosList({ onAdd, onEdit }: ProductosListProps) {
  const { addToast } = useToast()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProductos = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/productos?activo=true")
      const result = await response.json()

      if (result.success) {
        setProductos(result.data)
      } else {
        addToast({
          type: "error",
          title: "Error al cargar productos",
          description: result.error || "Error desconocido",
        })
      }
    } catch (error) {
      console.error("Error fetching productos:", error)
      addToast({
        type: "error",
        title: "Error al cargar productos",
        description: getErrorMessage(error),
        details: getErrorDetails(error),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductos()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">
        Cargando productos...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Catálogo de Productos ({productos.length})
          </h2>
          <p className="text-sm text-gray-500">
            Productos maestros que puedes reutilizar en órdenes de compra
          </p>
        </div>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Button>
      </div>

      {productos.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <PackageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay productos registrados</p>
              <p className="text-xs mt-2">Haz clic en "Nuevo Producto" para agregar uno</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((producto) => (
            <Card key={producto.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {producto.imagenPrincipal && (
                      <img
                        src={producto.imagenPrincipal}
                        alt={producto.nombre}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    )}
                    <CardTitle className="text-base">{producto.nombre}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Tag className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">{producto.sku}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => onEdit(producto)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {producto.proveedor && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Proveedor:</span> {producto.proveedor.nombre}
                  </div>
                )}

                {producto.categoria && (
                  <div>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {producto.categoria}
                    </span>
                  </div>
                )}

                {(producto.material || producto.color) && (
                  <div className="text-xs text-gray-600">
                    {producto.material && <span>{producto.material}</span>}
                    {producto.material && producto.color && <span> • </span>}
                    {producto.color && <span>{producto.color}</span>}
                  </div>
                )}

                {(producto.precioReferenciaUSD || producto.precioReferenciaCNY) && (
                  <div className="pt-2 border-t border-gray-100 flex items-center gap-3 text-sm">
                    {producto.precioReferenciaUSD && (
                      <div className="flex items-center gap-1 text-green-700">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-medium">{producto.precioReferenciaUSD.toFixed(2)} USD</span>
                      </div>
                    )}
                    {producto.precioReferenciaCNY && (
                      <div className="flex items-center gap-1 text-orange-700">
                        <span className="text-xs">¥</span>
                        <span className="font-medium">{producto.precioReferenciaCNY.toFixed(2)} CNY</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
