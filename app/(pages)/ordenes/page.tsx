"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectOption } from "@/components/ui/select"
import { OCChinaForm } from "@/components/forms/OCChinaForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Plus, Edit, Trash2, Search, X, Eye, ClipboardList } from "lucide-react"

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
      const response = await fetch(`/api/oc-china/${ocToDelete.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar la orden")
      }

      addToast({
        type: "success",
        title: "Orden eliminada",
        description: `Orden ${ocToDelete.oc} eliminada exitosamente`,
      })

      setOcToDelete(null)
      fetchOCs(currentPage)
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al eliminar la orden",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setOcToEdit(null)
  }

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <ClipboardList size={18} />
              Órdenes ({ocs.length})
            </CardTitle>
            <Button
              onClick={() => setFormOpen(true)}
              variant="outline"
              className="h-8 w-8 p-0"
            >
              <Plus size={16} />
            </Button>
          </CardHeader>
          <CardContent>
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

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">OC</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Proveedor</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Categoría</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Productos</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Unidades</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Costo FOB</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ocs.map((oc) => {
                    const totalUnidades = oc.items?.reduce((sum, item) => sum + item.cantidadTotal, 0) || 0
                    const totalFOB = oc.items?.reduce((sum, item) => sum + item.subtotalUSD, 0) || 0
                    const numProductos = oc.items?.length || 0

                    return (
                      <tr key={oc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{oc.oc}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{oc.proveedor}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(oc.fechaOC)}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{oc.categoriaPrincipal}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900">{numProductos}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900">{totalUnidades.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">{formatCurrency(totalFOB, "USD")}</td>
                        <td className="py-3 px-4">
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
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
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

        <ConfirmDialog
          open={!!ocToDelete}
          onOpenChange={(open) => !open && setOcToDelete(null)}
          onConfirm={handleDelete}
          title="Eliminar Orden"
          description={`¿Estás seguro de eliminar la orden ${ocToDelete?.oc}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          loading={deleteLoading}
        />
      </div>
    </MainLayout>
  )
}
