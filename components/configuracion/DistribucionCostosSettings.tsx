"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectOption } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { apiPut, getErrorMessage } from "@/lib/api-client"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { Calculator, Package, DollarSign, Ship, Banknote } from "lucide-react"

interface DistribConfig {
  id: string
  tipoCosto: string
  metodoDistribucion: string
  activo: boolean
}

const costTypeLabels: Record<string, { label: string; description: string; icon: any }> = {
  pagos: {
    label: "Pagos a Proveedor",
    description: "Distribución de los pagos realizados al proveedor",
    icon: DollarSign,
  },
  gastos_flete: {
    label: "Gastos de Flete",
    description: "Costos de transporte internacional (marítimo/aéreo)",
    icon: Ship,
  },
  gastos_aduana: {
    label: "Gastos de Aduana",
    description: "Impuestos y aranceles de importación",
    icon: Package,
  },
  gastos_transporte_local: {
    label: "Transporte Local",
    description: "Transporte desde puerto/aeropuerto a bodega",
    icon: Ship,
  },
  comisiones: {
    label: "Comisiones Bancarias",
    description: "Comisiones y tarifas de transferencias",
    icon: Banknote,
  },
}

const distributionMethodOptions: SelectOption[] = [
  { value: "peso", label: "Por Peso (kg)" },
  { value: "volumen", label: "Por Volumen (CBM)" },
  { value: "valor_fob", label: "Por Valor FOB" },
  { value: "unidades", label: "Por Unidades (igual)" },
]

export function DistribucionCostosSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [updating, setUpdating] = useState<string | null>(null)

  // Fetch distribution configuration
  const { data: configs, isLoading } = useApiQuery<DistribConfig[]>(
    ["distribucion-costos-config"],
    "/api/distribucion-costos/config"
  )

  const handleMethodChange = async (tipoCosto: string, newMethod: string) => {
    setUpdating(tipoCosto)
    try {
      const result = await apiPut("/api/distribucion-costos/config", {
        tipoCosto,
        metodoDistribucion: newMethod,
      })

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar configuración")
      }

      addToast({
        type: "success",
        title: "Configuración actualizada",
        description: `Método de distribución para ${costTypeLabels[tipoCosto]?.label} actualizado`,
      })

      queryClient.invalidateQueries({ queryKey: ["distribucion-costos-config"] })
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error",
        description: getErrorMessage(error),
      })
    } finally {
      setUpdating(null)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">
        Cargando configuración de distribución de costos...
      </div>
    )
  }

  // Create a map for quick lookup
  const configMap = new Map<string, DistribConfig>()
  configs?.forEach(config => configMap.set(config.tipoCosto, config))

  return (
    <div className="space-y-6">
      {/* Header card explaining the feature */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="w-5 h-5" />
            ¿Cómo funciona la distribución de costos?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-900">
            <p>
              <strong>Por Peso:</strong> Los costos se distribuyen proporcionalmente al peso de cada
              producto. Ideal para fletes que cobran por kilogramo.
            </p>
            <p>
              <strong>Por Volumen:</strong> Los costos se distribuyen proporcionalmente al volumen
              (CBM) de cada producto. Ideal para fletes que cobran por metro cúbico.
            </p>
            <p>
              <strong>Por Valor FOB:</strong> Los costos se distribuyen proporcionalmente al valor
              del producto. Ideal para aduanas, seguros, y comisiones.
            </p>
            <p>
              <strong>Por Unidades:</strong> Los costos se distribuyen igualmente entre todas las
              unidades. Se usa como respaldo cuando no hay datos de peso/volumen.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cost type configuration cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(costTypeLabels).map(([tipoCosto, info]) => {
          const config = configMap.get(tipoCosto)
          const currentMethod = config?.metodoDistribucion || "unidades"
          const Icon = info.icon

          return (
            <Card key={tipoCosto}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="w-5 h-5 text-gray-600" />
                  {info.label}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">{info.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Distribución
                    </label>
                    <Select
                      options={distributionMethodOptions}
                      value={currentMethod}
                      onChange={value => handleMethodChange(tipoCosto, value)}
                      disabled={updating === tipoCosto}
                    />
                  </div>

                  {/* Visual indicator */}
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600">
                    <strong>Método actual:</strong>{" "}
                    {distributionMethodOptions.find(opt => opt.value === currentMethod)?.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
