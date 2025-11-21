"use client"

import { useState } from "react"
import { FileText, Image as ImageIcon, Download, Eye } from "lucide-react"
import { Button } from "./button"
import { FilePreviewModal } from "./file-preview-modal"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

interface AttachmentsListProps {
  attachments: FileAttachment[]
  compact?: boolean
}

export function AttachmentsList({ attachments, compact = false }: AttachmentsListProps) {
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  if (!attachments || attachments.length === 0) {
    return <span className="text-gray-400 text-xs">Sin adjuntos</span>
  }

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith("image/")) {
      return <ImageIcon size={14} className="text-blue-500" />
    }
    if (tipo === "application/pdf") {
      return <FileText size={14} className="text-red-500" />
    }
    if (
      tipo === "application/vnd.ms-excel" ||
      tipo === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return <FileText size={14} className="text-green-600" />
    }
    if (
      tipo === "application/msword" ||
      tipo === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return <FileText size={14} className="text-blue-600" />
    }
    return <FileText size={14} className="text-gray-500" />
  }

  const renderThumbnail = (file: FileAttachment) => {
    if (file.tipo.startsWith("image/")) {
      return (
        <img
          src={file.url}
          alt={file.nombre}
          className="w-8 h-8 object-cover rounded border border-gray-200"
          loading="lazy"
        />
      )
    }
    return getFileIcon(file.tipo)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const handleFileClick = (file: FileAttachment) => {
    setSelectedFile(file)
    setPreviewOpen(true)
  }

  if (compact) {
    // Vista compacta para tablas - solo miniaturas clicables
    return (
      <>
        <div className="flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
          {attachments.map((file, index) => (
            <button
              key={index}
              onClick={e => {
                e.stopPropagation()
                handleFileClick(file)
              }}
              className="relative group"
              title={`${file.nombre} (${formatFileSize(file.size)})`}
            >
              {file.tipo.startsWith("image/") ? (
                <div className="relative">
                  <img
                    src={file.url}
                    alt={file.nombre}
                    className="w-10 h-10 object-cover rounded border-2 border-gray-200 group-hover:border-blue-400 transition-all shadow-sm"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded transition-all flex items-center justify-center">
                    <Eye
                      size={16}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-100 border-2 border-gray-200 group-hover:border-blue-400 rounded flex items-center justify-center transition-all">
                  {getFileIcon(file.tipo)}
                </div>
              )}
            </button>
          ))}
        </div>
        <FilePreviewModal file={selectedFile} open={previewOpen} onOpenChange={setPreviewOpen} />
      </>
    )
  }

  // Vista completa para detalles
  return (
    <>
      <div className="space-y-2">
        {attachments.map((file, index) => {
          const isImage = file.tipo.startsWith("image/")
          return (
            <button
              key={index}
              onClick={e => {
                e.stopPropagation()
                handleFileClick(file)
              }}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
            >
              {isImage ? (
                <div className="flex-shrink-0 relative">
                  <img
                    src={file.url}
                    alt={file.nombre}
                    className="w-16 h-16 object-cover rounded border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded transition-all flex items-center justify-center">
                    <Eye
                      size={20}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  {getFileIcon(file.tipo)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                  {file.nombre}
                </div>
                <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
              </div>
              <Eye
                size={18}
                className="text-gray-400 group-hover:text-blue-600 transition-colors"
              />
            </button>
          )
        })}
      </div>
      <FilePreviewModal file={selectedFile} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  )
}
