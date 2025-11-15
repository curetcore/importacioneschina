"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Gasto {
  id: string
  idGasto: string
  fechaGasto: string
  tipoGasto: string
  proveedorServicio: string | null
  montoRD: number
  ocChina: { oc: string; proveedor: string }
}

export default function GastosLogisticosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
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

        {gastos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay gastos logísticos registrados
              </h3>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                Comienza registrando tu primer gasto logístico (flete, aduana, broker, etc.)
              </p>
              <Button>+ Nuevo Gasto</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Gastos Logísticos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">ID Gasto</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">OC</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Proveedor</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Monto RD$</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastos.map((gasto) => (
                      <tr key={gasto.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{gasto.idGasto}</td>
                        <td className="py-3 px-4">{gasto.ocChina.oc}</td>
                        <td className="py-3 px-4">{formatDate(gasto.fechaGasto)}</td>
                        <td className="py-3 px-4">{gasto.tipoGasto}</td>
                        <td className="py-3 px-4">{gasto.proveedorServicio || "-"}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(gasto.montoRD)}</td>
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
