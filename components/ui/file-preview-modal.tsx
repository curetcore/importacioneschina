"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, X, FileText, Image as ImageIcon } from "lucide-react"

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

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.nombre
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
              {isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
              <span className="truncate max-w-md">{file.nombre}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
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
                className="max-w-full max-h-[70vh] object-contain"
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
      </DialogContent>
    </Dialog>
  )
}
