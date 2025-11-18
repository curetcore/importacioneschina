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
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [editedFileName, setEditedFileName] = useState("")

  const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Solo se permiten archivos JPG, PNG y PDF"
    }
    if (file.size > MAX_FILE_SIZE) {
      return "El archivo no debe exceder 20MB"
    }
    if (attachments.length >= maxFiles) {
      return `Solo se permiten máximo ${maxFiles} archivos`
    }
    return null
  }

  const uploadFile = async (file: File, customName?: string) => {
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
      if (customName) {
        formData.append("customName", customName)
      }

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
        description: `${customName || file.name} subido exitosamente`,
      })
    } catch (error: any) {
      showToast.error("Error al subir archivo", {
        description: error.message || "Error al subir el archivo",
      })
    } finally {
      setUploading(false)
      setPendingFile(null)
      setEditedFileName("")
    }
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      showToast.error("Error de validación", {
        description: error,
      })
      return
    }
    setPendingFile(file)
    setEditedFileName(file.name)
  }

  const confirmUpload = () => {
    if (pendingFile) {
      uploadFile(pendingFile, editedFileName)
    }
  }

  const cancelUpload = () => {
    setPendingFile(null)
    setEditedFileName("")
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (disabled || uploading) return
      if (acceptedFiles.length > 0) {
        handleFileSelect(acceptedFiles[0])
      }
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
            JPG, PNG o PDF (máx. 20MB) • Máximo {maxFiles} archivos
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

      {/* Modal de confirmación de subida */}
      {pendingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar subida de archivo</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del archivo:
                </label>
                <input
                  type="text"
                  value={editedFileName}
                  onChange={e => setEditedFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="nombre-archivo.pdf"
                />
              </div>

              <div className="text-sm text-gray-500">
                <p>Tamaño: {formatFileSize(pendingFile.size)}</p>
                <p>Tipo: {pendingFile.type}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelUpload}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmUpload}
                disabled={!editedFileName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Subir Archivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
