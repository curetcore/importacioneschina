"use client"

import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  Calculator,
  TrendingUp,
  Package,
  DollarSign,
  Truck,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AyudaPage() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Centro de Ayuda</h1>
              <p className="text-muted-foreground">
                Aprende cómo funciona el sistema de costos de importación
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Costo FOB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Precio que pagas al proveedor por la mercancía
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Gastos Logísticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Flete, aduana, transporte y almacenaje
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Comisiones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cobros bancarios por transferencias internacionales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Introducción */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calculator className="w-5 h-5" />
              ¿Qué Calcula Este Sistema?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Este sistema calcula el <strong className="text-foreground">costo real</strong> de
              cada producto importado, desde que lo compras en el extranjero hasta que llega a tu
              bodega. Te ayuda a saber exactamente cuánto te costó cada unidad para establecer
              precios con márgenes precisos.
            </p>
          </CardContent>
        </Card>

        {/* Los 3 Componentes del Costo */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Componentes del Costo Total</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FOB */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="outline">Componente 1</Badge>
                </div>
                <CardTitle className="text-lg mt-4">FOB (Free On Board)</CardTitle>
                <CardDescription>Costo de la Mercancía</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Es el precio que pagas al proveedor por los productos.
                </p>
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="text-xs font-medium">Ejemplo:</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">1,000 zapatos × $10 USD</p>
                    <p className="font-semibold">FOB Total: $10,000 USD</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gastos Logísticos */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Truck className="w-5 h-5 text-orange-600" />
                  </div>
                  <Badge variant="outline">Componente 2</Badge>
                </div>
                <CardTitle className="text-lg mt-4">Gastos Logísticos</CardTitle>
                <CardDescription>Costos de Traer la Mercancía</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Todo lo que pagas para que la mercancía llegue:
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Flete marítimo/aéreo
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Agente de aduanas
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Impuestos de importación
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Almacenaje y transporte
                  </li>
                </ul>
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="text-xs font-medium">Ejemplo:</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Flete + Aduana + Transporte</p>
                    <p className="font-semibold">Total: $550 USD</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comisiones */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <Badge variant="outline">Componente 3</Badge>
                </div>
                <CardTitle className="text-lg mt-4">Comisiones Bancarias</CardTitle>
                <CardDescription>Costos de Transferencias</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Lo que cobra el banco por hacer transferencias internacionales.
                </p>
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="text-xs font-medium">Ejemplo:</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Por transferencia bancaria</p>
                    <p className="font-semibold">Comisión: $20 USD</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* La Fórmula */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              La Fórmula del Costo Total
            </CardTitle>
            <CardDescription>Cómo se calcula el costo final en RD$</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Paso 1: Sumar componentes</span>
                  <code className="px-3 py-1 bg-background rounded border text-xs">
                    FOB + Gastos + Comisiones
                  </code>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">En USD</span>
                  <code className="px-3 py-1 bg-background rounded border">
                    $10,000 + $550 + $20 = $10,570
                  </code>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Paso 2: Convertir a RD$</span>
                    <code className="px-3 py-1 bg-background rounded border text-xs">
                      Total USD × Tasa
                    </code>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">Tasa promedio: 58.00</span>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-primary">RD$ 613,060</p>
                      <p className="text-xs text-muted-foreground">Costo total invertido</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribución de Gastos */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Distribución de Gastos Compartidos</h2>
            <p className="text-muted-foreground mt-1">
              Cómo se dividen los gastos cuando múltiples órdenes viajan juntas
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Método Incorrecto */}
            <Card className="border-destructive/50">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <CardTitle className="text-destructive">División Igual (Incorrecto)</CardTitle>
                    <CardDescription>No es justo ni proporcional</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-4 space-y-3">
                  <p className="text-sm font-medium">Escenario:</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>OC-001: 50 cajas</span>
                      <span className="font-mono">$10,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>OC-002: 25 cajas</span>
                      <span className="font-mono">$5,000</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Flete compartido:</span>
                      <span className="font-mono">$600</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <p className="text-sm font-medium text-destructive mb-2">Problema:</p>
                  <p className="text-sm text-muted-foreground">
                    División igual: $600 ÷ 2 = <strong>$300 por orden</strong>
                  </p>
                  <p className="text-xs text-destructive mt-2">
                    ❌ OC-001 tiene el doble de cajas pero paga lo mismo
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Método Correcto */}
            <Card className="border-green-500/50 bg-green-500/5">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <CardTitle className="text-green-700">
                      Distribución Proporcional (Correcto)
                    </CardTitle>
                    <CardDescription>Justo y basado en criterios objetivos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="rounded-lg bg-background border p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium">Por Cajas/Volumen (Flete)</p>
                    </div>
                    <div className="space-y-1 text-sm font-mono text-muted-foreground">
                      <p>Total: 75 cajas</p>
                      <p>Costo: $600 ÷ 75 = $8/caja</p>
                    </div>
                    <div className="space-y-1 text-sm pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">OC-001 (50 cajas):</span>
                        <span className="font-semibold text-green-700">$400</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">OC-002 (25 cajas):</span>
                        <span className="font-semibold text-green-700">$200</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-background border p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium">Por Valor FOB (Impuestos)</p>
                    </div>
                    <div className="space-y-1 text-sm font-mono text-muted-foreground">
                      <p>Total FOB: $15,000</p>
                      <p>Impuesto: $900</p>
                    </div>
                    <div className="space-y-1 text-sm pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">OC-001 (66.7%):</span>
                        <span className="font-semibold text-green-700">$600</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">OC-002 (33.3%):</span>
                        <span className="font-semibold text-green-700">$300</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cálculo del Costo Unitario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Cálculo del Costo Unitario
            </CardTitle>
            <CardDescription>Tres pasos para obtener el costo por unidad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Paso 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">Sumar todos los costos</h4>
                    <p className="text-sm text-muted-foreground">
                      FOB + Gastos distribuidos + Comisiones
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">FOB:</span>
                      <span className="text-right font-mono">$10,000</span>
                      <span className="text-muted-foreground">Gastos:</span>
                      <span className="text-right font-mono">$1,000</span>
                      <span className="text-muted-foreground">Comisiones:</span>
                      <span className="text-right font-mono">$50</span>
                      <div className="col-span-2 border-t pt-2 flex justify-between font-semibold">
                        <span>Total invertido:</span>
                        <span className="text-primary">$11,050 USD</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">Convertir a moneda local</h4>
                    <p className="text-sm text-muted-foreground">Usar tasa de cambio promedio</p>
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">Tasa promedio: 58.50</p>
                      <p className="font-mono font-semibold text-primary">
                        $11,050 × 58.50 = RD$ 646,425
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">Dividir entre unidades recibidas</h4>
                    <p className="text-sm text-muted-foreground">
                      Importante: usar unidades recibidas, no ordenadas
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Ordenadas:</span>
                      <span className="text-right font-mono">1,000</span>
                      <span className="text-muted-foreground">Recibidas:</span>
                      <span className="text-right font-mono">980</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      (20 unidades dañadas en tránsito)
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/10 border-2 border-primary p-4">
                    <p className="text-sm text-muted-foreground mb-2">Costo unitario final:</p>
                    <p className="font-mono text-2xl font-bold text-primary">RD$ 659.61</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Este es tu costo REAL por unidad
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
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Puntos Clave a Recordar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: DollarSign,
                  title: "FOB",
                  description: "Costo de la mercancía del proveedor",
                },
                {
                  icon: Scale,
                  title: "Gastos",
                  description: "Se distribuyen proporcionalmente, no por igual",
                },
                {
                  icon: Truck,
                  title: "Flete",
                  description: "Distribución por cajas o volumen",
                },
                {
                  icon: DollarSign,
                  title: "Aduana",
                  description: "Distribución por valor FOB",
                },
                {
                  icon: Package,
                  title: "Costo unitario",
                  description: "Total invertido ÷ Unidades recibidas",
                },
                {
                  icon: TrendingUp,
                  title: "Comisiones",
                  description: "Incluir en el costo total para precisión",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="bg-muted/50">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Tienes más preguntas? Contacta al administrador del sistema para obtener ayuda
              adicional.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
