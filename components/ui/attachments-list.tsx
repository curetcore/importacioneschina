"use client"

import { FileText, Image as ImageIcon, Download, ExternalLink } from "lucide-react"
import { Button } from "./button"

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
  if (!attachments || attachments.length === 0) {
    return <span className="text-gray-400 text-xs">Sin adjuntos</span>
  }

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith("image/")) {
      return <ImageIcon size={14} className="text-blue-500" />
    }
    return <FileText size={14} className="text-red-500" />
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  if (compact) {
    // Vista compacta para tablas
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {attachments.map((file, index) => (
          <a
            key={index}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors group"
            title={`${file.nombre} (${formatFileSize(file.size)})`}
          >
            {getFileIcon(file.tipo)}
            <span className="max-w-[100px] truncate">{file.nombre}</span>
            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    )
  }

  // Vista completa para detalles
  return (
    <div className="space-y-2">
      {attachments.map((file, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getFileIcon(file.tipo)}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {file.nombre}
              </div>
              <div className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded"
            >
              Ver
            </a>
            <a
              href={file.url}
              download={file.nombre}
              className="text-xs text-gray-600 hover:text-gray-700 font-medium px-2 py-1 hover:bg-gray-100 rounded"
            >
              <Download size={14} />
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
