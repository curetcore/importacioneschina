"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { getErrorMessage, getErrorDetails } from "@/lib/api-client"

interface MetodoPago {
  id: string
  nombre: string
  tipo: string
  proveedorId?: string | null
  moneda: string
  banco?: string | null
  numeroCuenta?: string | null
  titular?: string | null
  swift?: string | null
  iban?: string | null
  ultimos4Digitos?: string | null
  tipoTarjeta?: string | null
  email?: string | null
  telefono?: string | null
  idCuenta?: string | null
  limiteTransaccion?: number | null
  comisionPorcentaje?: number | null
  comisionFija?: number | null
  balanceActual?: number | null
  notas?: string | null
  activo: boolean
}

interface Proveedor {
  id: string
  codigo: string
  nombre: string
}

interface MetodoPagoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  metodoPagoToEdit?: MetodoPago | null
}

export function MetodoPagoForm({ open, onOpenChange, onSuccess, metodoPagoToEdit }: MetodoPagoFormProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])

  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "banco" as "banco" | "tarjeta" | "monedero_digital",
    proveedorId: "",
    moneda: "USD",
    banco: "",
    numeroCuenta: "",
    titular: "",
    swift: "",
    iban: "",
    ultimos4Digitos: "",
    tipoTarjeta: "",
    email: "",
    telefono: "",
    idCuenta: "",
    limiteTransaccion: 0,
    comisionPorcentaje: 0,
    comisionFija: 0,
    balanceActual: 0,
    notas: "",
  })

  useEffect(() => {
    if (open) {
      fetchProveedores()
    }
  }, [open])

  const fetchProveedores = async () => {
    try {
      const response = await fetch("/api/proveedores?activo=true")
      const result = await response.json()
      if (result.success) {
        setProveedores(result.data)
      }
    } catch (error) {
      console.error("Error fetching proveedores:", error)
    }
  }

  useEffect(() => {
    if (metodoPagoToEdit) {
      setFormData({
        nombre: metodoPagoToEdit.nombre,
        tipo: metodoPagoToEdit.tipo as any,
        proveedorId: metodoPagoToEdit.proveedorId || "",
        moneda: metodoPagoToEdit.moneda,
        banco: metodoPagoToEdit.banco || "",
        numeroCuenta: metodoPagoToEdit.numeroCuenta || "",
        titular: metodoPagoToEdit.titular || "",
        swift: metodoPagoToEdit.swift || "",
        iban: metodoPagoToEdit.iban || "",
        ultimos4Digitos: metodoPagoToEdit.ultimos4Digitos || "",
        tipoTarjeta: metodoPagoToEdit.tipoTarjeta || "",
        email: metodoPagoToEdit.email || "",
        telefono: metodoPagoToEdit.telefono || "",
        idCuenta: metodoPagoToEdit.idCuenta || "",
        limiteTransaccion: metodoPagoToEdit.limiteTransaccion ? Number(metodoPagoToEdit.limiteTransaccion) : 0,
        comisionPorcentaje: metodoPagoToEdit.comisionPorcentaje ? Number(metodoPagoToEdit.comisionPorcentaje) : 0,
        comisionFija: metodoPagoToEdit.comisionFija ? Number(metodoPagoToEdit.comisionFija) : 0,
        balanceActual: metodoPagoToEdit.balanceActual ? Number(metodoPagoToEdit.balanceActual) : 0,
        notas: metodoPagoToEdit.notas || "",
      })
    } else {
      setFormData({
        nombre: "",
        tipo: "banco",
        proveedorId: "",
        moneda: "USD",
        banco: "",
        numeroCuenta: "",
        titular: "",
        swift: "",
        iban: "",
        ultimos4Digitos: "",
        tipoTarjeta: "",
        email: "",
        telefono: "",
        idCuenta: "",
        limiteTransaccion: 0,
        comisionPorcentaje: 0,
        comisionFija: 0,
        balanceActual: 0,
        notas: "",
      })
    }
  }, [metodoPagoToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = metodoPagoToEdit ? `/api/metodos-pago/${metodoPagoToEdit.id}` : "/api/metodos-pago"
      const method = metodoPagoToEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Error al guardar método de pago")
      }

      addToast({
        type: "success",
        title: metodoPagoToEdit ? "Método actualizado" : "Método creado",
        description: `${formData.nombre} ${metodoPagoToEdit ? "actualizado" : "creado"} exitosamente`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: getErrorMessage(error),
        details: getErrorDetails(error),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {metodoPagoToEdit ? "Editar Método de Pago" : "Nuevo Método de Pago"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Información Básica</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Cuenta USD Bank of America"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  required
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="banco">Cuenta Bancaria</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="monedero_digital">Monedero Digital</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor (Opcional)
                </label>
                <select
                  value={formData.proveedorId}
                  onChange={(e) => setFormData({ ...formData, proveedorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Sin proveedor asociado</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda *
                </label>
                <select
                  required
                  value={formData.moneda}
                  onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                  <option value="EUR">EUR</option>
                  <option value="DOP">DOP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Datos bancarios */}
          {formData.tipo === "banco" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Datos Bancarios</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banco
                  </label>
                  <input
                    type="text"
                    value={formData.banco}
                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Bank of America"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Cuenta
                  </label>
                  <input
                    type="text"
                    value={formData.numeroCuenta}
                    onChange={(e) => setFormData({ ...formData, numeroCuenta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titular
                  </label>
                  <input
                    type="text"
                    value={formData.titular}
                    onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SWIFT
                  </label>
                  <input
                    type="text"
                    value={formData.swift}
                    onChange={(e) => setFormData({ ...formData, swift: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Datos de tarjeta */}
          {formData.tipo === "tarjeta" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Datos de Tarjeta</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Últimos 4 Dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formData.ultimos4Digitos}
                    onChange={(e) => setFormData({ ...formData, ultimos4Digitos: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Tarjeta
                  </label>
                  <select
                    value={formData.tipoTarjeta}
                    onChange={(e) => setFormData({ ...formData, tipoTarjeta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="credito">Crédito</option>
                    <option value="debito">Débito</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Datos de monedero digital */}
          {formData.tipo === "monedero_digital" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Datos de Monedero Digital</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Para PayPal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Para Alipay/WeChat"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID de Cuenta
                  </label>
                  <input
                    type="text"
                    value={formData.idCuenta}
                    onChange={(e) => setFormData({ ...formData, idCuenta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Balance y límites */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Balance y Límites</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance Actual
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balanceActual}
                  onChange={(e) => setFormData({ ...formData, balanceActual: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Transacción
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.limiteTransaccion}
                  onChange={(e) => setFormData({ ...formData, limiteTransaccion: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : metodoPagoToEdit ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
