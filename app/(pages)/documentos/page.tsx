"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FileText, Download, Edit2, Search, FileCheck, Receipt, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { showToast } from "@/lib/toast"
import { VirtualizedDataTable } from "@/components/ui/virtualized-data-table"
import { ColumnDef } from "@tanstack/react-table"
import MainLayout from "@/components/layout/MainLayout"
import { RenameDocumentModal } from "@/components/documentos/RenameDocumentModal"

interface DocumentWithSource {
  id: string
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
  origen: string
  categoria: string
  ocRelacionada?: string
  fechaAsociada?: string
}

export default function DocumentosPage() {
  const [activeTab, setActiveTab] = useState("todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [ocFilter, setOcFilter] = useState("")
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [documentToRename, setDocumentToRename] = useState<DocumentWithSource | null>(null)

  // Fetch documentos con filtros
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["documentos", activeTab, searchTerm, ocFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (activeTab !== "todos") {
        params.append("categoria", activeTab)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }
      if (ocFilter) {
        params.append("oc", ocFilter)
      }

      const response = await fetch(`/api/documentos?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Error al cargar documentos")
      }
      return response.json()
    },
  })

  const documentos: DocumentWithSource[] = data?.data || []

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("es-DO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleDownload = async (doc: DocumentWithSource) => {
    try {
      const response = await fetch(doc.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = doc.nombre
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showToast.success("Descarga iniciada", {
        description: `Descargando ${doc.nombre}`,
      })
    } catch (error) {
      showToast.error("Error al descargar", {
        description: "No se pudo descargar el archivo",
      })
    }
  }

  const handleRename = (doc: DocumentWithSource) => {
    setDocumentToRename(doc)
    setRenameModalOpen(true)
  }

  const columns: ColumnDef<DocumentWithSource>[] = [
    {
      accessorKey: "nombre",
      header: "Archivo",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">{row.original.nombre}</div>
            <div className="text-xs text-gray-500">{formatFileSize(row.original.size)}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "categoria",
      header: "Categoría",
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.original.categoria}
        </span>
      ),
    },
    {
      accessorKey: "origen",
      header: "Origen",
      cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.origen}</span>,
    },
    {
      accessorKey: "ocRelacionada",
      header: "OC",
      cell: ({ row }) => (
        <span className="text-sm font-mono text-gray-900">{row.original.ocRelacionada || "-"}</span>
      ),
    },
    {
      accessorKey: "fechaAsociada",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{formatDate(row.original.fechaAsociada)}</span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Ver
          </a>
          <Button
            variant="ghost"
            onClick={() => handleDownload(row.original)}
            className="h-7 px-2 py-1"
          >
            <Download size={14} />
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleRename(row.original)}
            className="h-7 px-2 py-1"
          >
            <Edit2 size={14} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-500 mt-1">
            Vista consolidada de todos los documentos del sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Archivos</span>
              <span className="text-sm font-normal text-gray-500">
                {documentos.length} documento{documentos.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  placeholder="Buscar por nombre de archivo..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-48">
                <Input
                  placeholder="Filtrar por OC..."
                  value={ocFilter}
                  onChange={e => setOcFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              defaultValue="todos"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="todos" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Todos
                </TabsTrigger>
                <TabsTrigger value="facturas" className="gap-2">
                  <FileCheck className="w-4 h-4" />
                  Facturas Comerciales
                </TabsTrigger>
                <TabsTrigger value="comprobantes" className="gap-2">
                  <Receipt className="w-4 h-4" />
                  Comprobantes de Pago
                </TabsTrigger>
                <TabsTrigger value="logisticos" className="gap-2">
                  <Package className="w-4 h-4" />
                  Documentos Logísticos
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : documentos.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No hay documentos en esta categoría</p>
                  </div>
                ) : (
                  <VirtualizedDataTable
                    columns={columns}
                    data={documentos}
                    showColumnToggle={false}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <RenameDocumentModal
        open={renameModalOpen}
        onOpenChange={setRenameModalOpen}
        documentId={documentToRename?.id || null}
        currentName={documentToRename?.nombre || ""}
        onSuccess={() => {
          refetch()
          setDocumentToRename(null)
        }}
      />
    </MainLayout>
  )
}
