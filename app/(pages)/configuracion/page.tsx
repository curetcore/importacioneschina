"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfiguracionForm } from "@/components/forms/ConfiguracionForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { Plus, Edit, Trash2 } from "lucide-react"
import { apiDelete, getErrorMessage, getErrorDetails } from "@/lib/api-client"

interface Configuracion {
  id: string
  categoria: string
  valor: string
  orden: number
  activo: boolean
}

interface ConfigGroup {
  categoria: string
  titulo: string
  descripcion: string
  items: Configuracion[]
}

const categoriaLabels: Record<string, { titulo: string; descripcion: string }> = {
  categorias: {
    titulo: "Categorías Principales",
    descripcion: "Categorías disponibles para las órdenes de compra",
  },
  tiposPago: {
    titulo: "Tipos de Pago",
    descripcion: "Tipos de pago disponibles para registrar",
  },
  metodosPago: {
    titulo: "Métodos de Pago",
    descripcion: "Métodos de pago disponibles",
  },
  bodegas: {
    titulo: "Bodegas",
    descripcion: "Bodegas disponibles para inventario",
  },
  tiposGasto: {
    titulo: "Tipos de Gasto",
    descripcion: "Tipos de gastos logísticos",
  },
}

export default function ConfiguracionPage() {
  const { addToast } = useToast()
  const [configuraciones, setConfiguraciones] = useState<ConfigGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [configToEdit, setConfigToEdit] = useState<Configuracion | null>(null)
  const [configToDelete, setConfigToDelete] = useState<Configuracion | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState<string>("")

  const fetchConfiguraciones = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/configuracion")
      const result = await response.json()

      if (result.success) {
        const grouped: ConfigGroup[] = Object.entries(result.data).map(([key, items]) => ({
          categoria: key,
          titulo: categoriaLabels[key]?.titulo || key,
          descripcion: categoriaLabels[key]?.descripcion || "",
          items: items as Configuracion[],
        }))
        setConfiguraciones(grouped)
      } else {
        // Si la API retorna success: false, mostrar error
        addToast({
          type: "error",
          title: "Error al cargar configuraciones",
          description: result.error || "Error desconocido",
          details: JSON.stringify(result, null, 2),
        })
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching configuraciones:", error)
      addToast({
        type: "error",
        title: "Error al cargar configuraciones",
        description: getErrorMessage(error),
        details: getErrorDetails(error),
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfiguraciones()
  }, [])

  const handleAdd = (categoria: string) => {
    setSelectedCategoria(categoria)
    setConfigToEdit(null)
    setFormOpen(true)
  }

  const handleEdit = (config: Configuracion) => {
    setSelectedCategoria("")
    setConfigToEdit(config)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!configToDelete) return

    setDeleteLoading(true)
    try {
      const result = await apiDelete(`/api/configuracion/${configToDelete.id}`)

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar la configuración")
      }

      addToast({
        type: "success",
        title: "Configuración eliminada",
        description: `${configToDelete.valor} eliminado exitosamente`,
      })

      setConfigToDelete(null)
      fetchConfiguraciones()
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: getErrorMessage(error),
        details: getErrorDetails(error),
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setConfigToEdit(null)
    setSelectedCategoria("")
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-sm text-gray-500">Cargando configuraciones...</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona las opciones y parámetros del sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configuraciones.map((config) => (
            <Card key={config.categoria}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{config.titulo}</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">{config.descripcion}</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-8 text-sm"
                    onClick={() => handleAdd(config.categoria)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {config.items.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-400">
                      No hay items configurados
                    </div>
                  ) : (
                    config.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <span>{item.valor}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => setConfigToDelete(item)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monedas Soportadas</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Monedas disponibles para pagos (fijo en el sistema)</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {["USD", "CNY", "RD$"].map((moneda) => (
                <div
                  key={moneda}
                  className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700 text-center font-medium"
                >
                  {moneda}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900">✓ Configuración Dinámica Activa</h3>
              <p className="text-xs text-green-700 mt-1">
                Ahora puedes gestionar las configuraciones directamente desde esta interfaz.
                Los cambios se aplicarán inmediatamente en todos los formularios del sistema.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfiguracionForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={() => {
          fetchConfiguraciones()
          handleFormClose()
        }}
        configToEdit={configToEdit}
        categoria={selectedCategoria}
      />

      <ConfirmDialog
        open={!!configToDelete}
        onOpenChange={(open) => !open && setConfigToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Configuración"
        description={`¿Estás seguro de eliminar "${configToDelete?.valor}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteLoading}
      />
    </MainLayout>
  )
}
