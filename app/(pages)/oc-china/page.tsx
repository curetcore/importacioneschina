"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"

interface OCChina {
  id: string
  oc: string
  proveedor: string
  fechaOC: string
  categoriaPrincipal: string
  cantidadOrdenada: number
  costoFOBTotalUSD: number
}

export default function OCChinaPage() {
  const [ocs, setOcs] = useState<OCChina[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/oc-china")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setOcs(result.data)
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
            <h1 className="text-3xl font-bold text-gray-900">OC China</h1>
            <p className="text-gray-600 mt-1">Gestion de ordenes de compra</p>
          </div>
          <Button>+ Nueva OC</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ordenes de Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">OC</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Proveedor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Categoria</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Cantidad</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Costo FOB</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ocs.map((oc) => (
                    <tr key={oc.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{oc.oc}</td>
                      <td className="py-3 px-4">{oc.proveedor}</td>
                      <td className="py-3 px-4">{formatDate(oc.fechaOC)}</td>
                      <td className="py-3 px-4">{oc.categoriaPrincipal}</td>
                      <td className="py-3 px-4 text-right">{oc.cantidadOrdenada.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">${oc.costoFOBTotalUSD.toLocaleString()}</td>
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
