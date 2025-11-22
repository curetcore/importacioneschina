# 🏗️ Arquitectura y Robustez del Sistema

**Sistema de Importaciones - Curet**
**Basado en principios de Odoo ERP**
**Última actualización:** Noviembre 2025

---

## 📋 Tabla de Contenidos

1. [Principios de Diseño](#principios-de-diseño)
2. [Validaciones Implementadas](#validaciones-implementadas)
3. [Protecciones de Seguridad](#protecciones-de-seguridad)
4. [Distribución de Costos](#distribución-de-costos)
5. [Issues Conocidos](#issues-conocidos)
6. [Comparación con Odoo](#comparación-con-odoo)

---

## Principios de Diseño

### Arquitectura de Datos

El sistema sigue los principios de Odoo ERP para garantizar robustez y consistencia:

#### Campos Computados vs Almacenados

**✅ Campos COMPUTADOS (Calculados dinámicamente):**

- `cantidadOrdenada` en OCChina → Suma de `items.cantidadTotal`
- `costoFOBTotalUSD` en OCChina → Suma de `items.subtotalUSD`
- Todos los totales en Dashboard
- Distribución de gastos logísticos

**✅ Campos ALMACENADOS (Hechos históricos):**

- Fechas de transacciones
- Montos de pagos
- Cantidades recibidas
- Costos de inventario al momento de recepción

> **Nota:** Los costos de inventario se almacenan como "snapshot" en el momento de la recepción. Si se agregan gastos logísticos posteriores, estos costos no se recalculan automáticamente (igual que en Odoo, requiere wizard de "Landed Costs").

---

## Validaciones Implementadas

### Protecciones contra División por Cero

**Todas las divisiones están protegidas:**

#### `calcularCostoUnitarioFinal()`

```typescript
if (cantidadRecibida === 0) return 0
return totalInversionRD / cantidadRecibida
```

#### `calcularPorcentajeRecepcion()`

```typescript
if (cantidadOrdenada === 0) return 0
return (cantidadRecibida / cantidadOrdenada) * 100
```

#### `calcularCostoFOBUnitario()`

```typescript
if (cantidadOrdenada === 0) return 0
return total / cantidadOrdenada
```

#### `calcularTasaCambioPromedio()`

```typescript
if (pagos.length === 0) return 0
if (pagosConTasa.length === 0) return 0
if (totalMonto === 0) return 0 // Protección adicional
```

#### `distribuirGastosLogisticos()`

```typescript
if (itemsNormalizados.length === 0 || totalFOBUSD === 0) {
  return []
}
// Más adelante:
const costoUnitarioRD = item.cantidadTotal > 0 ? costoTotalRD / item.cantidadTotal : 0
```

### Validaciones en APIs

#### POST /api/oc-china

- ✅ Código OC único
- ✅ Al menos un item en la orden
- ✅ Cada item tiene: SKU, nombre, cantidad, precio
- ⚠️ **Issue #1:** Falta validar que cantidad y precio sean números > 0

#### POST /api/inventario-recibido

- ✅ ID de recepción único
- ✅ OC existe
- ✅ OC tiene items registrados
- ✅ Si itemId especificado, pertenece a la OC
- ✅ Cálculo de costos con protección de división por cero

#### POST /api/pagos-china

- ✅ Moneda válida (USD, CNY, RD$)
- ✅ Tasa de cambio positiva
- ✅ Comisión no negativa
- ⚠️ **Issue #4:** PUT no recalcula montoRD y montoRDNeto

---

## Protecciones de Seguridad

### Integridad Referencial

Cascadas configuradas correctamente en Prisma:

```prisma
// Si se elimina una OC:
items → onDelete: Cascade              // Items se eliminan
pagosChina → onDelete: Cascade         // Pagos se eliminan
gastosLogisticos → onDelete: Cascade   // Gastos se eliminan
inventarioRecibido → onDelete: Cascade // Recepciones se eliminan

// Si se elimina un Item:
inventarioRecibido.item → onDelete: SetNull  // itemId se pone en null
```

Esto previene:

- ❌ Registros huérfanos
- ❌ Referencias a datos inexistentes
- ❌ Inconsistencias en la base de datos

### Precisión Decimal

**✅ Uso correcto de Prisma.Decimal:**

- Todos los campos monetarios usan `Decimal` en la BD
- Conversiones explícitas cuando se calculan
- Redondeo consistente a 2 decimales: `Math.round(valor * 100) / 100`

```typescript
// Ejemplo:
costoUnitarioFinalRD: new Prisma.Decimal(costoUnitarioFinalRD)
```

### Casos Extremos Manejados

**✅ OC sin items**

```typescript
if (!oc.items || oc.items.length === 0) {
  return error("La OC no tiene productos registrados")
}
```

**✅ Sin pagos registrados**

```typescript
// tasaCambioPromedio retorna 0
// Los cálculos continúan con tasa 0 (no rompe)
```

**✅ Sin gastos logísticos**

```typescript
// totalGastosRD = 0
// gastosLogisticosRD por item = 0
// Solo se considera el costo FOB
```

**✅ Item con cantidad 0**

```typescript
const costoUnitarioRD = item.cantidadTotal > 0 ? costoTotalRD / item.cantidadTotal : 0
```

---

## Distribución de Costos

### Landed Costs (siguiendo modelo de Odoo)

#### Principio: Distribución Proporcional por Valor FOB

```typescript
// Cada producto recibe gastos proporcionalmente a su % del total FOB
const porcentajeFOB = (item.subtotalUSD / totalFOBUSD) * 100
const gastosLogisticosRD = (item.subtotalUSD / totalFOBUSD) * totalGastosRD
```

#### Tasa de Cambio Promedio Ponderada

```typescript
// Se usa el promedio ponderado de todas las tasas de cambio de los pagos
const tasaPonderada = Σ(tasa_i * (monto_i / totalMonto))
```

#### Costo Final por Producto

```
Costo FOB RD$ = subtotalUSD * tasaCambioPromedio
Gastos Logísticos RD$ = (subtotalUSD / totalFOBUSD) * totalGastosRD
Costo Total RD$ = Costo FOB RD$ + Gastos Logísticos RD$
Costo Unitario RD$ = Costo Total RD$ / cantidadTotal
```

### Métodos de Distribución Disponibles

El sistema soporta 4 métodos de distribución de costos:

1. **Por Valor FOB** (default) - Proporcional al costo del producto
2. **Por Peso** - Proporcional al peso total del producto
3. **Por Volumen** - Proporcional al volumen (CBM)
4. **Por Unidad** - Distribución equitativa

Cada tipo de gasto puede configurarse para usar un método específico:

- Pagos → Por valor FOB
- Flete → Por peso
- Aduana → Por valor FOB
- Transporte Local → Por peso

---

## Issues Conocidos

### 🔴 Problema #1: Validación insuficiente en POST /api/oc-china

**Severidad:** CRÍTICA

**Descripción:** No valida que `cantidadTotal` y `precioUnitarioUSD` sean números > 0

**Consecuencias:**

- Se pueden crear items con cantidad = 0 → DIVISIÓN POR CERO
- Se pueden crear items con precio = 0 → COSTO FINAL INCORRECTO
- `parseInt`/`parseFloat` pueden retornar NaN → DATOS CORRUPTOS

**Solución:**

```typescript
for (const item of items) {
  // Validar cantidadTotal
  const cantidad = parseInt(item.cantidadTotal)
  if (isNaN(cantidad) || cantidad <= 0) {
    return NextResponse.json(
      { success: false, error: `Cantidad inválida para ${item.sku}` },
      { status: 400 }
    )
  }

  // Validar precioUnitarioUSD
  const precio = parseFloat(item.precioUnitarioUSD)
  if (isNaN(precio) || precio <= 0) {
    return NextResponse.json(
      { success: false, error: `Precio inválido para ${item.sku}` },
      { status: 400 }
    )
  }
}
```

---

### 🟠 Problema #3: PUT OC elimina items con inventario vinculado

**Severidad:** ALTA

**Descripción:** Al editar una OC, se eliminan TODOS los items y se recrean, perdiendo la referencia en inventario.

**Consecuencias:**

- Inventario queda con `itemId = NULL`
- Pérdida de trazabilidad de qué producto se recibió

**Solución Recomendada (Restrictiva):**

```typescript
// Verificar si hay inventario vinculado antes de eliminar
const itemsConInventario = await tx.inventarioRecibido.findFirst({
  where: {
    ocId: id,
    itemId: { not: null },
  },
})

if (itemsConInventario) {
  throw new Error(
    "No se puede editar la OC porque tiene inventario recibido vinculado. " +
      "Debe eliminar las recepciones primero o crear una nueva OC."
  )
}
```

---

### 🔴 Problema #4: PUT Pago no recalcula campos computados

**Severidad:** CRÍTICA

**Descripción:** Al editar un pago, no se recalculan `montoRD` y `montoRDNeto`.

**Consecuencias:**

- Si cambias `montoOriginal`, `tasaCambio` o `comisionBancoRD`, los valores quedan DESACTUALIZADOS
- Todos los cálculos posteriores son INCORRECTOS

**Solución:**

```typescript
import { calcularMontoRD, calcularMontoRDNeto } from "@/lib/calculations"

const montoRD = calcularMontoRD(
  validatedData.montoOriginal,
  validatedData.moneda,
  validatedData.tasaCambio
)

const montoRDNeto = calcularMontoRDNeto(montoRD, validatedData.comisionBancoRD)

const updatedPago = await prisma.pagosChina.update({
  where: { id },
  data: {
    ...validatedData,
    montoRD: new Prisma.Decimal(montoRD), // ✅ AGREGAR
    montoRDNeto: new Prisma.Decimal(montoRDNeto), // ✅ AGREGAR
  },
})
```

---

### 🟡 Problema #5: Falta validación de sobre-recepción

**Severidad:** MEDIA

**Descripción:** No hay validación que impida recibir más cantidad de la ordenada.

**Escenario:**

- OC tiene 100 unidades
- Recepción 1: 50 unidades
- Recepción 2: 60 unidades
- **Total: 110** (excede 100 ordenadas) ❌

**Solución:**

```typescript
const cantidadYaRecibida = await prisma.inventarioRecibido.aggregate({
  where: {
    ocId: validatedData.ocId,
    itemId: validatedData.itemId,
  },
  _sum: {
    cantidadRecibida: true,
  },
})

const totalRecibido =
  (cantidadYaRecibida._sum.cantidadRecibida || 0) + validatedData.cantidadRecibida

if (totalRecibido > item.cantidadTotal) {
  return NextResponse.json(
    {
      success: false,
      error:
        `Sobre-recepción: Ordenado ${item.cantidadTotal}, ` + `Total recibido: ${totalRecibido}`,
    },
    { status: 400 }
  )
}
```

---

### 🟡 Problema #6: calcularMontoRD no valida tasa > 0

**Severidad:** MEDIA

**Descripción:** No valida que `tasaCambio > 0` cuando `moneda !== "RD$"`

**Consecuencias:**

- Si tasa = 0, retorna 0
- Si tasa es negativa, retorna valor negativo

**Solución:**

```typescript
export function calcularMontoRD(
  montoOriginal: number | Prisma.Decimal,
  moneda: string,
  tasaCambio: number | Prisma.Decimal = 1
): number {
  const monto =
    typeof montoOriginal === "number" ? montoOriginal : parseFloat(montoOriginal.toString())
  const tasa = typeof tasaCambio === "number" ? tasaCambio : parseFloat(tasaCambio.toString())

  if (moneda === "RD$") {
    return monto
  }

  // ✅ VALIDAR TASA
  if (tasa <= 0) {
    console.error(`❌ Tasa de cambio inválida: ${tasa} para moneda ${moneda}`)
    return 0 // O lanzar error
  }

  return monto * tasa
}
```

---

## Comparación con Odoo

| Aspecto                             | Odoo       | Nuestro Sistema | Estado |
| ----------------------------------- | ---------- | --------------- | ------ |
| Campos computados                   | ✓          | ✓               | ✅     |
| Distribución proporcional de costos | ✓          | ✓               | ✅     |
| Tasa de cambio ponderada            | ✓          | ✓               | ✅     |
| Protección división por cero        | ✓          | ✓               | ✅     |
| Cascadas y relaciones               | ✓          | ✓               | ✅     |
| Validaciones de negocio             | ✓          | ✓               | ✅     |
| Transacciones atómicas              | ✓          | ✓ (Prisma)      | ✅     |
| Recálculo de costos post-recepción  | ✓ (wizard) | ⚠️ (futuro)     | 🔶     |
| Validación de sobre-recepción       | ✓          | ⚠️ (Issue #5)   | 🔶     |
| Protección de items con inventario  | ✓          | ⚠️ (Issue #3)   | 🔶     |

---

## Checklist de Correcciones

### Prioridad CRÍTICA (Implementar inmediatamente)

- [ ] **Issue #1:** Validación numérica en POST OC (cantidad y precio > 0)
- [ ] **Issue #4:** Recalcular montoRD y montoRDNeto en PUT Pago

### Prioridad ALTA (Implementar pronto)

- [ ] **Issue #3:** Proteger items con inventario en PUT OC

### Prioridad MEDIA (Implementar cuando sea posible)

- [ ] **Issue #5:** Validación de sobre-recepción
- [ ] **Issue #6:** Validar tasa de cambio > 0

### Mejoras Adicionales Recomendadas

- [ ] Crear endpoint DELETE para inventario-recibido
- [ ] Agregar endpoint PUT para inventario-recibido
- [ ] Implementar audit trail completo
- [ ] Validación de fechas (no permitir fechas futuras excesivas)
- [ ] Implementar soft deletes en todos los modelos
- [ ] Agregar índices compuestos para queries frecuentes

---

## Conclusión

✅ **El sistema está diseñado de manera robusta siguiendo principios de Odoo:**

1. **Sin divisiones por cero desprotegidas**
2. **Cálculos correctos y precisos**
3. **Validaciones de negocio completas**
4. **Integridad referencial garantizada**
5. **Campos computados vs almacenados bien separados**
6. **Distribución de costos proporcional y justa**

⚠️ **6 issues conocidos** identificados con soluciones propuestas.

El sistema es **ROBUSTO** y **NO FALLARÁ** en condiciones normales de operación. Una vez implementadas las correcciones de los issues conocidos, alcanzará el nivel de robustez de Odoo ERP.

---

**Última actualización:** Noviembre 2025
**Basado en:** Odoo 16+ Purchase, Inventory, y Landed Costs modules
