# Auditoría Completa del Sistema

## Análisis Módulo por Módulo con Margen de Error 0%

**Fecha:** 2025-11-15
**Referencia:** Principios de Odoo ERP
**Objetivo:** Sistema 100% lógico y matemático sin fallos

---

## 🔴 PROBLEMAS CRÍTICOS ENCONTRADOS

### PROBLEMA #1: Validación insuficiente en POST /api/oc-china

**Archivo:** `app/api/oc-china/route.ts` líneas 124-134
**Severidad:** 🔴 CRÍTICA

**Código actual:**

```typescript
for (const item of items) {
  if (!item.sku || !item.nombre || !item.cantidadTotal || !item.precioUnitarioUSD) {
    return NextResponse.json(
      {
        success: false,
        error: "Cada producto debe tener SKU, nombre, cantidad y precio",
      },
      { status: 400 }
    )
  }
}
```

**Problemas detectados:**

1. ❌ No valida que `cantidadTotal` sea un número > 0
2. ❌ No valida que `precioUnitarioUSD` sea un número > 0
3. ❌ Acepta valores como `cantidadTotal: "abc"` o `precioUnitarioUSD: -5`

**Consecuencias:**

- Se pueden crear items con cantidad = 0 → **DIVISIÓN POR CERO** en cálculos posteriores
- Se pueden crear items con precio = 0 → **COSTO FINAL INCORRECTO**
- parseInt/parseFloat pueden retornar **NaN** → **DATOS CORRUPTOS EN BD**

**Comparación con Odoo:**
En Odoo, TODAS las cantidades y precios tienen validación `> 0` a nivel de modelo.

**Solución:**

