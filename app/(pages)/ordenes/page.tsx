"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectOption } from "@/components/ui/select"
import { StatCard } from "@/components/ui/stat-card"
import { StatsGrid } from "@/components/ui/stats-grid"
import { OCChinaForm } from "@/components/forms/OCChinaForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { CascadeDeleteDialog } from "@/components/ui/cascade-delete-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"
import { formatDate, formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"
import { AttachmentsList } from "@/components/ui/attachments-list"
import { Plus, Edit, Trash2, Search, X, Eye, ClipboardList, Package, DollarSign, AlertCircle, Download } from "lucide-react"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

interface OCChinaItem {
  id: string
  sku: string
  nombre: string
  cantidadTotal: number
  precioUnitarioUSD: number
  subtotalUSD: number
}

interface OCChina {
  id: string
  oc: string
  proveedor: string
  fechaOC: string
  categoriaPrincipal: string
  descripcionLote?: string | null
  items?: OCChinaItem[]
  adjuntos?: FileAttachment[]
  _count?: {
    items: number
  }
}

export default function OrdenesPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [ocs, setOcs] = useState<OCChina[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [ocToEdit, setOcToEdit] = useState<OCChina | null>(null)
  const [ocToDelete, setOcToDelete] = useState<OCChina | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [proveedorFilter, setProveedorFilter] = useState("")
  const [proveedoresOptions, setProveedoresOptions] = useState<SelectOption[]>([])

  const fetchOCs = (page = 1) => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
    })
    if (searchQuery) params.append("search", searchQuery)
    if (proveedorFilter) params.append("proveedor", proveedorFilter)

    fetch(`/api/oc-china?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setOcs(result.data)
          setTotalPages(result.pagination.pages)
          setCurrentPage(result.pagination.page)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const fetchProveedores = () => {
    fetch("/api/oc-china")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          const uniqueProveedores = Array.from(new Set(result.data.map((oc: OCChina) => oc.proveedor)))
          setProveedoresOptions([
            { value: "", label: "Todos los proveedores" },
            ...uniqueProveedores.map((p) => ({ value: p as string, label: p as string })),
          ])
        }
      })
  }

  useEffect(() => {
    fetchProveedores()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    fetchOCs(1)
  }, [searchQuery, proveedorFilter])

  useEffect(() => {
    fetchOCs(currentPage)
  }, [currentPage])

  const handleEdit = (oc: OCChina) => {
    setOcToEdit(oc)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!ocToDelete) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/oc-china/${ocToDelete.id}?cascade=true`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar la orden")
      }

      addToast({
        type: "success",
        title: "Orden eliminada",
        description: result.message || `Orden ${ocToDelete.oc} eliminada exitosamente`,
      })

      setOcToDelete(null)
      fetchOCs(currentPage)
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar la orden",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setOcToEdit(null)
  }

  const handleExport = () => {
    if (ocs.length === 0) {
      addToast({
        type: "warning",
        title: "Sin datos",
        description: "No hay órdenes para exportar",
      })
      return
    }

    // Preparar datos para exportación
    const dataToExport = ocs.map((oc) => ({
      "OC": oc.oc,
      "Proveedor": oc.proveedor,
      "Fecha": formatDate(oc.fechaOC),
      "Categoría": oc.categoriaPrincipal,
      "Productos": oc.items?.length || 0,
      "Unidades": oc.items?.reduce((sum, item) => sum + item.cantidadTotal, 0) || 0,
      "Costo FOB (USD)": oc.items?.reduce((sum, item) => sum + parseFloat(item.subtotalUSD.toString()), 0) || 0,
    }))

    exportToExcel(dataToExport, "ordenes", "Órdenes de Compra")

    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: `${ocs.length} órdenes exportadas a Excel`,
    })
  }

  // Calcular KPIs en tiempo real desde los datos filtrados
  const stats = useMemo(() => {
    const totalOCs = ocs.length

    const totalItems = ocs.reduce((sum, oc) => sum + (oc.items?.length || 0), 0)

    const totalUnidades = ocs.reduce((sum, oc) => {
      return sum + (oc.items?.reduce((s, item) => s + item.cantidadTotal, 0) || 0)
    }, 0)

    const totalFOB = ocs.reduce((sum, oc) => {
      return sum + (oc.items?.reduce((s, item) => s + parseFloat(item.subtotalUSD.toString()), 0) || 0)
    }, 0)

    const pendientes = ocs.filter(oc => !oc._count || oc._count.items === 0).length

    return { totalOCs, totalItems, totalUnidades, totalFOB, pendientes }
  }, [ocs])

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-sm text-gray-500">Cargando...</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* KPIs Section */}
        <StatsGrid cols={4}>
          <StatCard
            icon={<ClipboardList className="w-4 h-4" />}
            label="Total Órdenes"
            value={stats.totalOCs}
            subtitle={searchQuery || proveedorFilter ? "Filtradas" : "Registradas"}
          />

          <StatCard
            icon={<Package className="w-4 h-4" />}
            label="Total Productos"
            value={stats.totalItems.toLocaleString()}
            subtitle={`${stats.totalUnidades.toLocaleString()} unidades`}
          />

          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="FOB Total"
            value={formatCurrency(stats.totalFOB, "USD")}
            subtitle={`Promedio: ${formatCurrency(stats.totalOCs > 0 ? stats.totalFOB / stats.totalOCs : 0, "USD")}/OC`}
          />

          <StatCard
            icon={<AlertCircle className="w-4 h-4" />}
            label="OCs Pendientes"
            value={stats.pendientes}
            subtitle="Sin items registrados"
          />
        </StatsGrid>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <ClipboardList size={18} />
              Órdenes ({ocs.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                className="gap-1.5 h-8 px-3 text-xs"
                disabled={ocs.length === 0}
              >
                <Download size={14} />
                Exportar
              </Button>
              <Button
                onClick={() => setFormOpen(true)}
                variant="outline"
                className="gap-1.5 h-8 px-3 text-xs"
              >
                <Plus size={14} />
                Crear Orden
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar por número de OC..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="w-64">
                <Select
                  options={proveedoresOptions}
                  value={proveedorFilter}
                  onChange={setProveedorFilter}
                  placeholder="Filtrar por proveedor"
                />
              </div>
            </div>

            {ocs.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes registradas</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || proveedorFilter
                    ? "No se encontraron resultados con los filtros aplicados"
                    : "Comienza creando tu primera orden de compra"}
                </p>
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Nueva Orden
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ minWidth: "1400px" }}>
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "120px" }}>OC</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "150px" }}>Proveedor</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "120px" }}>Fecha</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "130px" }}>Categoría</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "100px" }}>Productos</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "100px" }}>Unidades</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "130px" }}>Costo FOB</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "140px" }}>Adjuntos</th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ minWidth: "150px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ocs.map((oc) => {
                        const totalUnidades = oc.items?.reduce((sum, item) => sum + item.cantidadTotal, 0) || 0
                        const totalFOB = oc.items?.reduce((sum, item) => sum + item.subtotalUSD, 0) || 0
                        const numProductos = oc.items?.length || 0

                        return (
                          <tr key={oc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">{oc.oc}</td>
                            <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{oc.proveedor}</td>
                            <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(oc.fechaOC)}</td>
                            <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{oc.categoriaPrincipal}</td>
                            <td className="py-3 px-4 text-sm text-right text-gray-900 whitespace-nowrap">{numProductos}</td>
                            <td className="py-3 px-4 text-sm text-right text-gray-900 whitespace-nowrap">{totalUnidades.toLocaleString()}</td>
                            <td className="py-3 px-4 text-sm text-right font-medium text-gray-900 whitespace-nowrap">{formatCurrency(totalFOB, "USD")}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <AttachmentsList attachments={oc.adjuntos || []} compact />
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => router.push(`/ordenes/${oc.id}`)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEdit(oc)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setOcToDelete(oc)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td className="py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap" colSpan={4}>
                          Total
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">
                          {ocs.reduce((sum, oc) => sum + (oc.items?.length || 0), 0)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">
                          {ocs.reduce((sum, oc) => sum + (oc.items?.reduce((s, item) => s + item.cantidadTotal, 0) || 0), 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(ocs.reduce((sum, oc) => sum + (oc.items?.reduce((s, item) => s + parseFloat(item.subtotalUSD.toString()), 0) || 0), 0), "USD")}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap"></td>
                        <td className="py-3 px-4 whitespace-nowrap"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </CardContent>
        </Card>

        <OCChinaForm
          open={formOpen}
          onOpenChange={handleFormClose}
          onSuccess={() => {
            fetchOCs(currentPage)
            handleFormClose()
          }}
          ocToEdit={ocToEdit}
        />

        <CascadeDeleteDialog
          open={!!ocToDelete}
          onOpenChange={(open) => !open && setOcToDelete(null)}
          onConfirm={handleDelete}
          ocId={ocToDelete?.id || ""}
          ocNumber={ocToDelete?.oc || ""}
          loading={deleteLoading}
        />
      </div>
    </MainLayout>
  )
}
