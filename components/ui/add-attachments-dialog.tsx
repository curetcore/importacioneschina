"use client"

import { useState } from "react"
import { Upload, X, FileText, Image as ImageIcon, Loader2, Paperclip } from "lucide-react"
import { Button } from "./button"
import { useToast } from "./toast"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

interface AddAttachmentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  module: "oc-china" | "pagos-china" | "gastos-logisticos"
  recordId: string
  recordName: string // Para mostrar en el título
  currentAttachments: FileAttachment[]
  onSuccess: () => void
}

export function AddAttachmentsDialog({
  open,
  onOpenChange,
  module,
  recordId,
  recordName,
  currentAttachments,
  onSuccess,
}: AddAttachmentsDialogProps) {
  const { addToast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [newAttachments, setNewAttachments] = useState<FileAttachment[]>([])
  const [saving, setSaving] = useState(false)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Solo se permiten archivos JPG, PNG y PDF"
    }
    if (file.size > MAX_FILE_SIZE) {
      return "El archivo no debe exceder 10MB"
    }
    return null
  }

  const uploadFile = async (file: File) => {
    const error = validateFile(file)
    if (error) {
      addToast({
        type: "error",
        title: "Error de validación",
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

      setNewAttachments(prev => [...prev, result.data])

      addToast({
        type: "success",
        title: "Archivo subido",
        description: `${file.name} subido exitosamente`,
      })
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al subir el archivo",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(uploadFile)
    e.target.value = "" // Reset input
  }

  const removeNewFile = (attachment: FileAttachment) => {
    setNewAttachments(prev => prev.filter(a => a.url !== attachment.url))
  }

  const handleSave = async () => {
    if (newAttachments.length === 0) {
      addToast({
        type: "error",
        title: "Error",
        description: "Debes agregar al menos un archivo",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/${module}/${recordId}/attachments`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adjuntos: newAttachments,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al guardar adjuntos")
      }

      addToast({
        type: "success",
        title: "Adjuntos guardados",
        description: result.message || "Los archivos se agregaron exitosamente",
      })

      setNewAttachments([])
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al guardar adjuntos",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setNewAttachments([])
    onOpenChange(false)
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

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip size={20} className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Agregar Adjuntos</h2>
            </div>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">{recordName}</p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          {/* Adjuntos actuales */}
          {currentAttachments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Archivos actuales ({currentAttachments.length})
              </h3>
              <div className="space-y-2">
                {currentAttachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    {getFileIcon(attachment.tipo)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-700 truncate">
                        {attachment.nombre}
                      </div>
                      <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                    </div>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Ver
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload zone */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Nuevos archivos</h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="file-upload-dialog"
                className="hidden"
                onChange={handleFileInput}
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                disabled={uploading}
              />

              <label
                htmlFor="file-upload-dialog"
                className={`flex flex-col items-center gap-2 ${
                  uploading ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {uploading ? (
                  <Loader2 size={32} className="text-gray-400 animate-spin" />
                ) : (
                  <Upload size={32} className="text-gray-400" />
                )}
                <div className="text-sm text-gray-600">
                  {uploading ? (
                    "Subiendo archivo..."
                  ) : (
                    <>
                      <span className="font-medium text-blue-600">Haz clic para subir</span> o
                      arrastra archivos aquí
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500">JPG, PNG o PDF (máx. 10MB)</div>
              </label>
            </div>

            {/* Lista de nuevos archivos */}
            {newAttachments.length > 0 && (
              <div className="space-y-2">
                {newAttachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(attachment.tipo)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {attachment.nombre}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(attachment.size)}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeNewFile(attachment)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={newAttachments.length === 0 || saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Paperclip size={16} />
                Guardar {newAttachments.length > 0 && `(${newAttachments.length})`}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