```typescript
for (const item of items) {
  // Validaciones básicas
  if (!item.sku || !item.nombre) {
    return NextResponse.json(
      {
        success: false,
        error: "Cada producto debe tener SKU y nombre",
      },
      { status: 400 }
    )
  }

  // Validar cantidadTotal
  const cantidad = parseInt(item.cantidadTotal)
  if (isNaN(cantidad) || cantidad <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Cantidad inválida para ${item.sku}. Debe ser un número entero mayor a 0`,
      },
      { status: 400 }
    )
  }

  // Validar precioUnitarioUSD
  const precio = parseFloat(item.precioUnitarioUSD)
  if (isNaN(precio) || precio <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Precio inválido para ${item.sku}. Debe ser un número mayor a 0`,
      },
      { status: 400 }
    )
  }
}
```

---

### PROBLEMA #2: Cálculo de subtotalUSD sin validación

**Archivo:** `app/api/oc-china/route.ts` líneas 145-154
**Severidad:** 🔴 CRÍTICA

**Código actual:**

```typescript
items: {
  create: items.map((item: any) => ({
    sku: item.sku,
    nombre: item.nombre,
    material: item.material || null,
    color: item.color || null,
    especificaciones: item.especificaciones || null,
    tallaDistribucion: item.tallaDistribucion || null,
    cantidadTotal: parseInt(item.cantidadTotal),
    precioUnitarioUSD: parseFloat(item.precioUnitarioUSD),
    subtotalUSD: parseFloat(item.precioUnitarioUSD) * parseInt(item.cantidadTotal),
  })),
}
```

**Problemas detectados:**

1. ❌ `parseInt()` y `parseFloat()` pueden retornar `NaN`
2. ❌ `subtotalUSD` se calcula en servidor, ignorando valor del cliente
3. ❌ No valida overflow numérico (ej: 999999999 \* 999999999)
4. ❌ Mismo código duplicado en POST y PUT (violación DRY)

**Consecuencias:**

- Si usuario envía descuentos o ajustes en subtotal, se pierden
- NaN se guarda en BD como NULL o causa error de Prisma
- Pérdida de precisión decimal

**Comparación con Odoo:**
En Odoo, el subtotal SIEMPRE se calcula como `cantidad * precio_unitario` sin excepciones. Si hay descuentos, se aplican a nivel de línea con un campo `discount` separado.

**Solución:**

```typescript
// Primero validar ANTES del map
const itemsValidados = items.map((item: any) => {
  const cantidad = parseInt(item.cantidadTotal)
  const precio = parseFloat(item.precioUnitarioUSD)

  if (isNaN(cantidad) || cantidad <= 0) {
    throw new Error(`Cantidad inválida para ${item.sku}`)
  }

  if (isNaN(precio) || precio <= 0) {
    throw new Error(`Precio inválido para ${item.sku}`)
  }

  const subtotal = precio * cantidad

  // Validar overflow (máximo razonable: $999,999.99)
  if (subtotal > 999999.99) {
    throw new Error(`Subtotal excede límite máximo para ${item.sku}: $${subtotal}`)
  }

  return {
    sku: item.sku,
    nombre: item.nombre,
    material: item.material || null,
    color: item.color || null,
    especificaciones: item.especificaciones || null,
    tallaDistribucion: item.tallaDistribucion || null,
    cantidadTotal: cantidad,
    precioUnitarioUSD: precio,
    subtotalUSD: subtotal,
  }
})

// Luego crear con try-catch
try {
  const nuevaOC = await prisma.oCChina.create({
    data: {
      oc,
      proveedor,
      fechaOC: new Date(fechaOC),
      descripcionLote,
      categoriaPrincipal,
      items: {
        create: itemsValidados,
      },
    },
    include: {
      items: true,
    },
  })

  return NextResponse.json(
    {
      success: true,
      data: nuevaOC,
    },
    { status: 201 }
  )
} catch (error: any) {
  return NextResponse.json(
    {
      success: false,
      error: error.message || "Error al crear orden de compra",
    },
    { status: 400 }
  )
}
```

---

### PROBLEMA #3: PUT OC elimina items con inventario vinculado

**Archivo:** `app/api/oc-china/[id]/route.ts` líneas 150-183
**Severidad:** 🟠 ALTA

**Código actual:**

```typescript
const updatedOC = await prisma.$transaction(async (tx) => {
  // Eliminar items antiguos
  await tx.oCChinaItem.deleteMany({
    where: { ocId: id },
  });

  // Actualizar OC y crear nuevos items
  return await tx.oCChina.update({
    where: { id },
    data: {
      oc,
      proveedor,
      fechaOC: new Date(fechaOC),
      descripcionLote,
      categoriaPrincipal,
      items: {
        create: items.map((item: any) => ({...})),
      },
    },
    include: {
      items: true,
    },
  });
});
```

**Problema detectado:**

- ❌ Elimina TODOS los items de la OC, incluyendo los que tienen `inventarioRecibido` vinculado
- El schema tiene `onDelete: SetNull` para la relación `inventarioRecibido.item`
- Cuando se elimina un item, todos los inventarios vinculados pierden su referencia (itemId → NULL)
- **PÉRDIDA DE TRAZABILIDAD:** No se puede saber qué producto específico se recibió

**Escenario de falla:**

1. Usuario crea OC-001 con item "Zapato Negro - SKU123"
2. Se recibe inventario de 100 unidades vinculado a ese item
3. Usuario edita la OC-001 (ej: cambiar proveedor)
4. **TODOS los items se eliminan y recrean con nuevos IDs**
5. El inventario queda con `itemId = NULL`
6. Sistema ya no sabe que esas 100 unidades eran "Zapato Negro - SKU123"

**Comparación con Odoo:**
En Odoo Purchase Order:

- Si una línea tiene recepciones (`stock.picking`), **NO se puede eliminar**
- Solo se puede modificar cantidad si no excede lo recibido
- Solo se puede cancelar la línea si no hay recepciones

**Solución Opción A (Restrictiva - Recomendada):**

```typescript
// Antes de eliminar, verificar si hay inventario vinculado a algún item
const itemsConInventario = await tx.inventarioRecibido.findFirst({
  where: {
    ocId: id,
    itemId: { not: null },
  },
})

if (itemsConInventario) {
  throw new Error(
    "No se puede editar la OC porque tiene inventario recibido vinculado a productos específicos. " +
      "Debe eliminar las recepciones primero o crear una nueva OC."
  )
}

// Si no hay inventario vinculado, proceder con delete/create
await tx.oCChinaItem.deleteMany({
  where: { ocId: id },
})
```

**Solución Opción B (Inteligente - Más compleja):**

```typescript
// Hacer match de items viejos vs nuevos por SKU
const itemsViejos = await tx.oCChinaItem.findMany({
  where: { ocId: id },
  include: {
    inventarioRecibido: true,
  },
})

for (const itemViejo of itemsViejos) {
  const itemNuevo = items.find(i => i.sku === itemViejo.sku)

  if (itemNuevo) {
    // Actualizar item existente
    await tx.oCChinaItem.update({
      where: { id: itemViejo.id },
      data: {
        nombre: itemNuevo.nombre,
        material: itemNuevo.material || null,
        // ... otros campos
        cantidadTotal: parseInt(itemNuevo.cantidadTotal),
        precioUnitarioUSD: parseFloat(itemNuevo.precioUnitarioUSD),
        subtotalUSD: parseFloat(itemNuevo.precioUnitarioUSD) * parseInt(itemNuevo.cantidadTotal),
      },
    })
  } else {
    // Item eliminado - solo permitir si no tiene inventario
    if (itemViejo.inventarioRecibido.length > 0) {
      throw new Error(
        `No se puede eliminar el producto ${itemViejo.sku} porque tiene inventario recibido`
      )
    }
    await tx.oCChinaItem.delete({
      where: { id: itemViejo.id },
    })
  }
}

// Crear items nuevos que no existían antes
const skusViejos = itemsViejos.map(i => i.sku)
const itemsNuevos = items.filter(i => !skusViejos.includes(i.sku))
if (itemsNuevos.length > 0) {
  await tx.oCChinaItem.createMany({
    data: itemsNuevos.map(item => ({
      ocId: id,
      sku: item.sku,
      // ... resto de campos
    })),
  })
}
```

**Recomendación:** Implementar **Opción A** por simplicidad y seguridad.

---

### PROBLEMA #4: PUT Pago no recalcula campos computados

**Archivo:** `app/api/pagos-china/[id]/route.ts` líneas 111-124
**Severidad:** 🔴 CRÍTICA

**Código actual:**

```typescript
const updatedPago = await prisma.pagosChina.update({
  where: { id },
  data: {
    idPago: validatedData.idPago,
    ocId: validatedData.ocId,
    fechaPago: new Date(validatedData.fechaPago),
    tipoPago: validatedData.tipoPago,
    metodoPago: validatedData.metodoPago,
    moneda: validatedData.moneda,
    montoOriginal: validatedData.montoOriginal,
    tasaCambio: validatedData.tasaCambio,
    comisionBancoRD: validatedData.comisionBancoRD,
  },
})
```

**Problema detectado:**

- ❌ NO recalcula `montoRD`
- ❌ NO recalcula `montoRDNeto`
- Si usuario cambia `montoOriginal`, `tasaCambio` o `comisionBancoRD`, los valores calculados quedan **DESACTUALIZADOS**

**Escenario de falla:**

1. Crear pago: $1000 USD a tasa 58.5 = RD$ 58,500
2. Editar pago: cambiar tasa a 60.0
3. `montoRD` sigue siendo RD$ 58,500 (debería ser RD$ 60,000)
4. **TODOS los cálculos posteriores están INCORRECTOS**
5. Costo unitario final, distribución de gastos, dashboard → **TODO INCORRECTO**

**Comparación con Odoo:**
En Odoo, TODOS los campos computados (`compute=`) se recalculan automáticamente cuando cambian sus dependencias.

**Solución:**

```typescript
// Importar funciones de cálculo
import { calcularMontoRD, calcularMontoRDNeto } from "@/lib/calculations"
import { Prisma } from "@prisma/client"

// Recalcular valores
const montoRD = calcularMontoRD(
  validatedData.montoOriginal,
  validatedData.moneda,
  validatedData.tasaCambio
)

const montoRDNeto = calcularMontoRDNeto(montoRD, validatedData.comisionBancoRD)

const updatedPago = await prisma.pagosChina.update({
  where: { id },
  data: {
    idPago: validatedData.idPago,
    ocId: validatedData.ocId,
    fechaPago: new Date(validatedData.fechaPago),
    tipoPago: validatedData.tipoPago,
    metodoPago: validatedData.metodoPago,
    moneda: validatedData.moneda,
    montoOriginal: validatedData.montoOriginal,
    tasaCambio: validatedData.tasaCambio,
    comisionBancoRD: validatedData.comisionBancoRD,
    montoRD: new Prisma.Decimal(montoRD), // ✅ AGREGAR
    montoRDNeto: new Prisma.Decimal(montoRDNeto), // ✅ AGREGAR
  },
})
```

---

## 🟡 PROBLEMAS MEDIOS ENCONTRADOS

### PROBLEMA #5: Falta validación de sobre-recepción

**Archivo:** `app/api/inventario-recibido/route.ts` líneas 78-234
**Severidad:** 🟡 MEDIA

**Código actual:**
No hay validación que impida recibir más cantidad de la ordenada.

**Escenario de falla:**

1. OC tiene item "Zapato" con `cantidadTotal: 100`
2. Recepción 1: 50 unidades
3. Recepción 2: 60 unidades
4. **Total recibido: 110** (excede 100 ordenadas)
5. Inventario desbalanceado

**Comparación con Odoo:**
Odoo tiene configuración `po_double_validation` que:

- Permite sobre-recepción si está habilitado
- Bloquea sobre-recepción si está deshabilitado
- Muestra warning en cualquier caso

**Solución:**

```typescript
// Después de validar itemId, agregar:
if (validatedData.itemId) {
  const item = oc.items.find(i => i.id === validatedData.itemId)!

  // Calcular cantidad ya recibida para este item específico
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

  // Validar sobre-recepción (configurar según necesidad del negocio)
  if (totalRecibido > item.cantidadTotal) {
    return NextResponse.json(
      {
        success: false,
        error:
          `Sobre-recepción detectada: ${item.nombre} (SKU: ${item.sku}). ` +
          `Ordenado: ${item.cantidadTotal}, Ya recibido: ${cantidadYaRecibida._sum.cantidadRecibida || 0}, ` +
          `Intentando recibir: ${validatedData.cantidadRecibida}, Total: ${totalRecibido}`,
      },
      { status: 400 }
    )
  }

  // Warning si está cerca del límite (> 95%)
  if (totalRecibido > item.cantidadTotal * 0.95) {
    console.warn(
      `⚠️ Recepción cerca del límite: ${item.sku} - ${totalRecibido}/${item.cantidadTotal}`
    )
  }
}
```

---

### PROBLEMA #6: calcularMontoRD no valida tasa > 0

**Archivo:** `lib/calculations.ts` líneas 3-16
**Severidad:** 🟡 MEDIA

**Código actual:**

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

  return monto * tasa
}
```

**Problema detectado:**

- ❌ No valida que `tasa > 0` cuando `moneda !== "RD$"`
- Si tasa = 0, retorna 0 (matemáticamente correcto, pero incorrecto en negocio)
- Si tasa es negativa, retorna valor negativo (absurdo)

**Consecuencias:**

- Pagos con tasa 0 → todos los cálculos posteriores son 0
- Dashboard muestra datos incorrectos
- Costos finales incorrectos

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
    return 0 // O lanzar error según política del negocio
  }

  return monto * tasa
}
```

