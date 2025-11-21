"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText, Image as ImageIcon, FileSpreadsheet } from "lucide-react"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
}

interface FilePreviewModalProps {
  file: FileAttachment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FilePreviewModal({ file, open, onOpenChange }: FilePreviewModalProps) {
  if (!file) return null

  const isImage = file.tipo.startsWith("image/")
  const isPDF = file.tipo === "application/pdf"
  const isExcel =
    file.tipo === "application/vnd.ms-excel" ||
    file.tipo === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

  const getFileIcon = () => {
    if (isImage) return <ImageIcon size={20} className="text-blue-500" />
    if (isPDF) return <FileText size={20} className="text-red-500" />
    if (isExcel) return <FileSpreadsheet size={20} className="text-green-600" />
    return <FileText size={20} className="text-gray-500" />
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(file.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = file.nombre
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading file:", error)
      alert("Error al descargar el archivo")
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon()}
              <span className="truncate max-w-md">{file.nombre}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="gap-2 px-3 py-1.5 text-sm"
              >
                <Download size={16} />
                Descargar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-4">
          {isImage && (
            <div className="flex items-center justify-center min-h-[400px]">
              <img
                src={file.url}
                alt={file.nombre}
                className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
              />
            </div>
          )}

          {isPDF && (
            <iframe
              src={file.url}
              className="w-full h-[70vh] border-0 rounded"
              title={file.nombre}
            />
          )}

          {!isImage && !isPDF && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <FileText size={64} className="text-gray-300 mb-4" />
              <p className="text-gray-600 mb-4">
                Vista previa no disponible para este tipo de archivo
              </p>
              <Button onClick={handleDownload} className="gap-2">
                <Download size={16} />
                Descargar archivo
              </Button>
            </div>
          )}
        </div>

        {/* Botones de acción en el footer del modal */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {isImage && "Haz clic derecho para copiar o guardar"}
            {isPDF && "Usa los controles del visor para navegar"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download size={16} />
              Descargar
            </Button>
            {(isImage || isPDF) && (
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  Abrir en nueva pestaña
                </Button>
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
