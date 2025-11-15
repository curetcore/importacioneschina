"use client"

import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  categoriasPrincipales,
  tiposPago,
  metodosPago,
  bodegas,
  tiposGasto
} from "@/lib/validations"

export default function ConfiguracionPage() {
  const configuraciones = [
    {
      titulo: "Categorías Principales",
      descripcion: "Categorías disponibles para las órdenes de compra",
      items: categoriasPrincipales,
    },
    {
      titulo: "Tipos de Pago",
      descripcion: "Tipos de pago disponibles para registrar",
      items: tiposPago,
    },
    {
      titulo: "Métodos de Pago",
      descripcion: "Métodos de pago disponibles",
      items: metodosPago,
    },
    {
      titulo: "Bodegas",
      descripcion: "Bodegas disponibles para inventario",
      items: bodegas,
    },
    {
      titulo: "Tipos de Gasto",
      descripcion: "Tipos de gastos logísticos",
      items: tiposGasto,
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500 mt-1">
            Opciones y parámetros del sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configuraciones.map((config, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{config.titulo}</CardTitle>
                <p className="text-xs text-gray-500 mt-1">{config.descripcion}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {config.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monedas Soportadas</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Monedas disponibles para pagos</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {["USD", "CNY", "RD$"].map((moneda) => (
                <div
                  key={moneda}
                  className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700 text-center font-medium"
                >
                  {moneda}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">Nota sobre configuración</h3>
              <p className="text-xs text-blue-700 mt-1">
                Estas configuraciones están definidas en el código del sistema. Para modificarlas,
                edite el archivo <code className="bg-blue-100 px-1 py-0.5 rounded">lib/validations.ts</code>.
                En una futura actualización, se agregará la capacidad de gestionar estas opciones
                directamente desde la interfaz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
