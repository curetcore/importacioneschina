"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { distribuirGastosLogisticos, calcularResumenFinanciero } from "@/lib/calculations"
import { AddAttachmentsDialog } from "@/components/ui/add-attachments-dialog"
import { AttachmentsList } from "@/components/ui/attachments-list"
import { ArrowLeft, Paperclip } from "lucide-react"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

interface OCChinaItem {
  id: string
  sku: string
  nombre: string
  material: string | null
  color: string | null
  especificaciones: string | null
  tallaDistribucion: any
  cantidadTotal: number
  precioUnitarioUSD: number
  subtotalUSD: number
}

interface OCDetail {
  id: string
  oc: string
  proveedor: string
  fechaOC: string
  categoriaPrincipal: string
  descripcionLote: string | null
  adjuntos?: FileAttachment[]
  items: OCChinaItem[]
  pagosChina: Array<{
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
  }>
  gastosLogisticos: Array<{
    id: string
    idGasto: string
    fechaGasto: string
    tipoGasto: string
    proveedorServicio: string | null
    montoRD: number
    notas: string | null
  }>
  inventarioRecibido: Array<{
    id: string
    idRecepcion: string
    fechaLlegada: string
    bodegaInicial: string
    cantidadRecibida: number
    costoUnitarioFinalRD: number | null
    costoTotalRecepcionRD: number | null
    notas: string | null
    item: OCChinaItem | null
  }>
}

