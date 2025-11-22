# 📦 Sistema de Distribución Proporcional de Gastos

> **Versión**: 2.0
> **Fecha**: Enero 2025
> **Branch**: `feature/distribucion-por-cajas`

---

## 📑 Índice

1. [Problema Original](#problema-original)
2. [Solución Implementada](#solución-implementada)
3. [Métodos de Distribución](#métodos-de-distribución)
4. [Arquitectura del Sistema](#arquitectura-del-sistema)
5. [Flujo de Cálculo](#flujo-de-cálculo)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Migración y Compatibilidad](#migración-y-compatibilidad)
8. [Referencias de Código](#referencias-de-código)

---

## 🔴 Problema Original

### División Igual (Incorrecto)

El sistema anterior dividía los gastos compartidos **igualmente** entre todas las OCs asociadas:

```typescript
// ❌ ANTES: División igual
const montoPorOrden = montoTotal / numOrdenes

// Ejemplo:
Gasto Flete: 10,000 RD$
OC1 (100 unidades, 10 cajas)
OC2 (500 unidades, 50 cajas)

// División igual:
OC1 recibe: 10,000 / 2 = 5,000 RD$ ❌
OC2 recibe: 10,000 / 2 = 5,000 RD$ ❌

// Costo unitario:
OC1: 5,000 / 100 = 50 RD$/unidad
OC2: 5,000 / 500 = 10 RD$/unidad
```

### Problemas:

1. **Injusto**: OC pequeña paga lo mismo que OC grande
2. **Distorsiona costos**: Costo unitario no refleja realidad
3. **Doble conteo**: Dashboard sumaba gastos compartidos múltiples veces

---

## ✅ Solución Implementada

### Distribución Proporcional (Correcto)

El nuevo sistema distribuye gastos **proporcionalmente** según el método configurado:

```typescript
// ✅ AHORA: Distribución proporcional
const distribucion = distributeExpenseAcrossOCs(gasto, ocsAsociadas, method)

// Ejemplo: Distribución por CAJAS
Gasto Flete: 10,000 RD$
OC1 (100 unidades, 10 cajas) → 16.67% de cajas
OC2 (500 unidades, 50 cajas) → 83.33% de cajas

// Distribución proporcional:
OC1 recibe: 10,000 × 0.1667 = 1,667 RD$ ✓
OC2 recibe: 10,000 × 0.8333 = 8,333 RD$ ✓

// Costo unitario:
OC1: 1,667 / 100 = 16.67 RD$/unidad
OC2: 8,333 / 500 = 16.67 RD$/unidad  ✓ JUSTO!
```

---

## 🎯 Métodos de Distribución

### 1. Por Cantidad de Cajas (`"cajas"`) 📦

**Uso**: Gastos de flete, transporte local

**Fórmula**:

```typescript
porcentaje = (cajasOC / totalCajas)
montoOC = montoTotal × porcentaje
```

**Cuándo usar**:

- Flete marítimo/aéreo (cobrado por espacio/volumen)
- Transporte local (cobrado por bultos)
- Almacenaje (cobrado por espacio ocupado)

**Ejemplo**:

```typescript
Gasto: Flete Marítimo 15,000 RD$
OC1: 20 cajas → 20/80 = 25% → 3,750 RD$
OC2: 30 cajas → 30/80 = 37.5% → 5,625 RD$
OC3: 30 cajas → 30/80 = 37.5% → 5,625 RD$
Total: 80 cajas → 100% → 15,000 RD$ ✓
```

### 2. Por Valor FOB (`"valor_fob"`) 💰

**Uso**: Gastos de aduana, impuestos, comisiones bancarias

**Fórmula**:

```typescript
valorFOB = Σ(cantidad × precioUnitarioUSD) × tasaCambio
porcentaje = (valorFOB_OC / totalValorFOB)
montoOC = montoTotal × porcentaje
```

**Cuándo usar**:

- Arancel aduanal (% del valor FOB)
- ITBIS (% del valor CIF)
- Comisiones bancarias (% del monto transferido)
- Seguro de carga (% del valor asegurado)

**Ejemplo**:

```typescript
Gasto: Arancel Aduanal 12,000 RD$
OC1: 100 unid × $10 = $1,000 FOB → $1,000/$3,000 = 33.33% → 4,000 RD$
OC2: 200 unid × $10 = $2,000 FOB → $2,000/$3,000 = 66.67% → 8,000 RD$
Total: $3,000 FOB → 100% → 12,000 RD$ ✓
```

### 3. Por Unidades (`"unidades"`) 📊

**Uso**: Fallback cuando no hay datos de cajas/peso/volumen

**Fórmula**:

```typescript
costoUnitario = montoTotal / totalUnidades
montoOC = costoUnitario × unidadesOC
```

**Cuándo usar**:

- OCs antiguas sin datos de cajas
- Gastos que aplican igual por unidad
- Fallback cuando otros métodos no tienen datos

**Ejemplo**:

```typescript
Gasto: Inspección de Calidad 5,000 RD$
OC1: 100 unidades → 100/500 = 20% → 1,000 RD$
OC2: 400 unidades → 400/500 = 80% → 4,000 RD$
Total: 500 unidades → 100% → 5,000 RD$ ✓
```

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard API                             │
│                                                              │
│  1. Fetch OCs con gastos (via junction table)               │
│  2. Build gastosUnicos Map (deduplica gastos compartidos)   │
│  3. Calculate gastosDistribuidos Map                         │
│     └─> distributeExpenseAcrossOCs() por cada gasto         │
│  4. Pass distributed amounts to calcularOC()                │
│  5. Aggregate results for dashboard metrics                 │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│ lib/calculations.ts  │    │ lib/cost-distribution.ts    │
│                      │    │                             │
│ • calcularOC()       │    │ • distributeCost()          │
│ • distributeExpense  │    │ • distributeByBoxes()       │
│   AcrossOCs()        │    │ • distributeByWeight()      │
│                      │    │ • distributeByVolume()      │
│                      │    │ • distributeByFOBValue()    │
│                      │    │ • distributeByUnit()        │
└──────────────────────┘    └─────────────────────────────┘
```

### Capa de Datos

```
┌────────────────────────────────────────────────────────────┐
│                   Database Schema                           │
│                                                             │
│  oc_china:                                                  │
│    - id (PK)                                                │
│    - cantidad_cajas (NEW!) ← Campo para distribución       │
│    - items[] (productos con precio FOB)                    │
│                                                             │
│  gasto_logistico:                                           │
│    - id (PK)                                                │
│    - monto_rd                                               │
│    - tipo_gasto                                             │
│                                                             │
│  gasto_logistico_oc: (Junction table)                      │
│    - gasto_id (FK)                                          │
│    - oc_id (FK)                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Cálculo

### Dashboard API Flow

```typescript
// PASO 1: Fetch OCs con datos completos
const ocs = await db.oCChina.findMany({
  include: {
    items: true,
    pagosChina: true,
    gastosLogisticos: { include: { gasto: true } },
    inventarioRecibido: true,
  },
})

// PASO 2: Build gastosUnicos (deduplica)
const gastosUnicos = new Map<string, any>()
ocs.forEach(oc => {
  oc.gastosLogisticos.forEach(gl => {
    if (!gastosUnicos.has(gl.gasto.id)) {
      gastosUnicos.set(gl.gasto.id, {
        ...gl.gasto,
        ocIds: [oc.id], // Rastrear OCs asociadas
        numOrdenes: 1,
      })
    } else {
      gastosUnicos.get(gl.gasto.id).ocIds.push(oc.id)
      gastosUnicos.get(gl.gasto.id).numOrdenes += 1
    }
  })
})

// PASO 3: Calcular distribución proporcional
const gastosDistribuidos = new Map<string, Map<string, number>>()
gastosUnicos.forEach(gasto => {
  if (gasto.ocIds.length === 1) {
    // Solo una OC → asignar monto completo
    gastosDistribuidos.set(gasto.id, new Map([[gasto.ocIds[0], gasto.montoRD]]))
  } else {
    // Múltiples OCs → distribuir proporcionalmente
    const ocsAsociadas = ocs.filter(oc => gasto.ocIds.includes(oc.id))

    // Determinar método según tipo de gasto
    let method = "unidades"
    if (gasto.tipoGasto.includes("flete") || gasto.tipoGasto.includes("transporte")) {
      method = "cajas"
    } else if (gasto.tipoGasto.includes("aduana") || gasto.tipoGasto.includes("impuesto")) {
      method = "valor_fob"
    }

    const distribucion = distributeExpenseAcrossOCs(gasto, ocsAsociadas, method)
    gastosDistribuidos.set(gasto.id, distribucion)
  }
})

// PASO 4: Calcular OCs con montos distribuidos
const ocsCalculadas = ocs.map(oc => {
  // Modificar gastos para usar montos distribuidos
  const gastosTransformed = oc.gastosLogisticos.map(gl => ({
    ...gl.gasto,
    montoRD: new Prisma.Decimal(gastosDistribuidos.get(gl.gasto.id)?.get(oc.id) || 0),
  }))

  // Calcular usando montos distribuidos (evita doble conteo)
  const calculos = calcularOC({
    costoFOBTotalUSD,
    cantidadOrdenada,
    pagos: oc.pagosChina,
    gastos: gastosTransformed, // ← Montos YA distribuidos
    inventario: oc.inventarioRecibido,
  })

  return { ...oc, ...calculos }
})

// PASO 5: Aggregations usan MONTO COMPLETO (no dividido)
const totalGastosLogisticos = todosGastos.reduce((sum, gasto) => {
  return sum + parseFloat(gasto.montoRD.toString()) // Monto completo
}, 0)
```

### Función de Distribución

```typescript
// lib/calculations.ts:659-748
export function distributeExpenseAcrossOCs(
  gasto: { id: string; montoRD: Prisma.Decimal },
  ocs: Array<{
    id: string
    cantidadCajas?: number | null
    items: Array<{
      cantidadTotal: number
      precioUnitarioUSD: Prisma.Decimal
    }>
  }>,
  method: "cajas" | "valor_fob" | "unidades" = "cajas"
): Map<string, number> {
  const totalMonto = parseFloat(gasto.montoRD.toString())

  // Caso especial: solo una OC
  if (ocs.length === 1) {
    return new Map([[ocs[0].id, totalMonto]])
  }

  // Calcular base de distribución según método
  let distribucionBase: Array<{ id: string; valor: number }>

  if (method === "cajas") {
    distribucionBase = ocs.map(oc => ({
      id: oc.id,
      valor: oc.cantidadCajas || 0,
    }))
  } else if (method === "valor_fob") {
    distribucionBase = ocs.map(oc => ({
      id: oc.id,
      valor: oc.items.reduce(
        (sum, item) => sum + item.cantidadTotal * parseFloat(item.precioUnitarioUSD.toString()),
        0
      ),
    }))
  } else {
    distribucionBase = ocs.map(oc => ({
      id: oc.id,
      valor: oc.items.reduce((sum, item) => sum + item.cantidadTotal, 0),
    }))
  }

  const totalValor = distribucionBase.reduce((sum, oc) => sum + oc.valor, 0)

  // Fallback si total es 0
  if (totalValor === 0) {
    const montoPorOC = totalMonto / ocs.length
    return new Map(ocs.map(oc => [oc.id, montoPorOC]))
  }

  // Distribuir proporcionalmente
  const resultado = new Map<string, number>()
  distribucionBase.forEach(oc => {
    const porcentaje = oc.valor / totalValor
    const montoDistribuido = totalMonto * porcentaje
    resultado.set(oc.id, montoDistribuido)
  })

  return resultado
}
```

---

## 📚 Ejemplos Prácticos

### Ejemplo 1: Flete Marítimo (Por Cajas)

```typescript
// Contexto:
OC-001: 200 unidades, 20 cajas, $2,000 FOB
OC-002: 300 unidades, 30 cajas, $3,000 FOB
OC-003: 500 unidades, 50 cajas, $5,000 FOB

Gasto: Flete Marítimo = 20,000 RD$
Método: "cajas"

// Cálculo:
Total cajas: 20 + 30 + 50 = 100 cajas

OC-001: (20/100) × 20,000 = 4,000 RD$ (20%)
OC-002: (30/100) × 20,000 = 6,000 RD$ (30%)
OC-003: (50/100) × 20,000 = 10,000 RD$ (50%)

// Verificación:
4,000 + 6,000 + 10,000 = 20,000 RD$ ✓

// Costo unitario:
OC-001: 4,000 / 200 = 20 RD$/unidad
OC-002: 6,000 / 300 = 20 RD$/unidad
OC-003: 10,000 / 500 = 20 RD$/unidad
→ ✓ Costo unitario consistente!
```

### Ejemplo 2: Arancel Aduanal (Por Valor FOB)

```typescript
// Contexto (mismas OCs):
OC-001: $2,000 FOB
OC-002: $3,000 FOB
OC-003: $5,000 FOB

Gasto: Arancel 20% = 12,000 RD$ (asumiendo tasa 60 RD$/$)
Método: "valor_fob"

// Cálculo:
Total FOB: $2,000 + $3,000 + $5,000 = $10,000

OC-001: ($2,000/$10,000) × 12,000 = 2,400 RD$ (20%)
OC-002: ($3,000/$10,000) × 12,000 = 3,600 RD$ (30%)
OC-003: ($5,000/$10,000) × 12,000 = 6,000 RD$ (50%)

// Verificación:
2,400 + 3,600 + 6,000 = 12,000 RD$ ✓

// Porcentaje del FOB:
OC-001: 2,400 / (2,000×60) = 2% del FOB ✓
OC-002: 3,600 / (3,000×60) = 2% del FOB ✓
OC-003: 6,000 / (5,000×60) = 2% del FOB ✓
→ ✓ Tasa de arancel consistente!
```

### Ejemplo 3: Fallback por Unidades

```typescript
// Contexto: OC sin datos de cajas
OC-004: 150 unidades, cajas=null, $1,500 FOB
OC-005: 350 unidades, cajas=null, $3,500 FOB

Gasto: Transporte Local = 5,000 RD$
Método configurado: "cajas"
Método real usado: "unidades" (fallback automático)

// Cálculo:
Total unidades: 150 + 350 = 500 unidades

OC-004: (150/500) × 5,000 = 1,500 RD$ (30%)
OC-005: (350/500) × 5,000 = 3,500 RD$ (70%)

// Verificación:
1,500 + 3,500 = 5,000 RD$ ✓

// Advertencia en consola:
⚠️ Método "cajas" resultó en distribución vacía, usando fallback
✓ Fallback exitoso: usando "unidades" en lugar de "cajas"
```

---

## 🔄 Migración y Compatibilidad

### Base de Datos

```sql
-- Migración aplicada en producción (2025-01-22)
ALTER TABLE oc_china
ADD COLUMN IF NOT EXISTS cantidad_cajas INTEGER;

CREATE INDEX IF NOT EXISTS idx_oc_china_cantidad_cajas
ON oc_china(cantidad_cajas);

COMMENT ON COLUMN oc_china.cantidad_cajas IS
'Número total de cajas/bultos de esta orden (usado para distribución proporcional de gastos de flete y logística)';
```

### Compatibilidad con OCs Existentes

```typescript
// ✅ OCs ANTIGUAS (sin cantidadCajas): Funcionan con fallback
{
  id: "oc-001",
  cantidadCajas: null, // ← Campo vacío
  items: [...]
}
→ Sistema usa método "unidades" como fallback automático

// ✅ OCs NUEVAS (con cantidadCajas): Usan distribución óptima
{
  id: "oc-002",
  cantidadCajas: 25, // ← Campo poblado
  items: [...]
}
→ Sistema usa método "cajas" para gastos de flete
```

### Jerarquía de Fallback

```
1. Intentar método configurado (cajas, peso, volumen, valor_fob)
   ↓ (si falla, datos vacíos)
2. Intentar valor_fob (funciona si hay items con precio)
   ↓ (si falla, items vacíos)
3. Usar unidades (siempre funciona si hay items)
```

---

## 📖 Referencias de Código

### Archivos Principales

| Archivo                                    | Líneas  | Descripción                                              |
| ------------------------------------------ | ------- | -------------------------------------------------------- |
| `prisma/schema.prisma`                     | 45      | Campo `cantidadCajas`                                    |
| `prisma/migrations/add_cantidad_cajas.sql` | 1-15    | Migración SQL                                            |
| `lib/cost-distribution.ts`                 | 176-323 | Métodos de distribución                                  |
| `lib/calculations.ts`                      | 659-748 | Función centralizada `distributeExpenseAcrossOCs()`      |
| `app/api/dashboard/route.ts`               | 82-210  | Pre-cálculo de distribución + uso de montos distribuidos |
| `components/forms/OCChinaForm.tsx`         | 420-440 | UI campo cantidadCajas                                   |
| `lib/validations.ts`                       | 23      | Validación Zod                                           |

### Funciones Clave

```typescript
// lib/cost-distribution.ts
export function distributeByBoxes(ocs, totalCost): DistributionResult[]
export function distributeByFOBValue(products, totalCost, exchangeRate): DistributionResult[]
export function distributeByUnit(products, totalCost): DistributionResult[]
export function distributeCost(products, totalCost, method, exchangeRate): DistributionResult[]

// lib/calculations.ts
export function distributeExpenseAcrossOCs(gasto, ocs, method): Map<string, number>
export function calcularOC(data): OCCalculada
```

### Ubicaciones Corregidas (Dashboard)

| Línea   | Descripción             | Cambio                                           |
| ------- | ----------------------- | ------------------------------------------------ |
| 330     | Gastos por tipo         | Usa monto completo (no dividido)                 |
| 358     | Gastos por proveedor    | Usa monto completo                               |
| 507     | Transacciones recientes | Usa monto completo                               |
| 532     | Total gastos logísticos | Usa monto completo                               |
| 150-160 | Cálculo de OCs          | Usa montos **distribuidos** (evita doble conteo) |

---

## 🎓 Mejores Prácticas

### Al Crear OCs Nuevas

1. **Siempre llenar `cantidadCajas`** cuando sea posible
2. Usar valor real de bultos/cajas recibidas
3. Si una OC tiene múltiples entregas, actualizar el total

### Al Configurar Distribución

```typescript
// Recomendaciones por tipo de gasto:
{
  "Flete internacional": "cajas",
  "Flete marítimo": "cajas",
  "Flete aéreo": "cajas",
  "Transporte local": "cajas",
  "Almacenaje": "cajas",

  "Arancel": "valor_fob",
  "ITBIS": "valor_fob",
  "DGA": "valor_fob",
  "Seguro": "valor_fob",
  "Comisión bancaria": "valor_fob",

  // Fallback:
  "Otros": "unidades"
}
```

### Debugging

```typescript
// Verificar distribución en consola:
console.log("Distribución calculada:", gastosDistribuidos)

// Output esperado:
Map {
  "gasto-123" => Map {
    "oc-001" => 4000,
    "oc-002" => 6000,
  }
}

// Verificar warnings de fallback:
⚠️ Método "cajas" resultó en distribución vacía, usando fallback
✓ Fallback exitoso: usando "valor_fob" en lugar de "cajas"
```

---

## 📊 Métricas de Impacto

### Antes vs Después

| Métrica                 | Antes (División Igual) | Después (Proporcional) |
| ----------------------- | ---------------------- | ---------------------- |
| **Precisión de costos** | ❌ Impreciso           | ✅ Preciso             |
| **Equidad**             | ❌ Injusto             | ✅ Justo               |
| **Doble conteo**        | ❌ Presente            | ✅ Eliminado           |
| **Costo unitario**      | ❌ Inconsistente       | ✅ Consistente         |
| **Trazabilidad**        | ⚠️ Limitada            | ✅ Completa            |

### Casos de Uso Resueltos

✅ OC pequeña (10 cajas) ya no subsidia OC grande (50 cajas)
✅ Costos de flete reflejan espacio real ocupado
✅ Aranceles reflejan valor real de mercancía
✅ Dashboard muestra totales correctos (sin duplicación)
✅ Backward compatible con OCs existentes

---

## 🚀 Roadmap Futuro

### Próximas Mejoras

- [ ] Distribución por peso (cuando suppliers proporcionen datos)
- [ ] Distribución por volumen CBM (para carga aérea)
- [ ] UI para configurar métodos de distribución por tipo de gasto
- [ ] Reportes de distribución de costos por OC
- [ ] Auditoría de cambios en métodos de distribución

### Extensiones Posibles

- [ ] Distribución combinada (peso + volumen para flete)
- [ ] Reglas personalizadas de distribución
- [ ] Simulador de escenarios de distribución
- [ ] Integración con APIs de freight forwarders

---

## 📞 Soporte

Para preguntas o issues relacionados con el sistema de distribución:

- **GitHub Issues**: [Create Issue](https://github.com/curetcore/importacioneschina/issues)
- **Documentación**: Este archivo + código inline
- **Commits**: Branch `feature/distribucion-por-cajas`

---

**Última actualización**: Enero 2025
**Autor**: Sistema de Importación Curet
**Versión**: 2.0.0
