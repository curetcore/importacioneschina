"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { Plus, Edit, Trash2, Mail, Phone, MapPin, Star } from "lucide-react"
import { getErrorMessage, getErrorDetails } from "@/lib/api-client"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

interface Proveedor {
  id: string
  codigo: string
  nombre: string
  contactoPrincipal?: string | null
  email?: string | null
  telefono?: string | null
  pais: string
  ciudad?: string | null
  categoriaProductos?: string | null
  calificacion?: number | null
  activo: boolean
}

interface ProveedoresListProps {
  onAdd: () => void
  onEdit: (proveedor: Proveedor) => void
  onDelete: (proveedor: Proveedor) => void
}

export function ProveedoresList({ onAdd, onEdit, onDelete }: ProveedoresListProps) {
  const { addToast } = useToast()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProveedores = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/proveedores?activo=true")
      const result = await response.json()

      if (result.success) {
        setProveedores(result.data)
      } else {
        addToast({
          type: "error",
          title: "Error al cargar proveedores",
          description: result.error || "Error desconocido",
        })
      }
    } catch (error) {
      console.error("Error fetching proveedores:", error)
      addToast({
        type: "error",
        title: "Error al cargar proveedores",
        description: getErrorMessage(error),
        details: getErrorDetails(error),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProveedores()
  }, [])

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12 text-sm text-gray-500">Cargando proveedores...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Proveedores ({proveedores.length})
          </h2>
          <p className="text-sm text-gray-500">
            Gestiona tu lista de proveedores con información de contacto y estadísticas
          </p>
        </div>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Proveedor
        </Button>
      </div>

      {proveedores.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <p>No hay proveedores registrados</p>
              <p className="text-xs mt-2">Haz clic en "Nuevo Proveedor" para agregar uno</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proveedores.map(proveedor => (
            <Card key={proveedor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{proveedor.nombre}</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">{proveedor.codigo}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(proveedor)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onDelete(proveedor)}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {proveedor.contactoPrincipal && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Contacto:</span>
                    <span className="truncate">{proveedor.contactoPrincipal}</span>
                  </div>
                )}

                {proveedor.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{proveedor.email}</span>
                  </div>
                )}

                {proveedor.telefono && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{proveedor.telefono}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {proveedor.ciudad ? `${proveedor.ciudad}, ${proveedor.pais}` : proveedor.pais}
                  </span>
                </div>

                {proveedor.categoriaProductos && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {proveedor.categoriaProductos}
                    </span>
                  </div>
                )}

                {proveedor.calificacion !== null && proveedor.calificacion !== undefined && (
                  <div className="pt-2 border-t border-gray-100">
                    {renderStars(proveedor.calificacion)}
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
