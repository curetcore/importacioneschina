"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"

interface GastoLogistico {
  id: string
  idGasto: string
  fechaGasto: string
  tipoGasto: string
  proveedorServicio: string | null
  montoRD: number
  notas: string | null
  ocChina: {
    oc: string
    proveedor: string
  }
}

export default function GastosLogisticosPage() {
  const [gastos, setGastos] = useState<GastoLogistico[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/gastos-logisticos")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setGastos(result.data)
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
            <h1 className="text-3xl font-bold text-gray-900">Gastos Logísticos</h1>
            <p className="text-gray-600 mt-1">Gestión de gastos de importación</p>
          </div>
          <Button>+ Nuevo Gasto</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gastos Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID Gasto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">OC</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo de Gasto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Proveedor Servicio</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Monto RD$</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((gasto) => (
                    <tr key={gasto.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{gasto.idGasto}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="font-medium">{gasto.ocChina.oc}</div>
                          <div className="text-gray-500">{gasto.ocChina.proveedor}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{formatDate(gasto.fechaGasto)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {gasto.tipoGasto}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {gasto.proveedorServicio || (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-medium">{formatCurrency(gasto.montoRD)}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" className="text-sm">Ver</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {gastos.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No hay gastos registrados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