export default function OCDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [oc, setOc] = useState<OCDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false)

  const fetchOC = () => {
    if (params.id) {
      setLoading(true)
      fetch(`/api/oc-china/${params.id}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setOc(result.data)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }

  useEffect(() => {
    fetchOC()
  }, [params.id])

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-sm text-gray-500">Cargando...</div>
      </MainLayout>
    )
  }

  if (!oc) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-sm text-gray-500">No se encontró la orden de compra</div>
      </MainLayout>
    )
  }

  // Calcular distribución de costos por producto
  const itemsConCostos = distribuirGastosLogisticos(
    oc.items,
    oc.gastosLogisticos,
    oc.pagosChina
  )

  // Calcular resumen financiero
  const resumen = calcularResumenFinanciero(
    oc.items,
    oc.pagosChina,
    oc.gastosLogisticos
  )

  const cantidadOrdenada = resumen.totalUnidades
  const costoFOBTotalUSD = resumen.totalFOBUSD
  const totalPagado = resumen.totalPagadoRD
  const totalGastos = resumen.totalGastosRD
  const totalRecibido = oc.inventarioRecibido.reduce((sum, inv) => sum + inv.cantidadRecibida, 0)
  const porcentajeRecibido = cantidadOrdenada > 0 ? (totalRecibido / cantidadOrdenada) * 100 : 0

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/ordenes")}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Órdenes
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">Orden {oc.oc}</h1>
            <p className="text-sm text-gray-500 mt-1">{oc.proveedor}</p>
          </div>
        </div>

        {/* Resumen de la OC */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500">Fecha OC</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {formatDate(oc.fechaOC)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500">Categoría</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {oc.categoriaPrincipal}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500">Productos</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {oc.items.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500">Unidades Totales</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {cantidadOrdenada.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500">Costo FOB Total</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {formatCurrency(costoFOBTotalUSD, "USD")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Productos con Costos Distribuidos */}
        <Card>
          <CardHeader>
            <CardTitle>
              Productos con Costos Distribuidos ({oc.items.length})
              {resumen.tasaCambioPromedio > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Tasa promedio: {formatCurrency(resumen.tasaCambioPromedio)} / USD)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {itemsConCostos.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No hay productos en esta orden
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">SKU</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Producto</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Cant.</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">FOB USD</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">% FOB</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">FOB RD$</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Gastos RD$</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Total RD$</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide bg-blue-50">Costo Unit.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsConCostos.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.sku}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          <div className="font-medium">{item.nombre}</div>
                          {item.tallaDistribucion && (
                            <div className="text-xs text-gray-500 mt-1" title={JSON.stringify(item.tallaDistribucion)}>
                              {Object.keys(item.tallaDistribucion).length} tallas
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                          {item.cantidadTotal.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-900">
                          {formatCurrency(item.subtotalUSD, "USD")}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">
                          {item.porcentajeFOB.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-900">
                          {formatCurrency(item.costoFOBRD)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-700">
                          {formatCurrency(item.gastosLogisticosRD)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(item.costoTotalRD)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-semibold text-blue-600 bg-blue-50">
                          {formatCurrency(item.costoUnitarioRD)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={2} className="py-3 px-4 text-sm text-right text-gray-700">
                        TOTALES:
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900">
                        {cantidadOrdenada.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900">
                        {formatCurrency(costoFOBTotalUSD, "USD")}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        100%
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900">
                        {formatCurrency(resumen.totalPagadoRD)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900">
                        {formatCurrency(resumen.totalGastosRD)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900">
                        {formatCurrency(resumen.totalCostoRD)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-blue-600 bg-blue-50">
                        {formatCurrency(resumen.costoUnitarioPromedioRD)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen Financiero */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500">Total Pagado (RD$)</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(totalPagado)}
                </div>
                <div className="text-xs text-gray-500 mt-1">{oc.pagosChina.length} pagos realizados</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Gastos Logísticos (RD$)</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(totalGastos)}
                </div>
                <div className="text-xs text-gray-500 mt-1">{oc.gastosLogisticos.length} gastos registrados</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Costo Total (RD$)</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(totalPagado + totalGastos)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Inventario */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500">Cantidad Recibida</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {totalRecibido.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">de {cantidadOrdenada.toLocaleString()} ordenados</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Progreso de Recepción</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {porcentajeRecibido.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-gray-900 h-2 rounded-full"
                    style={{ width: `${Math.min(porcentajeRecibido, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Recepciones</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {oc.inventarioRecibido.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">recepciones registradas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Pagos */}
        <Card>
          <CardHeader>
            <CardTitle>Pagos Realizados ({oc.pagosChina.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {oc.pagosChina.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No hay pagos registrados para esta orden
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">ID Pago</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Método</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Monto Original</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Monto RD$ (Neto)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oc.pagosChina.map((pago) => (
                      <tr key={pago.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{pago.idPago}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(pago.fechaPago)}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{pago.tipoPago}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{pago.metodoPago}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{pago.montoOriginal.toLocaleString()}</div>
                            <div className="text-gray-500 text-xs">{pago.moneda}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(pago.montoRDNeto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla de Gastos Logísticos */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos Logísticos ({oc.gastosLogisticos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {oc.gastosLogisticos.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No hay gastos logísticos registrados para esta orden
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">ID Gasto</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Proveedor</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Monto RD$</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oc.gastosLogisticos.map((gasto) => (
                      <tr key={gasto.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{gasto.idGasto}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(gasto.fechaGasto)}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{gasto.tipoGasto}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {gasto.proveedorServicio || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(gasto.montoRD)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla de Inventario Recibido */}
        <Card>
          <CardHeader>
            <CardTitle>Inventario Recibido ({oc.inventarioRecibido.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {oc.inventarioRecibido.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No hay recepciones de inventario registradas para esta orden
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">ID Recepción</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha Llegada</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Bodega</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Cantidad</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Costo Unitario</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Costo Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oc.inventarioRecibido.map((inv) => (
                      <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{inv.idRecepcion}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(inv.fechaLlegada)}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{inv.bodegaInicial}</td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                          {inv.cantidadRecibida.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-900">
                          {inv.costoUnitarioFinalRD !== null
                            ? formatCurrency(inv.costoUnitarioFinalRD)
                            : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                          {inv.costoTotalRecepcionRD !== null
                            ? formatCurrency(inv.costoTotalRecepcionRD)
                            : <span className="text-gray-400">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección de Adjuntos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Paperclip size={18} />
              Archivos Adjuntos ({oc.adjuntos?.length || 0})
            </CardTitle>
            <Button
              onClick={() => setAttachmentsDialogOpen(true)}
              variant="outline"
              className="h-8 gap-2"
            >
              <Paperclip size={16} />
              Agregar Archivos
            </Button>
          </CardHeader>
          <CardContent>
            {!oc.adjuntos || oc.adjuntos.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No hay archivos adjuntos para esta orden
              </div>
            ) : (
              <AttachmentsList attachments={oc.adjuntos} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo para agregar adjuntos */}
      <AddAttachmentsDialog
        open={attachmentsDialogOpen}
        onOpenChange={setAttachmentsDialogOpen}
        module="oc-china"
        recordId={oc.id}
        recordName={`Orden ${oc.oc}`}
        currentAttachments={oc.adjuntos || []}
        onSuccess={fetchOC}
      />
    </MainLayout>
  )
}
