"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import {
  FileText,
  Download,
  Search,
  FileCheck,
  Receipt,
  Package,
  FileSpreadsheet,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { showToast } from "@/lib/toast"
import { VirtualizedDataTable } from "@/components/ui/virtualized-data-table"
import { ColumnDef } from "@tanstack/react-table"
import MainLayout from "@/components/layout/MainLayout"
import { RenameDocumentModal } from "@/components/documentos/RenameDocumentModal"
import { FilePreviewModal } from "@/components/ui/file-preview-modal"

const PDFThumbnail = dynamic(
  () => import("@/components/ui/pdf-thumbnail").then(mod => mod.PDFThumbnail),
  {
    ssr: false,
    loading: () => <FileText size={16} className="text-red-500 animate-pulse" />,
  }
)

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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [documentToPreview, setDocumentToPreview] = useState<DocumentWithSource | null>(null)

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

  const handlePreview = (doc: DocumentWithSource) => {
    setDocumentToPreview(doc)
    setPreviewOpen(true)
  }

  const handleDelete = async (doc: DocumentWithSource) => {
    if (!confirm(`¿Estás seguro de eliminar "${doc.nombre}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/documentos/${doc.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar documento")
      }

      showToast.success("Documento eliminado", {
        description: `${doc.nombre} ha sido eliminado`,
      })
      refetch()
    } catch (error) {
      showToast.error("Error al eliminar", {
        description: "No se pudo eliminar el documento",
      })
    }
  }

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith("image/")) {
      return <FileText size={16} className="text-blue-500" />
    }
    if (tipo === "application/pdf") {
      return <FileText size={16} className="text-red-500" />
    }
    if (
      tipo === "application/vnd.ms-excel" ||
      tipo === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return <FileSpreadsheet size={16} className="text-green-600" />
    }
    return <FileText size={16} className="text-gray-400" />
  }

  const renderThumbnail = (doc: DocumentWithSource) => {
    const isImage = doc.tipo.startsWith("image/")
    const isPDF = doc.tipo === "application/pdf"

    if (isImage) {
      return (
        <img
          src={doc.url}
          alt={doc.nombre}
          className="w-10 h-10 object-cover rounded border border-gray-200"
          loading="lazy"
        />
      )
    }

    if (isPDF) {
      return <PDFThumbnail url={doc.url} width={40} height={40} className="rounded" />
    }

    return getFileIcon(doc.tipo)
  }

  const columns: ColumnDef<DocumentWithSource>[] = [
    {
      accessorKey: "nombre",
      header: "Archivo",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">{renderThumbnail(row.original)}</div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">{row.original.nombre}</div>
              <div className="text-xs text-gray-500">{formatFileSize(row.original.size)}</div>
            </div>
          </div>
        )
      },
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
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
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
                    onRowClick={handlePreview}
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

      <FilePreviewModal
        file={
          documentToPreview
            ? {
                nombre: documentToPreview.nombre,
                url: documentToPreview.url,
                tipo: documentToPreview.tipo,
                size: documentToPreview.size,
              }
            : null
        }
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onRename={() => documentToPreview && handleRename(documentToPreview)}
        onDelete={() => documentToPreview && handleDelete(documentToPreview)}
      />
    </MainLayout>
  )
}
