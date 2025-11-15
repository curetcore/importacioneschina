"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Inventario {
  id: string
  idRecepcion: string
  fechaLlegada: string
  bodegaInicial: string
  cantidadRecibida: number
  ocChina: { oc: string; proveedor: string }
}

export default function InventarioRecibidoPage() {
  const [inventarios, setInventarios] = useState<Inventario[]>([])
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

        {inventarios.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">📥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay inventario recibido registrado
              </h3>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                Comienza registrando tu primera recepción de mercancía
              </p>
              <Button>+ Nueva Recepción</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Inventario Recibido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">ID Recepción</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">OC</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Proveedor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha Llegada</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Bodega</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Cantidad</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventarios.map((inv) => (
                      <tr key={inv.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{inv.idRecepcion}</td>
                        <td className="py-3 px-4">{inv.ocChina.oc}</td>
                        <td className="py-3 px-4">{inv.ocChina.proveedor}</td>
                        <td className="py-3 px-4">{formatDate(inv.fechaLlegada)}</td>
                        <td className="py-3 px-4">{inv.bodegaInicial}</td>
                        <td className="py-3 px-4 text-right">{inv.cantidadRecibida.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="ghost" className="text-sm">Ver</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
