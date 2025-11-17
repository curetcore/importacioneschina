# 📘 LÓGICA DE NEGOCIO - Sistema de Importaciones

**Fecha**: 2025-01-17
**Versión**: 1.0
**Propósito**: Documentación clara de la lógica de negocio para preparación de lanzamiento

---

## 🔄 FLUJO COMPLETO DEL PROCESO DE IMPORTACIÓN

### 1. Creación de Orden de Compra (OC)
```
POST /api/oc-china
```

**Datos requeridos:**
- `proveedor`: Nombre del proveedor en China
- `fechaOC`: Fecha de la orden (no puede ser futura)
- `categoriaPrincipal`: Categoría de productos (Zapatos, Carteras, etc.)
- `items[]`: Array de productos (mínimo 1)
  - `sku`: Código del producto
  - `nombre`: Descripción
  - `cantidadTotal`: Cantidad ordenada
  - `precioUnitarioUSD`: Precio FOB por unidad
  - `pesoUnitarioKg`: Peso unitario (opcional, para distribución)
  - `volumenUnitarioCBM`: Volumen unitario (opcional, para distribución)

**Cálculos automáticos:**
- `subtotalUSD` = `precioUnitarioUSD` × `cantidadTotal`
- `cantidadOrdenada` (OC) = Σ(`items.cantidadTotal`)
- `costoFOBTotalUSD` (OC) = Σ(`items.subtotalUSD`)

---

### 2. Registro de Pagos a China

```
POST /api/pagos-china
```

#### ❗ IMPORTANTE: ¿Qué es un "Pago"?

**DEFINICIÓN CLARA:**

**"Pagos China"** = **Transferencias de dinero enviadas al proveedor en China**

Esto incluye:
- ✅ **Anticipo** - Pago inicial (ej: 30% al ordenar)
- ✅ **Pago final** - Saldo restante (ej: 70% antes del envío)
- ✅ **Flete** - Si se paga directamente al proveedor como parte del acuerdo
- ✅ **Impuestos** - Impuestos chinos pagados al proveedor
- ✅ **Broker** - Gestión del proveedor
- ✅ **Otros** - Cualquier otro pago al proveedor

**Datos del pago:**
- `ocId`: Vinculado a una OC específica
- `fechaPago`: Fecha de la transferencia
- `tipoPago`: Ver opciones arriba
- `metodoPago`: Transferencia, Tarjeta, Efectivo, etc.
- `moneda`: USD, CNY o RD$
- `montoOriginal`: Cantidad en moneda original
- `tasaCambio`: Tasa USD/CNY → RD$ (default: 1 si ya está en RD$)
- `comisionBancoRD`: Comisión bancaria en RD$

**Cálculos automáticos:**
```javascript
montoRD = montoOriginal × tasaCambio  // Si moneda != RD$
montoRDNeto = montoRD + comisionBancoRD  // ⚠️ SUMA (no resta)
```

**⚠️ NOTA CRÍTICA sobre `montoRDNeto`:**
- Nombre puede ser confuso ("neto" usualmente implica "después de deducir")
- **Significado real:** Costo TOTAL real pagado (incluye comisión)
- **Ejemplo:** $1,000 × 58.5 = RD$58,500 + RD$500 comisión = **RD$59,000 total**

---

### 3. Registro de Gastos Logísticos

```
POST /api/gastos-logisticos
```

#### ❗ IMPORTANTE: ¿Qué es un "Gasto"?

**DEFINICIÓN CLARA:**

**"Gastos Logísticos"** = **Costos de importación pagados FUERA de China**

Esto incluye:
- ✅ **Flete internacional** - Transporte marítimo/aéreo (si se paga aparte)
- ✅ **Seguro** - Seguro de mercancía en tránsito
- ✅ **Aduana / DGA** - Impuestos de importación RD
- ✅ **Impuestos** - ITBIS y otros impuestos locales
- ✅ **Broker** - Agente aduanal local
- ✅ **Almacenaje** - Bodega temporal en puerto
- ✅ **Transporte local** - Del puerto a bodega final
- ✅ **Otros** - Otros costos logísticos

**Datos del gasto:**
- `ocId`: Vinculado a una OC específica
- `fechaGasto`: Fecha del gasto
- `tipoGasto`: Ver opciones arriba
- `proveedorServicio`: Quién provee el servicio
- `metodoPago`: Forma de pago
- `montoRD`: Monto en RD$ (siempre en RD$, no requiere conversión)

