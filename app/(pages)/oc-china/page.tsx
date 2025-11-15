"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Search, Plus, Eye, ClipboardList } from "lucide-react"
import { OCChinaForm } from "@/components/forms/OCChinaForm"

interface OCChina {
  id: string
  oc: string
  proveedor: string
  fechaOC: string
  categoriaPrincipal: string
  descripcionLote?: string
  items: Array<{
    id: string
    sku: string
    nombre: string
    cantidadTotal: number
    precioUnitarioUSD: number
    subtotalUSD: number
  }>
  _count: {
    items: number
    pagosChina: number
    gastosLogisticos: number
    inventarioRecibido: number
  }
}

export default function OCChinaPage() {
  const router = useRouter()
  const [ocs, setOcs] = useState<OCChina[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [proveedorFilter, setProveedorFilter] = useState("")
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [proveedores, setProveedores] = useState<string[]>([])

  const loadOCs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (proveedorFilter) params.append("proveedor", proveedorFilter)

      const res = await fetch(`/api/oc-china?${params}`)
      const result = await res.json()

      if (result.success) {
        setOcs(result.data)
        // Extraer proveedores únicos para filtro
        const proveedoresSet = new Set(result.data.map((oc: OCChina) => oc.proveedor))
        const uniqueProveedores = Array.from(proveedoresSet) as string[]
        setProveedores(uniqueProveedores)
      }
    } catch (error) {
      console.error("Error loading OCs:", error)
    } finally {
      setLoading(false)
    }
  }

  // Opciones para el select de proveedores
  const proveedorOptions = [
    { value: "", label: "Todos los proveedores" },
    ...proveedores.map(prov => ({ value: prov, label: prov }))
  ]

  useEffect(() => {
    loadOCs()
  }, [searchTerm, proveedorFilter])

  const handleOCCreated = () => {
    setShowNewDialog(false)
    loadOCs()
  }

  // Calcular totales por OC
  const calculateOCTotals = (oc: OCChina) => {
    const cantidadTotal = oc.items.reduce((sum, item) => sum + item.cantidadTotal, 0)
    const costoFOBTotal = oc.items.reduce((sum, item) => sum + parseFloat(item.subtotalUSD.toString()), 0)
    return { cantidadTotal, costoFOBTotal }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Cargando órdenes...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Buscar por código OC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                options={proveedorOptions}
                value={proveedorFilter}
                onChange={setProveedorFilter}
                placeholder="Todos los proveedores"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabla de OCs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <ClipboardList size={18} />
              Órdenes ({ocs.length})
            </CardTitle>
            <Button
              onClick={() => setShowNewDialog(true)}
              variant="outline"
              className="gap-1.5 text-xs h-8 px-3"
            >
              <Plus size={14} />
              Nueva
            </Button>
          </CardHeader>
          <CardContent>
            {ocs.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes de compra registradas</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm || proveedorFilter
                    ? "No se encontraron resultados con los filtros aplicados"
                    : "Comienza registrando tu primera orden de compra"}
                </p>
                <Button onClick={() => setShowNewDialog(true)} className="gap-2">
                  <Plus size={18} />
                  Nueva OC
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: "1200px" }}>
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "120px" }}>Código OC</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "150px" }}>Proveedor</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "120px" }}>Fecha</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "130px" }}>Categoría</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "100px" }}>Productos</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "100px" }}>Unidades</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "130px" }}>Costo FOB</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "100px" }}>Estado</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "120px" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocs.map((oc) => {
                      const { cantidadTotal, costoFOBTotal } = calculateOCTotals(oc)
                      const hasPayments = oc._count.pagosChina > 0
                      const hasExpenses = oc._count.gastosLogisticos > 0
                      const hasInventory = oc._count.inventarioRecibido > 0

                      return (
                        <tr key={oc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900">{oc.oc}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{oc.proveedor}</td>
                          <td className="py-3 px-4 text-gray-600 text-sm whitespace-nowrap">{formatDate(oc.fechaOC)}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {oc.categoriaPrincipal}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                              {oc._count.items}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-gray-900 whitespace-nowrap">
                            {cantidadTotal.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900 whitespace-nowrap">
                            {formatCurrency(costoFOBTotal)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${hasPayments ? 'bg-green-500' : 'bg-gray-300'}`} title={hasPayments ? "Tiene pagos" : "Sin pagos"} />
                              <div className={`w-2 h-2 rounded-full ${hasExpenses ? 'bg-yellow-500' : 'bg-gray-300'}`} title={hasExpenses ? "Tiene gastos" : "Sin gastos"} />
                              <div className={`w-2 h-2 rounded-full ${hasInventory ? 'bg-blue-500' : 'bg-gray-300'}`} title={hasInventory ? "Tiene inventario" : "Sin inventario"} />
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                onClick={() => router.push(`/ordenes/${oc.id}`)}
                                className="gap-1 px-3 py-1.5 text-sm h-8"
                              >
                                <Eye size={16} />
                                Ver
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para nueva OC */}
      <OCChinaForm
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={handleOCCreated}
      />
    </MainLayout>
  )
}
