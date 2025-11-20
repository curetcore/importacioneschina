"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
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
  moneda: "USD" | "RD$"
  montoOriginal: number
  tasaCambio: number
  comisionBancoUSD: number
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
  { value: "RD$", label: "RD$" },
]

export function PagosChinaForm({ open, onOpenChange, onSuccess, pagoToEdit }: PagosChinaFormProps) {
  const { addToast } = useToast()
  const isEditMode = !!pagoToEdit

  const [ocsOptions, setOcsOptions] = useState<SelectOption[]>([])
  const [loadingOcs, setLoadingOcs] = useState(false)

  // Opciones de configuración dinámica
  const [tiposPagoOptions, setTiposPagoOptions] = useState<SelectOption[]>([])
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
  } = useForm<PagosChinaInput>({
    resolver: zodResolver(pagosChinaSchema),
    defaultValues: {
      idPago: undefined,
      ocId: "",
      fechaPago: undefined,
      tipoPago: "",
      metodoPago: "",
      moneda: "USD",
      montoOriginal: undefined,
      tasaCambio: 1,
      comisionBancoUSD: 0,
    },
  })

  const ocIdValue = watch("ocId")
  const fechaPagoValue = watch("fechaPago")
  const tipoPagoValue = watch("tipoPago")
  const metodoPagoValue = watch("metodoPago")
  const monedaValue = watch("moneda")
  const montoOriginalValue = watch("montoOriginal")
  const tasaCambioValue = watch("tasaCambio")
  const comisionBancoUSDValue = watch("comisionBancoUSD")

  // Cálculos automáticos
  // Solo multiplica por tasa si la moneda es USD, si es RD$ ya está en pesos
  const montoRD =
    monedaValue === "RD$"
      ? (montoOriginalValue ?? 0)
      : (montoOriginalValue ?? 0) * (tasaCambioValue ?? 1)

  // La comisión SIEMPRE es en USD, siempre se multiplica por la tasa
  const comisionRD = (comisionBancoUSDValue ?? 0) * (tasaCambioValue ?? 1)

  const montoRDNeto = montoRD + comisionRD // SUMA la comisión convertida a RD$ (costo total real)

  // Cargar OCs disponibles y configuraciones
  useEffect(() => {
    if (open) {
      // Cargar OCs
      setLoadingOcs(true)
      fetch("/api/oc-china")
        .then(res => res.json())
        .then(result => {
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
            setTiposPagoOptions(
              tiposPagoRes.data.map((item: any) => ({
                value: item.valor,
                label: item.valor,
              }))
            )
          }
          if (metodosPagoRes.success) {
            setMetodosPagoOptions(
              metodosPagoRes.data.map((item: any) => ({
                value: item.valor,
                label: item.valor,
              }))
            )
          }
          setLoadingConfig(false)
        })
        .catch(() => setLoadingConfig(false))
    }
  }, [open])

  // Cargar datos cuando se abre en modo edición
  useEffect(() => {
    if (pagoToEdit) {
      reset({
        idPago: pagoToEdit.idPago,
        ocId: pagoToEdit.ocId,
        fechaPago: new Date(pagoToEdit.fechaPago),
        tipoPago: pagoToEdit.tipoPago,
        metodoPago: pagoToEdit.metodoPago,
        moneda: pagoToEdit.moneda,
        montoOriginal: pagoToEdit.montoOriginal,
        tasaCambio: pagoToEdit.tasaCambio,
        comisionBancoUSD: pagoToEdit.comisionBancoUSD,
      })
      setAdjuntos(pagoToEdit.adjuntos || [])
    } else {
      reset({
        idPago: undefined,
        ocId: "",
        fechaPago: undefined,
        tipoPago: "",
        metodoPago: "",
        moneda: "USD",
        montoOriginal: undefined,
        tasaCambio: 1,
        comisionBancoUSD: 0,
      })
      setAdjuntos([])
    }
  }, [pagoToEdit, reset])

  const onInvalid = (errors: any) => {
    console.log("❌ VALIDACIÓN FALLÓ - Errores encontrados:", errors)
    console.log("❌ Errores completos:", JSON.stringify(errors, null, 2))
  }

  const onSubmit = async (data: PagosChinaInput) => {
    console.log("✅ onSubmit llamado con data:", data)
    console.log("✅ Errores de validación:", errors)
    try {
      // Enviar al API
      const url = isEditMode ? `/api/pagos-china/${pagoToEdit.id}` : "/api/pagos-china"
      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
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
        description: `Pago ${result.data?.idPago || data.idPago} ${isEditMode ? "actualizado" : "creado"} exitosamente`,
      })

      // Resetear formulario
      reset({
        idPago: undefined,
        ocId: "",
        fechaPago: undefined,
        tipoPago: "",
        metodoPago: "",
        moneda: "USD",
        montoOriginal: undefined,
        tasaCambio: 1,
        comisionBancoUSD: 0,
      })
      setAdjuntos([])

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: error.message || "Error al procesar el pago",
      })
    }
  }

  const handleCancel = () => {
    reset({
      idPago: undefined,
      ocId: "",
      fechaPago: undefined,
      tipoPago: "",
      metodoPago: "",
      moneda: "USD",
      montoOriginal: undefined,
      tasaCambio: 1,
      comisionBancoUSD: 0,
    })
    setAdjuntos([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogClose onClose={handleCancel} />
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Pago" : "Nuevo Pago"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <div className="p-6 space-y-4">
            {/* ID Pago - Solo mostrar en modo edición */}
            {isEditMode && (
              <div>
                <label htmlFor="idPago" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Pago
                </label>
                <Input
                  id="idPago"
                  {...register("idPago")}
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
                value={ocIdValue || ""}
                onChange={value => setValue("ocId", value)}
                placeholder={loadingOcs ? "Cargando OCs..." : "Selecciona una OC"}
                disabled={isSubmitting || loadingOcs}
              />
              {errors.ocId && <p className="text-xs text-red-600 mt-1">{errors.ocId.message}</p>}
            </div>

            {/* Fecha Pago */}
            <div>
              <label htmlFor="fechaPago" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Pago <span className="text-red-500">*</span>
              </label>
              <DatePicker
                id="fechaPago"
                value={fechaPagoValue}
                onChange={date => setValue("fechaPago", date as any)}
                disabled={isSubmitting}
              />
              {errors.fechaPago && (
                <p className="text-xs text-red-600 mt-1">{errors.fechaPago.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tipo de Pago */}
              <div>
                <label htmlFor="tipoPago" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Pago <span className="text-red-500">*</span>
                </label>
                <Select
                  options={tiposPagoOptions}
                  value={tipoPagoValue || ""}
                  onChange={value => setValue("tipoPago", value)}
                  placeholder={loadingConfig ? "Cargando tipos..." : "Selecciona tipo"}
                  disabled={isSubmitting || loadingConfig}
                />
                {errors.tipoPago && (
                  <p className="text-xs text-red-600 mt-1">{errors.tipoPago.message}</p>
                )}
              </div>

              {/* Método de Pago */}
              <div>
                <label
                  htmlFor="metodoPago"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Método de Pago <span className="text-red-500">*</span>
                </label>
                <Select
                  options={metodosPagoOptions}
                  value={metodoPagoValue || ""}
                  onChange={value => setValue("metodoPago", value)}
                  placeholder={loadingConfig ? "Cargando métodos..." : "Selecciona método"}
                  disabled={isSubmitting || loadingConfig}
                />
                {errors.metodoPago && (
                  <p className="text-xs text-red-600 mt-1">{errors.metodoPago.message}</p>
                )}
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
                  value={monedaValue || ""}
                  onChange={value => setValue("moneda", value as "USD" | "RD$")}
                  placeholder="Selecciona moneda"
                  disabled={isSubmitting}
                />
                {errors.moneda && (
                  <p className="text-xs text-red-600 mt-1">{errors.moneda.message}</p>
                )}
              </div>

              {/* Monto Original */}
              <div>
                <label
                  htmlFor="montoOriginal"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Monto Original <span className="text-red-500">*</span>
                </label>
                <Input
                  id="montoOriginal"
                  type="number"
                  min="0.01"
                  step="0.01"
                  {...register("montoOriginal", { valueAsNumber: true })}
                  placeholder="Ej: 10000.00"
                  disabled={isSubmitting}
                />
                {errors.montoOriginal && (
                  <p className="text-xs text-red-600 mt-1">{errors.montoOriginal.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tasa de Cambio */}
              <div>
                <label
                  htmlFor="tasaCambio"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tasa de Cambio <span className="text-red-500">*</span>
                </label>
                <Input
                  id="tasaCambio"
                  type="number"
                  min="0.01"
                  step="0.01"
                  {...register("tasaCambio", { valueAsNumber: true })}
                  placeholder="Ej: 60.50"
                  disabled={isSubmitting}
                />
                {errors.tasaCambio && (
                  <p className="text-xs text-red-600 mt-1">{errors.tasaCambio.message}</p>
                )}
              </div>

              {/* Comisión Banco USD */}
              <div>
                <label
                  htmlFor="comisionBancoUSD"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Comisión Banco (USD)
                </label>
                <Input
                  id="comisionBancoUSD"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("comisionBancoUSD", { valueAsNumber: true })}
                  placeholder="Ej: 10.00"
                  disabled={isSubmitting}
                />
                {errors.comisionBancoUSD && (
                  <p className="text-xs text-red-600 mt-1">{errors.comisionBancoUSD.message}</p>
                )}
              </div>
            </div>

            {/* Cálculos Automáticos */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Cálculos Automáticos</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Monto en RD$
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    RD${" "}
                    {montoRD.toLocaleString("es-DO", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {monedaValue === "RD$"
                      ? `RD$${montoOriginalValue?.toLocaleString() || "0"} (ya en pesos)`
                      : `$${montoOriginalValue?.toLocaleString() || "0"} × ${tasaCambioValue || "1"}`}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Comisión en RD$
                  </label>
                  <div className="text-lg font-semibold text-orange-600">
                    RD${" "}
                    {comisionRD.toLocaleString("es-DO", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ${comisionBancoUSDValue?.toLocaleString() || "0"} × {tasaCambioValue || "1"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Costo Total (RD$)
                  </label>
                  <div className="text-lg font-semibold text-green-700">
                    RD${" "}
                    {montoRDNeto.toLocaleString("es-DO", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Monto + Comisión</p>
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
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={e => {
                console.log("🔴 BOTÓN CLICKEADO - Evento:", e)
                console.log("🔴 isSubmitting:", isSubmitting)
                console.log("🔴 Errores actuales:", errors)
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? "Actualizando..." : "Creando..."}
                </>
              ) : isEditMode ? (
                "Actualizar Pago"
              ) : (
                "Crear Pago"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
