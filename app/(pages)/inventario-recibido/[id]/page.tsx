"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"

interface InventarioDetail {
  id: string
  idRecepcion: string
  ocId: string
  itemId: string | null
  fechaLlegada: string
  bodegaInicial: string
  cantidadRecibida: number
  costoUnitarioFinalRD: number | null
  costoTotalRecepcionRD: number | null
  notas: string | null
  ocChina: {
    id: string
    oc: string
    proveedor: string
    fechaOC: string
    categoriaPrincipal: string
  }
  item: {
    sku: string
    nombre: string
    cantidadTotal: number
  } | null
}

export default function InventarioRecibidoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [inventario, setInventario] = useState<InventarioDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchInventario = () => {
    if (params.id) {
      setLoading(true)
      fetch(`/api/inventario-recibido/${params.id}`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setInventario(result.data)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }

  useEffect(() => {
    fetchInventario()
  }, [params.id])

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-sm text-gray-500">Cargando...</div>
      </MainLayout>
    )
  }

  if (!inventario) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-sm text-gray-500">
          No se encontró la recepción de inventario
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/inventario-recibido")}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Inventario
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">
                Recepción #{inventario.idRecepcion}
              </h1>
              <span className="text-sm text-gray-500">
                {formatDate(inventario.fechaLlegada)} • {inventario.bodegaInicial}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/inventario-recibido?edit=${inventario.id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => router.push(`/inventario-recibido?delete=${inventario.id}`)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Información de la Recepción */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Recepción</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500">Cantidad Recibida</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {inventario.cantidadRecibida.toLocaleString()} uds
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Bodega Inicial</div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {inventario.bodegaInicial}
                  </span>
                </div>
              </div>
              {inventario.costoUnitarioFinalRD && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Costo Unitario Final</div>
                  <div className="text-2xl font-semibold text-gray-900 mt-1">
                    {formatCurrency(inventario.costoUnitarioFinalRD)}
                  </div>
                </div>
              )}
              {inventario.costoTotalRecepcionRD && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Costo Total Recepción</div>
                  <div className="text-2xl font-semibold text-gray-900 mt-1">
                    {formatCurrency(inventario.costoTotalRecepcionRD)}
                  </div>
                </div>
              )}
              {inventario.notas && (
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-gray-500">Notas</div>
                  <div className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-md">
                    {inventario.notas}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orden de Compra Asociada */}
        <Card>
          <CardHeader>
            <CardTitle>Orden de Compra Asociada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-gray-900">
                      {inventario.ocChina.oc}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                      {inventario.ocChina.categoriaPrincipal}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{inventario.ocChina.proveedor}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(inventario.ocChina.fechaOC)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/ordenes/${inventario.ocChina.id}`)}
                >
                  Ver Orden
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Producto Vinculado */}
        <Card>
          <CardHeader>
            <CardTitle>Producto Vinculado</CardTitle>
          </CardHeader>
          <CardContent>
            {!inventario.item ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No hay producto vinculado a esta recepción
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{inventario.item.sku}</div>
                    <div className="text-sm text-gray-600 mt-1">{inventario.item.nombre}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Cantidad total en sistema: {inventario.item.cantidadTotal.toLocaleString()}{" "}
                      uds
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