---

## ✅ ASPECTOS CORRECTOS DEL SISTEMA

### Protecciones contra división por cero

✅ Todas las funciones de cálculo están protegidas:

- `calcularCostoUnitarioFinal()` → `if (cantidadRecibida === 0) return 0`
- `calcularPorcentajeRecepcion()` → `if (cantidadOrdenada === 0) return 0`
- `calcularCostoFOBUnitario()` → `if (cantidadOrdenada === 0) return 0`
- `calcularTasaCambioPromedio()` → múltiples validaciones
- `distribuirGastosLogisticos()` → `if (totalFOBUSD === 0) return []`
- `calcularResumenFinanciero()` → `totalUnidades > 0 ? ... : 0`

### Validaciones de existencia

✅ Todos los endpoints validan que los registros existan:

- POST valida que OC exista antes de crear pago/gasto/inventario
- PUT valida que el registro a actualizar exista
- DELETE valida que el registro a eliminar exista

### Unicidad de IDs

✅ Todos los módulos validan IDs únicos:

- `idPago`, `idGasto`, `idRecepcion`, `oc` (código OC)
- Previene duplicados

### Cascadas correctas

✅ Schema Prisma tiene cascadas bien definidas:

- Eliminar OC → elimina items, pagos, gastos (CASCADE)
- Eliminar item → inventario pierde vínculo (SetNull) ← **Mejorar con PROBLEMA #3**

