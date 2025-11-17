"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, FileText, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "./button"
import { showToast } from "@/lib/toast"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

interface FileUploadProps {
  module: "oc-china" | "pagos-china" | "gastos-logisticos"
  attachments: FileAttachment[]
  onChange: (attachments: FileAttachment[]) => void
  maxFiles?: number
  disabled?: boolean
}

export function FileUpload({
  module,
  attachments,
  onChange,
  maxFiles = 5,
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Solo se permiten archivos JPG, PNG y PDF"
    }
    if (file.size > MAX_FILE_SIZE) {
      return "El archivo no debe exceder 10MB"
    }
    if (attachments.length >= maxFiles) {
      return `Solo se permiten máximo ${maxFiles} archivos`
    }
    return null
  }

  const uploadFile = async (file: File) => {
    const error = validateFile(file)
    if (error) {
      showToast.error("Error de validación", {
        description: error,
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("module", module)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al subir el archivo")
      }

      onChange([...attachments, result.data])

      showToast.success("Archivo subido", {
        description: `${file.name} subido exitosamente`,
      })
    } catch (error: any) {
      showToast.error("Error al subir archivo", {
        description: error.message || "Error al subir el archivo",
      })
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (disabled || uploading) return
      acceptedFiles.forEach(uploadFile)
    },
    [disabled, uploading, attachments]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: maxFiles - attachments.length,
    disabled: disabled || uploading || attachments.length >= maxFiles,
    multiple: true,
  })

  const removeFile = async (attachment: FileAttachment) => {
    try {
      const response = await fetch(`/api/upload/delete?url=${encodeURIComponent(attachment.url)}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar el archivo")
      }

      onChange(attachments.filter(a => a.url !== attachment.url))

      showToast.success("Archivo eliminado", {
        description: `${attachment.nombre} eliminado exitosamente`,
      })
    } catch (error: any) {
      showToast.error("Error al eliminar archivo", {
        description: error.message || "Error al eliminar el archivo",
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith("image/")) {
      return <ImageIcon size={16} className="text-blue-500" />
    }
    return <FileText size={16} className="text-red-500" />
  }

  return (
    <div className="space-y-3">
      {/* Drop zone with react-dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${isDragActive ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-gray-300"}
          ${isDragReject ? "border-red-500 bg-red-50" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400 hover:bg-gray-50"}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 size={32} className="text-gray-400 animate-spin" />
          ) : isDragActive ? (
            <CheckCircle2 size={32} className="text-blue-500" />
          ) : (
            <Upload size={32} className="text-gray-400" />
          )}
          <div className="text-sm text-gray-600">
            {uploading ? (
              "Subiendo archivo..."
            ) : isDragActive ? (
              <span className="font-medium text-blue-600">Suelta los archivos aquí</span>
            ) : isDragReject ? (
              <span className="font-medium text-red-600">Archivos no permitidos</span>
            ) : (
              <>
                <span className="font-medium text-blue-600">Haz clic para subir</span> o arrastra
                archivos aquí
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            JPG, PNG o PDF (máx. 10MB) • Máximo {maxFiles} archivos
            {attachments.length > 0 && ` • ${maxFiles - attachments.length} restantes`}
          </div>
        </div>
      </div>

      {/* Lista de archivos */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(attachment.tipo)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {attachment.nombre}
                  </div>
                  <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeFile(attachment)}
                  disabled={disabled}
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
