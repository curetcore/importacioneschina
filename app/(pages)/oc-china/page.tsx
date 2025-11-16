"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Search, Plus, Eye, ClipboardList, Calendar, Package, DollarSign } from "lucide-react"
import { OCChinaForm } from "@/components/forms/OCChinaForm"
import { AirtableTable, TableBadge, TableCount } from "@/components/ui/airtable-table"

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
          <CardContent className="overflow-hidden">
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
              <AirtableTable
                columns={[
                  {
                    key: "oc",
                    header: "Código OC",
                    minWidth: "140px",
                    sortable: true,
                    render: (value) => (
                      <div className="flex items-center gap-2">
                        <ClipboardList size={16} className="text-gray-400" />
                        <span className="font-semibold text-gray-900">{value}</span>
                      </div>
                    ),
                  },
                  {
                    key: "proveedor",
                    header: "Proveedor",
                    minWidth: "180px",
                    sortable: true,
                    render: (value) => <span className="text-gray-700 font-medium">{value}</span>,
                  },
                  {
                    key: "fechaOC",
                    header: "Fecha",
                    minWidth: "130px",
                    sortable: true,
                    render: (value) => (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{formatDate(value)}</span>
                      </div>
                    ),
                  },
                  {
                    key: "categoriaPrincipal",
                    header: "Categoría",
                    minWidth: "140px",
                    sortable: true,
                    render: (value) => <TableBadge>{value}</TableBadge>,
                  },
                  {
                    key: "_count",
                    header: "Productos",
                    minWidth: "110px",
                    align: "center",
                    render: (value) => <TableCount count={value.items} variant="blue" />,
                  },
                  {
                    key: "items",
                    header: "Unidades",
                    minWidth: "110px",
                    align: "right",
                    render: (_, row) => {
                      const { cantidadTotal } = calculateOCTotals(row)
                      return (
                        <div className="flex items-center justify-end gap-2">
                          <Package size={14} className="text-gray-400" />
                          <span className="font-semibold text-gray-900">{cantidadTotal.toLocaleString()}</span>
                        </div>
                      )
                    },
                  },
                  {
                    key: "costoFOB",
                    header: "Costo FOB",
                    minWidth: "140px",
                    align: "right",
                    sortable: true,
                    render: (_, row) => {
                      const { costoFOBTotal } = calculateOCTotals(row)
                      return (
                        <div className="flex items-center justify-end gap-2">
                          <DollarSign size={14} className="text-green-600" />
                          <span className="font-bold text-gray-900">{formatCurrency(costoFOBTotal)}</span>
                        </div>
                      )
                    },
                  },
                  {
                    key: "_count",
                    header: "Estado",
                    minWidth: "100px",
                    align: "center",
                    render: (value) => (
                      <div className="flex items-center justify-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${value.pagosChina > 0 ? "bg-green-500" : "bg-gray-300"}`}
                          title={value.pagosChina > 0 ? "Tiene pagos" : "Sin pagos"}
                        />
                        <div
                          className={`w-2 h-2 rounded-full ${value.gastosLogisticos > 0 ? "bg-yellow-500" : "bg-gray-300"}`}
                          title={value.gastosLogisticos > 0 ? "Tiene gastos" : "Sin gastos"}
                        />
                        <div
                          className={`w-2 h-2 rounded-full ${value.inventarioRecibido > 0 ? "bg-blue-500" : "bg-gray-300"}`}
                          title={value.inventarioRecibido > 0 ? "Tiene inventario" : "Sin inventario"}
                        />
                      </div>
                    ),
                  },
                  {
                    key: "id",
                    header: "Acciones",
                    minWidth: "100px",
                    align: "center",
                    render: (value) => (
                      <Button
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/ordenes/${value}`)
                        }}
                        className="gap-1.5 px-3 py-1.5 text-xs h-7 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye size={14} />
                        Ver
                      </Button>
                    ),
                  },
                ]}
                data={ocs}
                minWidth="1400px"
              />
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
