"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { proveedores, categorias } from "@/lib/validations"

interface OCChinaFormProps {
  onSuccess?: () => void
}

export default function OCChinaForm({ onSuccess }: OCChinaFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    oc: "",
    proveedor: "",
    fechaOC: "",
    descripcionLote: "",
    categoriaPrincipal: "",
    cantidadOrdenada: "",
    costoFOBTotalUSD: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/oc-china", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Error al crear la orden de compra")
      }

      // Reset form
      setFormData({
        oc: "",
        proveedor: "",
        fechaOC: "",
        descripcionLote: "",
        categoriaPrincipal: "",
        cantidadOrdenada: "",
        costoFOBTotalUSD: "",
      })

      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Nueva OC</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Orden de Compra</DialogTitle>
          <DialogDescription>
            Completa los datos de la nueva orden de compra de China
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="oc">Código OC *</Label>
              <Input
                id="oc"
                placeholder="OC-2025-001"
                value={formData.oc}
                onChange={(e) => handleChange("oc", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor *</Label>
              <Select
                value={formData.proveedor}
                onValueChange={(value) => handleChange("proveedor", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((prov) => (
                    <SelectItem key={prov} value={prov}>
                      {prov}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaOC">Fecha OC *</Label>
              <Input
                id="fechaOC"
                type="date"
                value={formData.fechaOC}
                onChange={(e) => handleChange("fechaOC", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoriaPrincipal">Categoría *</Label>
              <Select
                value={formData.categoriaPrincipal}
                onValueChange={(value) => handleChange("categoriaPrincipal", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcionLote">Descripción del Lote</Label>
            <Input
              id="descripcionLote"
              placeholder="Descripción breve del lote"
              value={formData.descripcionLote}
              onChange={(e) => handleChange("descripcionLote", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidadOrdenada">Cantidad Ordenada *</Label>
              <Input
                id="cantidadOrdenada"
                type="number"
                min="1"
                placeholder="500"
                value={formData.cantidadOrdenada}
                onChange={(e) => handleChange("cantidadOrdenada", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costoFOBTotalUSD">Costo FOB Total (USD) *</Label>
              <Input
                id="costoFOBTotalUSD"
                type="number"
                min="0"
                step="0.01"
                placeholder="5000.00"
                value={formData.costoFOBTotalUSD}
                onChange={(e) => handleChange("costoFOBTotalUSD", e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Orden de Compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
