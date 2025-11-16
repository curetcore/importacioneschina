"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { Plus, Edit, CreditCard, Building2, Smartphone, DollarSign } from "lucide-react"
import { getErrorMessage, getErrorDetails } from "@/lib/api-client"

interface MetodoPago {
  id: string
  nombre: string
  tipo: string
  moneda: string
  banco?: string | null
  numeroCuenta?: string | null
  ultimos4Digitos?: string | null
  balanceActual?: number | null
  activo: boolean
  proveedor?: {
    id: string
    codigo: string
    nombre: string
  } | null
}

interface MetodosPagoListProps {
  onAdd: () => void
  onEdit: (metodoPago: MetodoPago) => void
}

export function MetodosPagoList({ onAdd, onEdit }: MetodosPagoListProps) {
  const { addToast } = useToast()
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMetodosPago = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/metodos-pago?activo=true")
      const result = await response.json()

      if (result.success) {
        setMetodosPago(result.data)
      } else {
        addToast({
          type: "error",
          title: "Error al cargar métodos de pago",
          description: result.error || "Error desconocido",
        })
      }
    } catch (error) {
      console.error("Error fetching metodos pago:", error)
      addToast({
        type: "error",
        title: "Error al cargar métodos de pago",
        description: getErrorMessage(error),
        details: getErrorDetails(error),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetodosPago()
  }, [])

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "banco":
        return <Building2 className="w-5 h-5" />
      case "tarjeta":
        return <CreditCard className="w-5 h-5" />
      case "monedero_digital":
        return <Smartphone className="w-5 h-5" />
      default:
        return <DollarSign className="w-5 h-5" />
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "banco":
        return "Cuenta Bancaria"
      case "tarjeta":
        return "Tarjeta"
      case "monedero_digital":
        return "Monedero Digital"
      default:
        return tipo
    }
  }

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "banco":
        return "bg-blue-100 text-blue-800"
      case "tarjeta":
        return "bg-green-100 text-green-800"
      case "monedero_digital":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">
        Cargando métodos de pago...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Métodos de Pago y Monederos ({metodosPago.length})
          </h2>
          <p className="text-sm text-gray-500">
            Gestiona cuentas bancarias, tarjetas y monederos digitales
          </p>
        </div>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Método
        </Button>
      </div>

      {metodosPago.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay métodos de pago registrados</p>
              <p className="text-xs mt-2">Haz clic en "Nuevo Método" para agregar uno</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metodosPago.map((metodoPago) => (
            <Card key={metodoPago.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getTipoBadgeColor(metodoPago.tipo)} bg-opacity-20`}>
                      {getTipoIcon(metodoPago.tipo)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{metodoPago.nombre}</CardTitle>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${getTipoBadgeColor(metodoPago.tipo)}`}>
                          {getTipoLabel(metodoPago.tipo)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(metodoPago)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {metodoPago.proveedor && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Proveedor:</span> {metodoPago.proveedor.nombre}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Moneda:</span>
                  <span className="font-medium">{metodoPago.moneda}</span>
                </div>

                {metodoPago.tipo === "banco" && metodoPago.banco && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Banco:</span> {metodoPago.banco}
                  </div>
                )}

                {metodoPago.tipo === "banco" && metodoPago.numeroCuenta && (
                  <div className="text-xs text-gray-600 font-mono">
                    ****{metodoPago.numeroCuenta.slice(-4)}
                  </div>
                )}

                {metodoPago.tipo === "tarjeta" && metodoPago.ultimos4Digitos && (
                  <div className="text-xs text-gray-600 font-mono">
                    **** **** **** {metodoPago.ultimos4Digitos}
                  </div>
                )}

                {metodoPago.balanceActual !== null && metodoPago.balanceActual !== undefined && (
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Balance:</span>
                    <span className="text-sm font-semibold text-green-700">
                      {metodoPago.moneda} {Number(metodoPago.balanceActual).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
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
