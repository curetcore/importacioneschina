"use client"

import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calculator, TrendingUp, Package, DollarSign, Truck } from "lucide-react"

export default function AyudaPage() {
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Centro de Ayuda</h1>
          </div>
          <p className="text-blue-100">
            Aprende cómo funciona el sistema de costos de importación paso a paso
          </p>
        </div>

        {/* Introducción */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              ¿Qué Calcula Este Sistema?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Este sistema calcula el <strong>costo real</strong> de cada producto importado, desde
              que lo compras en el extranjero hasta que llega a tu bodega. Te ayuda a saber
              exactamente cuánto te costó cada unidad para que puedas establecer precios de venta
              con márgenes de ganancia precisos.
            </p>
          </CardContent>
        </Card>

        {/* Los 3 Componentes */}
        <Card>
          <CardHeader>
            <CardTitle>Los 3 Componentes del Costo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* FOB */}
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  1. FOB (Free On Board) - Costo de la Mercancía
                </h3>
              </div>
              <p className="text-gray-700 mb-3">
                Es el precio que pagas al proveedor por los productos.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">Ejemplo:</p>
                <p className="text-sm text-blue-800">
                  • Compraste 1,000 zapatos a $10 USD cada uno
                  <br />• <strong>FOB Total = $10,000 USD</strong>
                </p>
              </div>
            </div>

            {/* Gastos Logísticos */}
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  2. Gastos Logísticos - Costos de Traer la Mercancía
                </h3>
              </div>
              <p className="text-gray-700 mb-3">
                Todo lo que pagas para que la mercancía llegue a tu país:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-3">
                <li>Flete marítimo/aéreo</li>
                <li>Agente de aduanas</li>
                <li>Impuestos de importación</li>
                <li>Almacenaje</li>
                <li>Transporte local</li>
              </ul>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm font-medium text-green-900 mb-1">Ejemplo:</p>
                <p className="text-sm text-green-800">
                  • Flete: $300
                  <br />• Aduana: $200
                  <br />• Transporte: $50
                  <br />• <strong>Total Gastos = $550 USD</strong>
                </p>
              </div>
            </div>

            {/* Comisiones */}
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">3. Comisiones Bancarias</h3>
              </div>
              <p className="text-gray-700 mb-3">
                Lo que cobra el banco por hacer las transferencias internacionales.
              </p>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm font-medium text-purple-900 mb-1">Ejemplo:</p>
                <p className="text-sm text-purple-800">
                  • <strong>Comisión = $20 USD</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* La Fórmula */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              La Fórmula del Costo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-300">
              <div className="space-y-3 font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Costo Total =</span>
                  <span className="font-semibold text-gray-900">
                    FOB + Gastos Logísticos + Comisiones
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Costo Total =</span>
                  <span className="font-semibold text-gray-900">
                    $10,000 + $550 + $20 = $10,570 USD
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Convertir a RD$ (tasa 58):</span>
                    <span className="font-bold text-lg text-blue-600">
                      $10,570 × 58 = RD$ 613,060
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribución de Gastos */}
        <Card>
          <CardHeader>
            <CardTitle>¿Cómo se Dividen los Gastos Compartidos?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700">
              <strong>Situación común:</strong> Haces varias órdenes de compra que viajan juntas en
              el mismo contenedor. Los gastos de flete, aduana y transporte se comparten entre todas
              las órdenes.
            </p>

            {/* Método Incorrecto */}
            <div className="bg-red-50 rounded-lg p-5 border border-red-200">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                ❌ Forma INCORRECTA (División Igual)
              </h4>
              <p className="text-sm text-red-800 mb-3">
                Si divides los gastos por igual entre las órdenes, <strong>no es justo</strong>.
              </p>
              <div className="bg-white rounded p-3 mb-3">
                <p className="text-xs text-gray-600 mb-2">Ejemplo:</p>
                <p className="text-sm text-gray-800">
                  • <strong>OC-001:</strong> 50 cajas de zapatos (FOB $10,000)
                  <br />• <strong>OC-002:</strong> 25 cajas de carteras (FOB $5,000)
                  <br />• <strong>Flete compartido:</strong> $600
                </p>
              </div>
              <div className="bg-red-100 rounded p-3">
                <p className="text-sm text-red-900">
                  División igual: $600 ÷ 2 = <strong>$300 por orden</strong>
                  <br />
                  <span className="text-xs mt-1 block">
                    ❌ Problema: OC-001 tiene el doble de cajas pero paga lo mismo que OC-002
                  </span>
                </p>
              </div>
            </div>

            {/* Método Correcto */}
            <div className="bg-green-50 rounded-lg p-5 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                ✅ Forma CORRECTA (Distribución Proporcional)
              </h4>
              <p className="text-sm text-green-800 mb-4">
                Los gastos se dividen según criterios justos:
              </p>

              {/* Por Cajas */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h5 className="font-semibold text-gray-900 mb-2 text-sm">
                  Flete y Transporte → Por cantidad de cajas/volumen
                </h5>
                <div className="bg-gray-50 rounded p-3 font-mono text-xs space-y-1">
                  <p>Total: 75 cajas (50 + 25)</p>
                  <p>Costo por caja: $600 ÷ 75 = $8/caja</p>
                  <p className="text-green-700 font-semibold">
                    OC-001: 50 cajas × $8 = $400 (66.7%)
                  </p>
                  <p className="text-green-700 font-semibold">
                    OC-002: 25 cajas × $8 = $200 (33.3%)
                  </p>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  ✅ Justo: Quien ocupa más espacio, paga más
                </p>
              </div>

              {/* Por Valor FOB */}
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2 text-sm">
                  Impuestos y Aduana → Por valor FOB
                </h5>
                <div className="bg-gray-50 rounded p-3 font-mono text-xs space-y-1">
                  <p>Total FOB: $15,000 ($10,000 + $5,000)</p>
                  <p>Impuesto: $900</p>
                  <p className="text-green-700 font-semibold">
                    OC-001: ($10,000 ÷ $15,000) × $900 = $600 (66.7%)
                  </p>
                  <p className="text-green-700 font-semibold">
                    OC-002: ($5,000 ÷ $15,000) × $900 = $300 (33.3%)
                  </p>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  ✅ Justo: Quien importa más valor, paga más impuestos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cálculo del Costo Unitario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Cálculo del Costo Unitario (Paso a Paso)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* Paso 1 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
                    1
                  </span>
                  <h4 className="font-semibold text-gray-900">
                    Sumar todos los costos de la orden
                  </h4>
                </div>
                <div className="ml-8 bg-gray-50 rounded p-4 font-mono text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">FOB:</span>
                      <span>$10,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gastos distribuidos:</span>
                      <span>$1,000 (flete + impuestos)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Comisiones:</span>
                      <span>$50</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-bold">
                      <span>Total invertido:</span>
                      <span className="text-blue-600">$11,050 USD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 2 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
                    2
                  </span>
                  <h4 className="font-semibold text-gray-900">Convertir a moneda local</h4>
                </div>
                <div className="ml-8 bg-gray-50 rounded p-4 font-mono text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-600">Tasa de cambio promedio: 58.50</p>
                    <p className="font-bold text-blue-600">$11,050 × 58.50 = RD$ 646,425</p>
                  </div>
                </div>
              </div>

              {/* Paso 3 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
                    3
                  </span>
                  <h4 className="font-semibold text-gray-900">Dividir entre unidades recibidas</h4>
                </div>
                <div className="ml-8 space-y-3">
                  <div className="bg-gray-50 rounded p-4 font-mono text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unidades ordenadas:</span>
                        <span>1,000 zapatos</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unidades recibidas:</span>
                        <span>980 zapatos</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">(20 se dañaron en tránsito)</p>
                    </div>
                  </div>
                  <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4">
                    <p className="font-mono text-sm mb-2">Costo unitario = RD$ 646,425 ÷ 980</p>
                    <p className="font-bold text-xl text-blue-700">
                      Costo unitario = RD$ 659.61 por zapato
                    </p>
                    <p className="text-xs text-blue-700 mt-2">
                      📌 Este es tu costo REAL por unidad
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Puntos Clave */}
        <Card>
          <CardHeader>
            <CardTitle>Puntos Clave a Recordar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">FOB</p>
                  <p className="text-sm text-gray-600">Costo de la mercancía</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Gastos</p>
                  <p className="text-sm text-gray-600">
                    Se distribuyen proporcionalmente (no por igual)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Flete</p>
                  <p className="text-sm text-gray-600">Por cajas/volumen</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Aduana</p>
                  <p className="text-sm text-gray-600">Por valor FOB</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Costo unitario</p>
                  <p className="text-sm text-gray-600">Todo ÷ Unidades recibidas (no ordenadas)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-sm text-blue-800">
            ¿Tienes más preguntas? Contacta al administrador del sistema para obtener ayuda
            adicional.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}