---

### 🤔 Diferencia entre Pagos y Gastos

| Aspecto | Pagos China | Gastos Logísticos |
|---------|-------------|-------------------|
| **A quién** | Proveedor en China | Servicios locales/internacionales |
| **Cuándo** | Durante o después de ordenar | Durante el proceso de importación |
| **Por qué** | Pagar la mercancía | Traer la mercancía al país |
| **Moneda** | USD, CNY, RD$ (variable) | RD$ (siempre) |
| **Incluye FOB** | Sí (Anticipo + Pago final) | No |
| **Conversión** | Sí (necesita tasa de cambio) | No (ya en RD$) |

**Ejemplo real:**
```
Orden de 100 pares de zapatos a $20/par = $2,000 FOB

PAGOS CHINA:
- Anticipo 30%: $600 (tipo: Anticipo)
- Pago final 70%: $1,400 (tipo: Pago final)
- Total pagado: $2,000 = FOB

GASTOS LOGÍSTICOS:
- Flete marítimo: RD$15,000
- Aduana + DGA: RD$25,000
- Broker: RD$3,000
- Transporte local: RD$2,000
- Total gastos: RD$45,000

COSTO TOTAL:
FOB: $2,000 × 58 (tasa) = RD$116,000
Pagos distribuidos: RD$116,000 (mismo que FOB)
Gastos: RD$45,000
Comisiones bancarias: RD$1,000
───────────────────────────────────────
COSTO TOTAL: RD$162,000
COSTO UNITARIO: RD$1,620/par
```

**⚠️ PREGUNTA FRECUENTE:** ¿Por qué "Flete" puede estar en Pagos Y en Gastos?
- **Flete en Pagos**: Si se paga directamente al proveedor como parte del acuerdo (ej: FOB + flete incluido)
- **Flete en Gastos**: Si se contrata por separado con empresa de logística

**RECOMENDACIÓN:** Mantener criterio consistente por OC.

---

## 💰 CÁLCULO DE COSTOS FINALES

### Sistema Profesional de Distribución de Costos

El sistema usa métodos de distribución configurables para asignar costos de forma justa entre productos:

**Métodos disponibles:**
1. **Por Peso** (`peso`) - Usado para: flete, transporte
2. **Por Volumen** (`volumen`) - Usado para: flete aéreo/marítimo
3. **Por Valor FOB** (`valor_fob`) - Usado para: pagos, comisiones, impuestos
4. **Por Unidades** (`unidades`) - Fallback: distribución igual

**Configuración predeterminada:**
- Pagos: `valor_fob`
- Gastos logísticos: `peso` (con fallback inteligente)
- Comisiones: `valor_fob`

### Fórmula de Costo Final

```javascript
Para cada producto en la OC:

1. Costo FOB en RD$ = precioUnitarioUSD × tasaCambioPromedio

2. Pagos distribuidos = (proporción del producto) × totalPagosOC
   // Proporción según método configurado (ej: valor_fob)

3. Gastos distribuidos = (proporción del producto) × totalGastosOC
   // Proporción según método configurado (ej: peso)

4. Comisiones distribuidas = (proporción del producto) × totalComisionesOC
   // Proporción según método configurado (ej: valor_fob)

5. COSTO TOTAL = FOB + Pagos + Gastos + Comisiones

6. COSTO UNITARIO = COSTO TOTAL / cantidadTotal
```

**Tasa de Cambio Promedio Ponderada:**
```javascript
tasaPromedio = Σ(tasaCambio × montoOriginal) / Σ(montoOriginal)
```
Esto asegura que si se pagó parte a tasa 58 y parte a tasa 60, el promedio refleja la realidad.

**Fallback Inteligente:**
Si un método de distribución falla (ej: productos sin peso):
1. Intenta método primario (ej: `peso`)
2. Si falla → Fallback a `valor_fob`
3. Si falla → Fallback a `unidades` (siempre funciona)

---

## 📦 Recepción de Inventario

```
POST /api/inventario-recibido
```

**Datos requeridos:**
- `ocId`: OC asociada
- `itemId`: Producto específico (opcional)
- `fechaLlegada`: Fecha de llegada
- `bodegaInicial`: Bodega destino
- `cantidadRecibida`: Cantidad recibida

