"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Pago {
  id: string
  idPago: string
  fechaPago: string
  tipoPago: string
  metodoPago: string
  moneda: string
  montoOriginal: number
  tasaCambio: number
  comisionBancoRD: number
  montoRD: number
  montoRDNeto: number
  ocChina: {
    oc: string
    proveedor: string
  }
}

export default function PagosChinaPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/pagos-china")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setPagos(result.data)
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
            <h1 className="text-3xl font-bold text-gray-900">Pagos China</h1>
            <p className="text-gray-600 mt-1">Gestión de pagos a proveedores</p>
          </div>
          <Button>+ Nuevo Pago</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pagos Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID Pago</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">OC</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Método</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Monto Original</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Tasa</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Monto RD$ (Neto)</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{pago.idPago}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="font-medium">{pago.ocChina.oc}</div>
                          <div className="text-gray-500">{pago.ocChina.proveedor}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{formatDate(pago.fechaPago)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {pago.tipoPago}
                        </span>
                      </td>
                      <td className="py-3 px-4">{pago.metodoPago}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-sm">
                          <div className="font-medium">{pago.montoOriginal.toLocaleString()}</div>
                          <div className="text-gray-500">{pago.moneda}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">{pago.tasaCambio.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(pago.montoRDNeto)}</div>
                          {pago.comisionBancoRD > 0 && (
                            <div className="text-gray-500 text-xs">
                              + {formatCurrency(pago.comisionBancoRD)} comisión
                            </div>
                          )}
                        </div>
                      </td>
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
      </div>
    </MainLayout>
  )
}
