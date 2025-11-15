"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectOption } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/datepicker"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { gastosLogisticosSchema, GastosLogisticosInput, tiposGasto } from "@/lib/validations"
import { Loader2, Upload, FileText, X } from "lucide-react"

interface GastoLogistico {
  id: string
  idGasto: string
  ocId: string
  fechaGasto: string
  tipoGasto: string
  proveedorServicio?: string | null
  montoRD: number
  notas?: string | null
  archivoRecibo?: string | null
}

interface GastosLogisticosFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  gastoToEdit?: GastoLogistico | null
}

const tiposGastoOptions: SelectOption[] = tiposGasto.map(t => ({
  value: t,
  label: t
}))

export function GastosLogisticosForm({ open, onOpenChange, onSuccess, gastoToEdit }: GastosLogisticosFormProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof GastosLogisticosInput, string>>>({})
  const isEditMode = !!gastoToEdit

  const [ocsOptions, setOcsOptions] = useState<SelectOption[]>([])
  const [loadingOcs, setLoadingOcs] = useState(false)

  const [formData, setFormData] = useState<Partial<GastosLogisticosInput>>({
    idGasto: "",
    ocId: "",
    fechaGasto: undefined,
    tipoGasto: "",
    proveedorServicio: "",
    montoRD: undefined,
    notas: "",
    archivoRecibo: "",
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  useEffect(() => {
    if (open) {
      setLoadingOcs(true)
      fetch("/api/oc-china")
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setOcsOptions(result.data.map((oc: any) => ({ value: oc.id, label: `${oc.oc} - ${oc.proveedor}` })))
          }
          setLoadingOcs(false)
        })
        .catch(() => setLoadingOcs(false))
    }
  }, [open])

  useEffect(() => {
    if (gastoToEdit) {
      setFormData({
        idGasto: gastoToEdit.idGasto,
        ocId: gastoToEdit.ocId,
        fechaGasto: new Date(gastoToEdit.fechaGasto),
        tipoGasto: gastoToEdit.tipoGasto,
        proveedorServicio: gastoToEdit.proveedorServicio || "",
        montoRD: gastoToEdit.montoRD,
        notas: gastoToEdit.notas || "",
        archivoRecibo: gastoToEdit.archivoRecibo || "",
      })
      setSelectedFile(null)
    } else {
      setFormData({
        idGasto: "",
        ocId: "",
        fechaGasto: undefined,
        tipoGasto: "",
        proveedorServicio: "",
        montoRD: undefined,
        notas: "",
        archivoRecibo: "",
      })
      setSelectedFile(null)
    }
    setErrors({})
  }, [gastoToEdit])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        addToast({
          type: "error",
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos PDF e imágenes (JPG, PNG, WEBP)",
        })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        addToast({
          type: "error",
          title: "Archivo muy grande",
          description: "El archivo no debe exceder 10MB",
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setFormData({ ...formData, archivoRecibo: "" })
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploadingFile(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tipo', 'gastos-logisticos')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Error al subir el archivo')
      }

      const data = await response.json()
      return data.filePath
    } catch (error) {
      console.error('Error uploading file:', error)
      addToast({
        type: "error",
        title: "Error al subir archivo",
        description: "No se pudo subir el archivo. Intenta de nuevo.",
      })
      return null
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Subir archivo si hay uno seleccionado
      let archivoReciboPath = formData.archivoRecibo
      if (selectedFile) {
        const uploadedPath = await uploadFile(selectedFile)
        if (uploadedPath) {
          archivoReciboPath = uploadedPath
        }
      }

      // En modo creación, remover idGasto antes de validar (se genera automáticamente)
      const dataToValidate = isEditMode ? { ...formData, archivoRecibo: archivoReciboPath } : { ...formData, idGasto: undefined, archivoRecibo: archivoReciboPath }
      const validatedData = gastosLogisticosSchema.parse(dataToValidate)

      const url = isEditMode ? `/api/gastos-logisticos/${gastoToEdit.id}` : "/api/gastos-logisticos"
      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || `Error al ${isEditMode ? "actualizar" : "crear"} el gasto`)
      }

      addToast({
        type: "success",
        title: isEditMode ? "Gasto actualizado" : "Gasto creado",
        description: `Gasto ${result.data?.idGasto || validatedData.idGasto} ${isEditMode ? "actualizado" : "creado"} exitosamente`,
      })

      setFormData({ idGasto: "", ocId: "", fechaGasto: undefined, tipoGasto: "", proveedorServicio: "", montoRD: undefined, notas: "" })
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      if (error.errors) {
        const validationErrors: Partial<Record<keyof GastosLogisticosInput, string>> = {}
        error.errors.forEach((err: any) => {
          validationErrors[err.path[0] as keyof GastosLogisticosInput] = err.message
        })
        setErrors(validationErrors)
      } else {
        addToast({ type: "error", title: "Error", description: error.message || "Error al procesar el gasto" })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({ idGasto: "", ocId: "", fechaGasto: undefined, tipoGasto: "", proveedorServicio: "", montoRD: undefined, notas: "" })
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogClose onClose={handleCancel} />
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Gasto Logístico" : "Nuevo Gasto Logístico"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* ID Gasto - Solo mostrar en modo edición */}
            {isEditMode && (
              <div>
                <label htmlFor="idGasto" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Gasto
                </label>
                <Input
                  id="idGasto"
                  value={formData.idGasto}
                  disabled={true}
                  className="bg-gray-100"
                />
              </div>
            )}

            <div>
              <label htmlFor="ocId" className="block text-sm font-medium text-gray-700 mb-1">
                Orden de Compra <span className="text-red-500">*</span>
              </label>
              <Select
                options={ocsOptions}
                value={formData.ocId || ""}
                onChange={(value) => setFormData({ ...formData, ocId: value })}
                error={errors.ocId}
                placeholder={loadingOcs ? "Cargando OCs..." : "Selecciona una OC"}
                disabled={loading || loadingOcs}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fechaGasto" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Gasto <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  id="fechaGasto"
                  value={formData.fechaGasto}
                  onChange={(date) => setFormData({ ...formData, fechaGasto: date || undefined })}
                  error={errors.fechaGasto}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="tipoGasto" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Gasto <span className="text-red-500">*</span>
                </label>
                <Select
                  options={tiposGastoOptions}
                  value={formData.tipoGasto || ""}
                  onChange={(value) => setFormData({ ...formData, tipoGasto: value })}
                  error={errors.tipoGasto}
                  placeholder="Selecciona tipo"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="proveedorServicio" className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor de Servicio
                </label>
                <Input
                  id="proveedorServicio"
                  value={formData.proveedorServicio || ""}
                  onChange={(e) => setFormData({ ...formData, proveedorServicio: e.target.value })}
                  error={errors.proveedorServicio}
                  placeholder="Ej: DHL, Agencia Aduanal"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="montoRD" className="block text-sm font-medium text-gray-700 mb-1">
                  Monto (RD$) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="montoRD"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.montoRD ?? ""}
                  onChange={(e) => setFormData({ ...formData, montoRD: e.target.value ? parseFloat(e.target.value) : undefined })}
                  error={errors.montoRD}
                  placeholder="Ej: 5000.00"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <Textarea
                id="notas"
                value={formData.notas || ""}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                error={errors.notas}
                placeholder="Notas adicionales..."
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Adjuntar Recibo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recibo (PDF o imagen)
              </label>
              {!selectedFile && !formData.archivoRecibo ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={loading || uploadingFile}
                    className="flex-1"
                  />
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="flex-1 text-sm truncate">
                    {selectedFile?.name || formData.archivoRecibo?.split('/').pop()}
                  </span>
                  {formData.archivoRecibo && !selectedFile && (
                    <a
                      href={`/api/files/${formData.archivoRecibo.replace('uploads/', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Ver
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={removeFile}
                    disabled={loading || uploadingFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Formatos permitidos: PDF, JPG, PNG, WEBP (máx. 10MB)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                isEditMode ? "Actualizar Gasto" : "Crear Gasto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