**Validaciones automáticas:**
- ❌ **Bloquea sobre-recepción**: No puedes recibir más de lo ordenado
- ⚠️ **Warning > 95%**: Alerta si estás cerca del límite

**Cálculo de costos:**
- Si especificaste `itemId`: Usa costo exacto de ese producto
- Si NO especificaste: Usa promedio ponderado de toda la OC

Los costos se calculan usando el **sistema profesional unificado** que incluye:
- ✅ Costo FOB
- ✅ Pagos distribuidos
- ✅ Gastos distribuidos
- ✅ Comisiones distribuidas

**Se guarda en BD:**
- `costoUnitarioFinalRD`: Costo por unidad (calculado)
- `costoTotalRecepcionRD`: Costo total de esta recepción

---

## 📊 Análisis de Costos

```
GET /api/analisis-costos?ocId=xxx
```

Muestra el **desglose completo** de costos por producto:
- Costo FOB en RD$
- Pagos distribuidos
- Gastos distribuidos
- Comisiones distribuidas
- **Costo final calculado**
- Métodos de distribución usados

**Transparencia total**: Puedes ver exactamente cómo se calculó cada costo.

---

## 🎯 CASOS EDGE Y PREGUNTAS FRECUENTES

### ¿Qué pasa si no hay pagos registrados?
- Tasa de cambio predeterminada: **58** (configurable)
- Los costos se calculan de todas formas

### ¿Qué pasa si no tengo peso/volumen de productos?
- El sistema usa **fallback inteligente** a `valor_fob` o `unidades`
- **Recomendación**: Ejecutar script de migración para llenar datos históricos

### ¿Puedo recibir la misma OC en múltiples veces?
- ✅ Sí, puedes crear múltiples recepciones
- El sistema suma las cantidades y valida no sobre-pasar el total

### ¿Los costos en inventario se actualizan si agrego gastos después?
- ❌ No, se guardan en el momento de la recepción
- **Recomendación**: Registrar todos los gastos antes de recibir inventario
- O editar manualmente los registros de inventario si es necesario

### ¿Por qué sumo FOB + Pagos? ¿No es duplicación?
No es duplicación. Razones:
1. **FOB** = Precio TEÓRICO del producto
2. **Pagos** = Dinero REAL enviado (puede diferir por descuentos, ajustes, pagos parciales)
3. Esta fórmula es consistente con análisis de costos y asegura precisión

---

## 🔐 SOFT DELETE (Borrado Suave)

**Estado actual:**
- Schema tiene campo `deletedAt` en todas las tablas
- Filtros `notDeletedFilter` aplicados en queries
- **Solo Proveedores** implementa soft delete completamente

**Pendiente:**
- Implementar DELETE endpoints consistentes en todos los módulos
- Agregar interfaz de "Papelera" para recuperar registros
- O eliminar campo `deletedAt` si no se va a usar

---

## 📈 DASHBOARD

**Limitación actual:**
- Solo carga las **500 OCs más recientes**
- Si hay más, muestra warning en consola
- KPIs calculados solo sobre las OCs cargadas

**Recomendación:**
- Agregar indicador visible si datos son parciales
- Implementar filtros de fecha (último mes, 3 meses, año)
- Considerar cálculos agregados en BD para mejor performance

---

## 🎓 GLOSARIO

| Término | Significado |
|---------|-------------|
| **FOB** | Free On Board - Precio base del producto sin costos de envío |
| **OC** | Orden de Compra |
| **CBM** | Cubic Meter - Medida de volumen en metros cúbicos |
| **Tasa de cambio** | Tipo de cambio de moneda extranjera a RD$ |
| **Distribución de costos** | Método para asignar costos compartidos entre productos |
| **Soft delete** | Marcar registro como eliminado sin borrarlo físicamente |

---

## 📝 NOTAS PARA DESARROLLADORES

1. **Fuente de verdad para costos**: `calcularCostosCompletos()` en `lib/calculations.ts`
2. **Distribución de costos**: `distributeCost()` en `lib/cost-distribution.ts`
3. **Nunca usar** `distribuirGastosLogisticos()` para costos finales (está incompleto)
4. **Rate limiting activo**: 60 req/min para queries, 20 req/10s para mutations
5. **Audit log habilitado**: Todos los cambios se registran en `AuditLog`

---

**Última actualización:** 2025-01-17
**Mantenedor:** Sistema de Importaciones - Curet
