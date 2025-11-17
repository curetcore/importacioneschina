"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectOption } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/datepicker"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/ui/file-upload"
import { useToast } from "@/components/ui/toast"
import { gastosLogisticosSchema, type GastosLogisticosInput } from "@/lib/validations"
import { Loader2 } from "lucide-react"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

interface GastoLogistico {
  id: string
  idGasto: string
  ocId: string
  fechaGasto: string
  tipoGasto: string
  proveedorServicio?: string | null
  metodoPago?: string
  montoRD: number
  notas?: string | null
  adjuntos?: FileAttachment[]
}

interface GastosLogisticosFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  gastoToEdit?: GastoLogistico | null
}

export function GastosLogisticosForm({ open, onOpenChange, onSuccess, gastoToEdit }: GastosLogisticosFormProps) {
  const { addToast } = useToast()
  const isEditMode = !!gastoToEdit

  const [ocsOptions, setOcsOptions] = useState<SelectOption[]>([])
  const [loadingOcs, setLoadingOcs] = useState(false)

  const [tiposGastoOptions, setTiposGastoOptions] = useState<SelectOption[]>([])
  const [metodosPagoOptions, setMetodosPagoOptions] = useState<SelectOption[]>([])
  const [loadingConfig, setLoadingConfig] = useState(false)

  const [adjuntos, setAdjuntos] = useState<FileAttachment[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GastosLogisticosInput>({
    resolver: zodResolver(gastosLogisticosSchema),
    defaultValues: {
      idGasto: "",
      ocId: "",
      fechaGasto: undefined,
      tipoGasto: "",
      proveedorServicio: "",
      metodoPago: "",
      montoRD: undefined,
      notas: "",
    },
  })

  const ocIdValue = watch("ocId")
  const fechaGastoValue = watch("fechaGasto")
  const tipoGastoValue = watch("tipoGasto")
  const metodoPagoValue = watch("metodoPago")

  // Load OCs and config when dialog opens
  useEffect(() => {
    if (open) {
      // Load OCs
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

      // Load dynamic configurations
      setLoadingConfig(true)
      Promise.all([
        fetch("/api/configuracion?categoria=tiposGasto").then(res => res.json()),
        fetch("/api/configuracion?categoria=metodosPago").then(res => res.json()),
      ])
        .then(([tiposGastoRes, metodosPagoRes]) => {
          if (tiposGastoRes.success) {
            setTiposGastoOptions(tiposGastoRes.data.map((item: any) => ({
              value: item.valor,
              label: item.valor
            })))
          }
          if (metodosPagoRes.success) {
            setMetodosPagoOptions(metodosPagoRes.data.map((item: any) => ({
              value: item.valor,
              label: item.valor
            })))
          }
          setLoadingConfig(false)
        })
        .catch(() => setLoadingConfig(false))
    }
  }, [open])

  // Reset form when edit data changes
  useEffect(() => {
    if (gastoToEdit) {
      reset({
        idGasto: gastoToEdit.idGasto,
        ocId: gastoToEdit.ocId,
        fechaGasto: new Date(gastoToEdit.fechaGasto),
        tipoGasto: gastoToEdit.tipoGasto,
        proveedorServicio: gastoToEdit.proveedorServicio || "",
        metodoPago: gastoToEdit.metodoPago || "",
        montoRD: gastoToEdit.montoRD,
        notas: gastoToEdit.notas || "",
      })
      setAdjuntos(gastoToEdit.adjuntos || [])
    } else {
      reset({
        idGasto: "",
        ocId: "",
        fechaGasto: undefined,
        tipoGasto: "",
        proveedorServicio: "",
        metodoPago: "",
        montoRD: undefined,
        notas: "",
      })
      setAdjuntos([])
    }
  }, [gastoToEdit, reset])

  const onSubmit = async (data: GastosLogisticosInput) => {
    try {
      const url = isEditMode ? `/api/gastos-logisticos/${gastoToEdit.id}` : "/api/gastos-logisticos"
      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          adjuntos: adjuntos.length > 0 ? adjuntos : undefined,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || `Error al ${isEditMode ? "actualizar" : "crear"} el gasto`)
      }

      addToast({
        type: "success",
        title: isEditMode ? "Gasto actualizado" : "Gasto creado",
        description: `Gasto ${result.data?.idGasto || data.idGasto} ${isEditMode ? "actualizado" : "creado"} exitosamente`,
      })

      reset()
      setAdjuntos([])
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al procesar el gasto"
      })
    }
  }

  const handleCancel = () => {
    reset()
    setAdjuntos([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogClose onClose={handleCancel} />
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Gasto Logístico" : "Nuevo Gasto Logístico"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4">
            {/* ID Gasto - Only show in edit mode */}
            {isEditMode && (
              <div>
                <label htmlFor="idGasto" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Gasto
                </label>
                <Input
                  id="idGasto"
                  {...register("idGasto")}
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
                value={ocIdValue}
                onChange={(value) => setValue("ocId", value)}
                placeholder={loadingOcs ? "Cargando OCs..." : "Selecciona una OC"}
                disabled={isSubmitting || loadingOcs}
              />
              {errors.ocId && (
                <p className="text-xs text-red-600 mt-1">{errors.ocId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fechaGasto" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Gasto <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  id="fechaGasto"
                  value={fechaGastoValue}
                  onChange={(date) => setValue("fechaGasto", date || undefined)}
                  disabled={isSubmitting}
                />
                {errors.fechaGasto && (
                  <p className="text-xs text-red-600 mt-1">{errors.fechaGasto.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="tipoGasto" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Gasto <span className="text-red-500">*</span>
                </label>
                <Select
                  options={tiposGastoOptions}
                  value={tipoGastoValue}
                  onChange={(value) => setValue("tipoGasto", value)}
                  placeholder={loadingConfig ? "Cargando tipos..." : "Selecciona tipo"}
                  disabled={isSubmitting || loadingConfig}
                />
                {errors.tipoGasto && (
                  <p className="text-xs text-red-600 mt-1">{errors.tipoGasto.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="proveedorServicio" className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor de Servicio
                </label>
                <Input
                  id="proveedorServicio"
                  {...register("proveedorServicio")}
                  placeholder="Ej: DHL, Agencia Aduanal"
                  disabled={isSubmitting}
                />
                {errors.proveedorServicio && (
                  <p className="text-xs text-red-600 mt-1">{errors.proveedorServicio.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago <span className="text-red-500">*</span>
                </label>
                <Select
                  options={metodosPagoOptions}
                  value={metodoPagoValue}
                  onChange={(value) => setValue("metodoPago", value)}
                  placeholder={loadingConfig ? "Cargando métodos..." : "Selecciona método"}
                  disabled={isSubmitting || loadingConfig}
                />
                {errors.metodoPago && (
                  <p className="text-xs text-red-600 mt-1">{errors.metodoPago.message}</p>
                )}
              </div>
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
                {...register("montoRD")}
                placeholder="Ej: 5000.00"
                disabled={isSubmitting}
              />
              {errors.montoRD && (
                <p className="text-xs text-red-600 mt-1">{errors.montoRD.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <Textarea
                id="notas"
                {...register("notas")}
                placeholder="Notas adicionales..."
                rows={3}
                disabled={isSubmitting}
              />
              {errors.notas && (
                <p className="text-xs text-red-600 mt-1">{errors.notas.message}</p>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjuntos (Facturas, recibos, documentos)
              </label>
              <FileUpload
                module="gastos-logisticos"
                attachments={adjuntos}
                onChange={setAdjuntos}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
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
