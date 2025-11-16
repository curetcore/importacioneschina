"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectOption } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/datepicker"
import { FileUpload } from "@/components/ui/file-upload"
import { useToast } from "@/components/ui/toast"
import { pagosChinaSchema, PagosChinaInput } from "@/lib/validations"
import { Loader2 } from "lucide-react"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

interface PagoChina {
  id: string
  idPago: string
  ocId: string
  fechaPago: string
  tipoPago: string
  metodoPago: string
  moneda: "USD" | "CNY" | "RD$"
  montoOriginal: number
  tasaCambio: number
  comisionBancoRD: number
  adjuntos?: FileAttachment[]
}

interface PagosChinaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  pagoToEdit?: PagoChina | null
}

// Monedas fijas (no configurables)
const monedasOptions: SelectOption[] = [
  { value: "USD", label: "USD" },
  { value: "CNY", label: "CNY" },
  { value: "RD$", label: "RD$" },
]

export function PagosChinaForm({ open, onOpenChange, onSuccess, pagoToEdit }: PagosChinaFormProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof PagosChinaInput, string>>>({})
  const isEditMode = !!pagoToEdit

  const [ocsOptions, setOcsOptions] = useState<SelectOption[]>([])
  const [loadingOcs, setLoadingOcs] = useState(false)

  // Opciones de configuración dinámica
  const [tiposPagoOptions, setTiposPagoOptions] = useState<SelectOption[]>([])
  const [metodosPagoOptions, setMetodosPagoOptions] = useState<SelectOption[]>([])
  const [loadingConfig, setLoadingConfig] = useState(false)

  const [formData, setFormData] = useState<Partial<PagosChinaInput>>({
    idPago: "",
    ocId: "",
    fechaPago: undefined,
    tipoPago: "",
    metodoPago: "",
    moneda: "USD",
    montoOriginal: undefined,
    tasaCambio: 1,
    comisionBancoRD: 0,
  })
  const [adjuntos, setAdjuntos] = useState<FileAttachment[]>([])

  // Cálculos automáticos
  const montoRD = (formData.montoOriginal ?? 0) * (formData.tasaCambio ?? 1)
  const montoRDNeto = montoRD + (formData.comisionBancoRD ?? 0)  // FIX: SUMA la comisión (costo total real)

  // Cargar OCs disponibles y configuraciones
  useEffect(() => {
    if (open) {
      // Cargar OCs
      setLoadingOcs(true)
      fetch("/api/oc-china")
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            const options = result.data.map((oc: any) => ({
              value: oc.id,
              label: `${oc.oc} - ${oc.proveedor}`,
            }))
            setOcsOptions(options)
          }
          setLoadingOcs(false)
        })
        .catch(() => setLoadingOcs(false))

      // Cargar configuraciones dinámicas
      setLoadingConfig(true)
      Promise.all([
        fetch("/api/configuracion?categoria=tiposPago").then(res => res.json()),
        fetch("/api/configuracion?categoria=metodosPago").then(res => res.json()),
      ])
        .then(([tiposPagoRes, metodosPagoRes]) => {
          if (tiposPagoRes.success) {
            setTiposPagoOptions(tiposPagoRes.data.map((item: any) => ({
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

  // Cargar datos cuando se abre en modo edición
  useEffect(() => {
    if (pagoToEdit) {
      setFormData({
        idPago: pagoToEdit.idPago,
        ocId: pagoToEdit.ocId,
        fechaPago: new Date(pagoToEdit.fechaPago),
        tipoPago: pagoToEdit.tipoPago,
        metodoPago: pagoToEdit.metodoPago,
        moneda: pagoToEdit.moneda,
        montoOriginal: pagoToEdit.montoOriginal,
        tasaCambio: pagoToEdit.tasaCambio,
        comisionBancoRD: pagoToEdit.comisionBancoRD,
      })
      setAdjuntos(pagoToEdit.adjuntos || [])
    } else {
      setFormData({
        idPago: "",
        ocId: "",
        fechaPago: undefined,
        tipoPago: "",
        metodoPago: "",
        moneda: "USD",
        montoOriginal: undefined,
        tasaCambio: 1,
        comisionBancoRD: 0,
      })
      setAdjuntos([])
    }
    setErrors({})
  }, [pagoToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // En modo creación, remover idPago antes de validar (se genera automáticamente)
      const dataToValidate = isEditMode ? formData : { ...formData, idPago: undefined }

      // Validar con Zod
      const validatedData = pagosChinaSchema.parse(dataToValidate)

      // Enviar al API
      const url = isEditMode ? `/api/pagos-china/${pagoToEdit.id}` : "/api/pagos-china"
      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...validatedData,
          adjuntos: adjuntos.length > 0 ? adjuntos : undefined,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || `Error al ${isEditMode ? "actualizar" : "crear"} el pago`)
      }

      // Éxito
      addToast({
        type: "success",
        title: isEditMode ? "Pago actualizado" : "Pago creado",
        description: `Pago ${result.data?.idPago || validatedData.idPago} ${isEditMode ? "actualizado" : "creado"} exitosamente`,
      })

      // Resetear formulario
      setFormData({
        idPago: "",
        ocId: "",
        fechaPago: undefined,
        tipoPago: "",
        metodoPago: "",
        moneda: "USD",
        montoOriginal: undefined,
        tasaCambio: 1,
        comisionBancoRD: 0,
      })
      setAdjuntos([])

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      if (error.errors) {
        // Errores de validación Zod
        const validationErrors: Partial<Record<keyof PagosChinaInput, string>> = {}
        error.errors.forEach((err: any) => {
          const field = err.path[0] as keyof PagosChinaInput
          validationErrors[field] = err.message
        })
        setErrors(validationErrors)
      } else {
        // Otros errores
        addToast({
          type: "error",
          title: "Error",
          description: error.message || "Error al procesar el pago",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      idPago: "",
      ocId: "",
      fechaPago: undefined,
      tipoPago: "",
      metodoPago: "",
      moneda: "USD",
      montoOriginal: undefined,
      tasaCambio: 1,
      comisionBancoRD: 0,
    })
    setAdjuntos([])
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogClose onClose={handleCancel} />
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Pago" : "Nuevo Pago"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* ID Pago - Solo mostrar en modo edición */}
            {isEditMode && (
              <div>
                <label htmlFor="idPago" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Pago
                </label>
                <Input
                  id="idPago"
                  value={formData.idPago}
                  disabled={true}
                  className="bg-gray-100"
                />
              </div>
            )}

            {/* OC */}
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

            {/* Fecha Pago */}
            <div>
              <label htmlFor="fechaPago" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Pago <span className="text-red-500">*</span>
              </label>
              <DatePicker
                id="fechaPago"
                value={formData.fechaPago}
                onChange={(date) => setFormData({ ...formData, fechaPago: date || undefined })}
                error={errors.fechaPago}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tipo de Pago */}
              <div>
                <label htmlFor="tipoPago" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Pago <span className="text-red-500">*</span>
                </label>
                <Select
                  options={tiposPagoOptions}
                  value={formData.tipoPago || ""}
                  onChange={(value) => setFormData({ ...formData, tipoPago: value })}
                  error={errors.tipoPago}
                  placeholder={loadingConfig ? "Cargando tipos..." : "Selecciona tipo"}
                  disabled={loading || loadingConfig}
                />
              </div>

              {/* Método de Pago */}
              <div>
                <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago <span className="text-red-500">*</span>
                </label>
                <Select
                  options={metodosPagoOptions}
                  value={formData.metodoPago || ""}
                  onChange={(value) => setFormData({ ...formData, metodoPago: value })}
                  error={errors.metodoPago}
                  placeholder={loadingConfig ? "Cargando métodos..." : "Selecciona método"}
                  disabled={loading || loadingConfig}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Moneda */}
              <div>
                <label htmlFor="moneda" className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda <span className="text-red-500">*</span>
                </label>
                <Select
                  options={monedasOptions}
                  value={formData.moneda || ""}
                  onChange={(value) => setFormData({ ...formData, moneda: value as "USD" | "CNY" | "RD$" })}
                  error={errors.moneda}
                  placeholder="Selecciona moneda"
                  disabled={loading}
                />
              </div>

              {/* Monto Original */}
              <div>
                <label htmlFor="montoOriginal" className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Original <span className="text-red-500">*</span>
                </label>
                <Input
                  id="montoOriginal"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.montoOriginal ?? ""}
                  onChange={(e) => setFormData({ ...formData, montoOriginal: e.target.value ? parseFloat(e.target.value) : undefined })}
                  error={errors.montoOriginal}
                  placeholder="Ej: 10000.00"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tasa de Cambio */}
              <div>
                <label htmlFor="tasaCambio" className="block text-sm font-medium text-gray-700 mb-1">
                  Tasa de Cambio <span className="text-red-500">*</span>
                </label>
                <Input
                  id="tasaCambio"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.tasaCambio ?? ""}
                  onChange={(e) => setFormData({ ...formData, tasaCambio: e.target.value ? parseFloat(e.target.value) : 1 })}
                  error={errors.tasaCambio}
                  placeholder="Ej: 60.50"
                  disabled={loading}
                />
              </div>

              {/* Comisión Banco RD */}
              <div>
                <label htmlFor="comisionBancoRD" className="block text-sm font-medium text-gray-700 mb-1">
                  Comisión Banco (RD$)
                </label>
                <Input
                  id="comisionBancoRD"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.comisionBancoRD ?? ""}
                  onChange={(e) => setFormData({ ...formData, comisionBancoRD: e.target.value ? parseFloat(e.target.value) : 0 })}
                  error={errors.comisionBancoRD}
                  placeholder="Ej: 500.00"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Cálculos Automáticos */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Cálculos Automáticos</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Monto en RD$
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    RD$ {montoRD.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.montoOriginal?.toLocaleString() || '0'} × {formData.tasaCambio || '1'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Costo Total (RD$)
                  </label>
                  <div className="text-lg font-semibold text-green-700">
                    RD$ {montoRDNeto.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Monto RD$ + Comisión
                  </p>
                </div>
              </div>
            </div>

            {/* Adjuntos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjuntos (Recibos de pago)
              </label>
              <FileUpload
                module="pagos-china"
                attachments={adjuntos}
                onChange={setAdjuntos}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                isEditMode ? "Actualizar Pago" : "Crear Pago"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
