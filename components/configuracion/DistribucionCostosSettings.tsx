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
  // NOTA: "pagos" NO se incluye aquí porque los pagos al proveedor SIEMPRE
  // se asignan directamente por valor FOB (no necesitan distribución)
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
  { value: "cajas", label: "Por Cantidad de Cajas" },
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

      {/* Documentation cards - moved to the end */}
      <div className="space-y-4 mt-6">
        {/* Info card: How it works */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-blue-900">
              <Calculator className="w-5 h-5" />
              ¿Cómo funciona la distribución de costos?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>
              Cada tipo de costo (flete, aduana, transporte local, comisiones) se distribuye entre
              todos los productos de una importación según el método seleccionado:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Por Peso:</strong> Productos más pesados absorben mayor proporción del costo
              </li>
              <li>
                <strong>Por Volumen:</strong> Productos con mayor CBM absorben más costo (ideal para
                flete)
              </li>
              <li>
                <strong>Por Valor FOB:</strong> Productos más costosos absorben más (ideal para
                seguros)
              </li>
              <li>
                <strong>Por Unidades:</strong> Distribución igualitaria entre todos los productos
              </li>
              <li>
                <strong>Por Cantidad de Cajas:</strong> Órdenes con más cajas absorben más costo
                (ideal para gastos de almacenaje)
              </li>
            </ul>
            <p className="pt-2 text-xs italic">
              💡 Tip: Por volumen es ideal para flete, por valor FOB para aduana/comisiones, y por
              cajas para almacenaje/manipulación.
            </p>
          </CardContent>
        </Card>

        {/* Info card: Supplier payments */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-green-900">
              <DollarSign className="w-5 h-5" />
              Pagos a Proveedor - Asignación Automática
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-green-800 space-y-2">
            <p>
              <strong>Los pagos al proveedor NO se distribuyen</strong> - se asignan directamente a
              cada producto según su valor FOB individual.
            </p>
            <p className="text-xs">
              Ejemplo: Si pagas $5,000 al proveedor y tienes 3 productos con valores FOB de $2,000,
              $2,000 y $1,000, cada producto absorberá exactamente esa proporción del pago.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
