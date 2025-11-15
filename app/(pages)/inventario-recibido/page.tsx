"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"

interface InventarioRecibido {
  id: string
  idRecepcion: string
  fechaLlegada: string
  bodegaInicial: string
  cantidadRecibida: number
  costoUnitarioFinalRD: number | null
  costoTotalRecepcionRD: number | null
  notas: string | null
  ocChina: {
    oc: string
    proveedor: string
    cantidadOrdenada: number
  }
}

export default function InventarioRecibidoPage() {
  const [inventarios, setInventarios] = useState<InventarioRecibido[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/inventario-recibido")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setInventarios(result.data)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">Cargando...</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario Recibido</h1>
            <p className="text-gray-600 mt-1">Gestión de recepción de mercancía</p>
          </div>
          <Button>+ Nueva Recepción</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recepciones Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID Recepción</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">OC</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha Llegada</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Bodega</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Cantidad</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Costo Unitario</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Costo Total</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarios.map((inventario) => {
                    const porcentajeRecibido = (inventario.cantidadRecibida / inventario.ocChina.cantidadOrdenada) * 100
                    const isCompleto = porcentajeRecibido >= 100

                    return (
                      <tr key={inventario.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{inventario.idRecepcion}</td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{inventario.ocChina.oc}</div>
                            <div className="text-gray-500">{inventario.ocChina.proveedor}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatDate(inventario.fechaLlegada)}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {inventario.bodegaInicial}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="text-sm">
                            <div className="font-medium">
                              {inventario.cantidadRecibida.toLocaleString()}
                            </div>
                            <div className="text-gray-500">
                              de {inventario.ocChina.cantidadOrdenada.toLocaleString()}
                            </div>
                            <div className={`text-xs ${isCompleto ? 'text-green-600' : 'text-yellow-600'}`}>
                              {porcentajeRecibido.toFixed(1)}%
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {inventario.costoUnitarioFinalRD ? (
                            formatCurrency(inventario.costoUnitarioFinalRD)
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {inventario.costoTotalRecepcionRD ? (
                            <div className="font-medium">
                              {formatCurrency(inventario.costoTotalRecepcionRD)}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="ghost" className="text-sm">Ver</Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {inventarios.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No hay recepciones registradas
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