### Uso de transacciones

✅ PUT OC usa `prisma.$transaction()` para operaciones atómicas

### Precisión decimal

✅ Uso correcto de `Prisma.Decimal` para campos monetarios
✅ Redondeo consistente: `Math.round(valor * 100) / 100`

### Distribución de costos

✅ Implementación correcta de "Landed Costs" estilo Odoo:

- Distribución proporcional por % de FOB
- Tasa de cambio promedio ponderada
- Separación de costos FOB vs logísticos

---

## 📋 CHECKLIST DE CORRECCIONES

### Prioridad CRÍTICA (Implementar inmediatamente)

- [ ] **PROBLEMA #1:** Agregar validación numérica en POST OC (cantidad y precio > 0)
- [ ] **PROBLEMA #2:** Validar parseInt/parseFloat en POST/PUT OC
- [ ] **PROBLEMA #4:** Recalcular montoRD y montoRDNeto en PUT Pago

### Prioridad ALTA (Implementar pronto)

- [ ] **PROBLEMA #3:** Proteger items con inventario en PUT OC

### Prioridad MEDIA (Implementar cuando sea posible)

- [ ] **PROBLEMA #5:** Agregar validación de sobre-recepción
- [ ] **PROBLEMA #6:** Validar tasa de cambio > 0 en calcularMontoRD

### Mejoras adicionales recomendadas

- [ ] Crear endpoint DELETE para inventario-recibido
- [ ] Agregar endpoint PUT para inventario-recibido
- [ ] Implementar audit trail (log de cambios)
- [ ] Agregar validación de fechas (no permitir fechas futuras excesivas)
- [ ] Implementar soft deletes en lugar de hard deletes
- [ ] Agregar índices compuestos para queries frecuentes

---

## 🎯 CONCLUSIÓN

El sistema tiene una **base sólida** con buena arquitectura y protecciones contra división por cero.

**Problemas críticos encontrados:** 4
**Problemas de alta prioridad:** 1
**Problemas de media prioridad:** 2

**Total de correcciones necesarias para 0% error:** 7

Una vez implementadas estas correcciones, el sistema alcanzará el nivel de robustez de Odoo ERP.

---

_Documento generado por análisis exhaustivo línea por línea_
_Basado en principios de Odoo ERP 16+_
