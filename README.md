# 🚢 Sistema de Gestión de Importaciones desde China

> **Sistema completo y robusto** para gestionar importaciones desde China con control financiero automático, distribución de costos tipo ERP, y cálculos precisos siguiendo principios de Odoo.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-brightgreen)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue)](https://www.postgresql.org/)

**📚 Versión 2.0 - Sistema Multi-Producto con Distribución de Costos**

[Características](#-características-principales) • [Arquitectura](#-arquitectura) • [Instalación](#-instalación) • [Modelo de Datos](#️-modelo-de-datos) • [Cálculos](#-cálculos-y-distribución-de-costos) • [Documentación](#-documentación-técnica)

---

## 📋 Tabla de Contenidos

1. [Características Principales](#-características-principales)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [Modelo de Datos](#️-modelo-de-datos)
4. [Instalación y Configuración](#-instalación)
5. [Cálculos y Distribución de Costos](#-cálculos-y-distribución-de-costos)
6. [Uso del Sistema](#-uso-del-sistema)
7. [Documentación Técnica](#-documentación-técnica)
8. [API Endpoints](#-api-endpoints)
9. [Deployment](#-deployment)
10. [Robustez y Principios de Diseño](#-robustez-y-principios-de-diseño)

---

## ✨ Características Principales

### 🎯 Sistema Multi-Producto (Nuevo en v2.0)

<table>
<tr>
<td width="50%">

#### 📦 Órdenes con Múltiples Productos
- ✅ Cada OC puede tener **múltiples items/productos**
- ✅ Tracking individual por SKU, nombre, material, color
- ✅ Distribución de tallas opcional (JSON)
- ✅ Cálculos automáticos de totales

</td>
<td width="50%">

#### 💰 Distribución de Costos Tipo ERP
- ✅ **Landed Costs** inspirados en Odoo
- ✅ Gastos distribuidos proporcionalmente por % FOB
- ✅ Tasa de cambio promedio ponderada
- ✅ Costos precisos por producto

</td>
</tr>
<tr>
<td>

#### 📊 Dashboard Financiero
- ✅ KPIs en tiempo real
- ✅ Gráficos interactivos
- ✅ Métricas por proveedor
- ✅ Análisis de gastos

</td>
<td>

#### 🔍 Trazabilidad Completa
- ✅ Vinculación inventario-producto
- ✅ Historial de transacciones
- ✅ Control de recepciones
- ✅ Reportes detallados

</td>
</tr>
</table>

### 🛡️ Robustez y Confiabilidad

- ✅ **Sin divisiones por cero** - Todas las operaciones matemáticas protegidas
- ✅ **Validaciones completas** - Datos validados antes de procesar
- ✅ **Integridad referencial** - Cascadas y relaciones correctas
- ✅ **Campos computados** - Valores calculados dinámicamente
- ✅ **Precisión decimal** - Manejo correcto de Prisma.Decimal

> 📖 **Ver [ROBUSTEZ_SISTEMA.md](./ROBUSTEZ_SISTEMA.md)** para análisis completo de diseño

---

## 🏗 Arquitectura del Sistema

### Stack Tecnológico

```
┌─────────────────────────────────────┐
│          Frontend (Next.js 14)      │
│  React + TypeScript + Tailwind CSS  │
├─────────────────────────────────────┤
│        API Routes (Next.js)         │
│     Validaciones con Zod            │
├─────────────────────────────────────┤
│         ORM (Prisma 6.19)           │
│   Cálculos en lib/calculations.ts   │
├─────────────────────────────────────┤
│      Base de Datos (PostgreSQL)     │
│    5 tablas principales + JSON      │
└─────────────────────────────────────┘
```

### Estructura de Directorios

```
importacioneschina/
├── 📂 app/
│   ├── 📂 (pages)/              # Páginas del sistema
│   │   ├── dashboard/           # Dashboard con KPIs
│   │   ├── ordenes/             # Lista y detalle de OCs
│   │   ├── gastos/              # Gastos logísticos
│   │   └── inventario/          # Inventario recibido
│   ├── 📂 api/                  # API Routes
│   │   ├── oc-china/            # CRUD órdenes
│   │   ├── pagos-china/         # CRUD pagos
│   │   ├── gastos-logisticos/   # CRUD gastos
│   │   ├── inventario-recibido/ # CRUD inventario
│   │   └── dashboard/           # Datos dashboard
│   └── layout.tsx
├── 📂 components/
│   ├── forms/                   # Formularios complejos
│   │   ├── OCChinaForm.tsx     # ⭐ Formulario multi-producto
│   │   ├── InventarioRecibidoForm.tsx # Con cálculo de costos
│   │   └── ...
│   └── ui/                      # Componentes base
├── 📂 lib/
│   ├── calculations.ts          # ⭐⭐⭐ LÓGICA DE CÁLCULOS
│   ├── validations.ts           # Schemas Zod
│   └── prisma.ts                # Cliente Prisma
├── 📂 prisma/
│   ├── schema.prisma            # ⭐ Modelo de datos
│   ├── seed.ts                  # Datos de prueba multi-producto
│   └── migrations/              # Migraciones
├── 📄 ROBUSTEZ_SISTEMA.md       # ⭐ Análisis de robustez
├── 📄 README.md                 # Este archivo
└── 📄 Dockerfile                # Deploy automático
```

---

## 🗄️ Modelo de Datos

### Diagrama de Relaciones (v2.0)

```
┌──────────────┐
│   OCChina    │ Orden de Compra
│              │
│ - id         │
│ - oc         │ (código único)
│ - proveedor  │
│ - fechaOC    │
│ - categoria  │
└──┬───────────┘
   │
   ├──1:N──┐
   │       ▼
   │   ┌───────────────────┐
   │   │  OCChinaItem      │ Productos en la OC (NUEVO v2.0)
   │   │                   │
   │   │ - id              │
   │   │ - ocId (FK)       │
   │   │ - sku             │
   │   │ - nombre          │
   │   │ - material        │
   │   │ - color           │
   │   │ - especificaciones│
   │   │ - tallaDistribucion (JSON)
   │   │ - cantidadTotal   │
   │   │ - precioUnitarioUSD
   │   │ - subtotalUSD     │
   │   └───────┬───────────┘
   │           │
   │           │ N:1 (opcional)
   │           │
   ├──1:N──┐   │
   │       ▼   │
   │   ┌───────┴──────────────┐
   │   │ InventarioRecibido   │
   │   │                      │
   │   │ - id                 │
   │   │ - ocId (FK)          │
   │   │ - itemId (FK)        │ ⭐ NUEVO: vincular a producto
   │   │ - fechaLlegada       │
   │   │ - bodegaInicial      │
   │   │ - cantidadRecibida   │
   │   │ - costoUnitarioFinalRD  (calculado con distribución)
   │   │ - costoTotalRecepcionRD
   │   └──────────────────────┘
   │
   ├──1:N──┐
   │       ▼
   │   ┌──────────────────┐
   │   │  PagosChina      │
   │   │                  │
   │   │ - moneda         │ (USD, CNY, RD$)
   │   │ - montoOriginal  │
   │   │ - tasaCambio     │
   │   │ - comisionBancoRD│
   │   │ - montoRDNeto    │
   │   └──────────────────┘
   │
   └──1:N──┐
           ▼
       ┌──────────────────────┐
       │ GastosLogisticos     │
       │                      │
       │ - tipoGasto          │
       │ - montoRD            │
       │ - fechaGasto         │
       └──────────────────────┘
```

### Cambios Clave en v2.0

#### ✅ Agregado: `OCChinaItem` (Tabla de Productos)
- Cada OC ahora puede tener múltiples productos
- Tracking completo por SKU
- Distribución de tallas en JSON

#### ❌ Removido de `OCChina`:
- `cantidadOrdenada` → Ahora se calcula desde items
- `costoFOBTotalUSD` → Ahora se calcula desde items

#### ✅ Agregado a `InventarioRecibido`:
- `itemId` → Vincula recepción a producto específico
- Costos calculados con distribución de gastos

---

## 🚀 Instalación

### Prerrequisitos
- Node.js 20+
- PostgreSQL 14+
- npm o yarn

### Pasos de Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd importacioneschina

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL

# 4. Generar cliente Prisma
npx prisma generate

# 5. Aplicar migraciones
npx prisma migrate deploy

# 6. (Opcional) Cargar datos de prueba
npx prisma db seed

# 7. Ejecutar en desarrollo
npm run dev
```

Abrir http://localhost:3000

---

## 🧮 Cálculos y Distribución de Costos

### Principio: Landed Costs (Inspirado en Odoo)

El sistema distribuye los gastos logísticos **proporcionalmente** entre todos los productos de una OC según su porcentaje del FOB total.

### Fórmulas de Cálculo

#### 1. Tasa de Cambio Promedio Ponderada

```typescript
tasaCambioPromedio = Σ(tasa_i × monto_i) / Σ(monto_i)
```

**Ejemplo**:
- Pago 1: $1,000 USD × 58.5 = RD$ 58,500
- Pago 2: ¥7,300 CNY × 8.2 = RD$ 59,860

```
tasaPromedio = (58.5 × 1000 + 8.2 × 1000) / (1000 + 1000) = 59.18 RD$/USD
```

#### 2. Distribución de Gastos por Producto

```typescript
// Para cada producto:
porcentajeFOB = (subtotalUSD_producto / totalFOBUSD_orden) × 100

gastosDistribuidos = (subtotalUSD_producto / totalFOBUSD_orden) × totalGastosRD

costoFOBRD = subtotalUSD × tasaCambioPromedio

costoTotalRD = costoFOBRD + gastosDistribuidos

costoUnitarioRD = costoTotalRD / cantidadTotal
```

### Ejemplo Completo

**OC-2025-001** con 3 productos:

| Producto | Cantidad | Precio USD | Subtotal USD | % FOB |
|----------|----------|------------|--------------|-------|
| Zapatos A | 100 | $10 | $1,000 | 40% |
| Zapatos B | 50 | $20 | $1,000 | 40% |
| Carteras C | 20 | $25 | $500 | 20% |
| **TOTAL** | **170** | - | **$2,500** | **100%** |

**Pagos**: RD$ 147,950 (tasa promedio: 59.18)

**Gastos Logísticos**:
- Flete: RD$ 10,000
- Aduana: RD$ 5,000
- Broker: RD$ 2,000
- **Total**: RD$ 17,000

**Distribución de Costos**:

**Zapatos A** (40% FOB):
- FOB RD$ = $1,000 × 59.18 = RD$ 59,180
- Gastos = 40% × RD$ 17,000 = RD$ 6,800
- **Total** = RD$ 65,980
- **Unitario** = RD$ 659.80 por par

**Zapatos B** (40% FOB):
- FOB RD$ = $1,000 × 59.18 = RD$ 59,180
- Gastos = 40% × RD$ 17,000 = RD$ 6,800
- **Total** = RD$ 65,980
- **Unitario** = RD$ 1,319.60 por par

**Carteras C** (20% FOB):
- FOB RD$ = $500 × 59.18 = RD$ 29,590
- Gastos = 20% × RD$ 17,000 = RD$ 3,400
- **Total** = RD$ 32,990
- **Unitario** = RD$ 1,649.50 por unidad

### Código de Implementación

Ver `lib/calculations.ts`:

```typescript
export function distribuirGastosLogisticos(
  items: OCChinaItem[],
  gastosLogisticos: GastoLogistico[],
  pagosChina: PagoChina[]
): ItemConCostos[]
```

Esta función es el corazón del sistema de costos.

---

## 📖 Uso del Sistema

### 1. Crear Orden de Compra con Productos

```
Órdenes → Nueva Orden
├── Datos básicos (OC, Proveedor, Fecha, Categoría)
└── Productos (múltiples)
    ├── SKU: ZAP-001
    ├── Nombre: Zapatos Deportivos
    ├── Material: Cuero sintético
    ├── Color: Negro
    ├── Tallas: {"38": 10, "39": 20, "40": 10}
    ├── Cantidad: 40 unidades
    └── Precio: $15.00 USD
```

### 2. Registrar Pagos

```
Seleccionar OC → Nuevo Pago
├── Moneda: USD
├── Monto: $1,000
├── Tasa: 58.5 RD$/USD
└── Comisión: RD$ 500
    → Sistema calcula: RD$ 58,500 (neto: RD$ 59,000)
```

### 3. Registrar Gastos Logísticos

```
Seleccionar OC → Nuevo Gasto
├── Tipo: Flete internacional
├── Monto: RD$ 10,000
└── Fecha: 2025-01-20
    → Sistema distribuye entre todos los productos automáticamente
```

### 4. Recibir Inventario (Vinculado a Producto)

```
Inventario → Nueva Recepción
├── Seleccionar OC
├── **Seleccionar Producto Específico** ⭐
├── Cantidad recibida: 35 unidades
└── Bodega: Piantini
    → Sistema calcula costo exacto del producto con gastos distribuidos
    → Muestra: FOB RD$, Gastos RD$, Costo Unitario RD$
```

---

## 📚 Documentación Técnica

### Archivos Clave para Futuras Sesiones

| Archivo | Propósito | Importancia |
|---------|-----------|-------------|
| `lib/calculations.ts` | ⭐⭐⭐ **Toda la lógica de cálculos** | CRÍTICO - Leer primero |
| `prisma/schema.prisma` | ⭐⭐⭐ **Modelo de datos completo** | CRÍTICO - Estructura BD |
| `ROBUSTEZ_SISTEMA.md` | ⭐⭐ **Principios de diseño y robustez** | MUY IMPORTANTE |
| `README.md` | ⭐⭐ **Este archivo - visión general** | MUY IMPORTANTE |
| `components/forms/OCChinaForm.tsx` | ⭐ Formulario multi-producto | Importante |
| `components/forms/InventarioRecibidoForm.tsx` | ⭐ Formulario con cálculo de costos | Importante |
| `app/api/*/route.ts` | APIs para cada módulo | Importante |

### Funciones de Cálculo Principales

```typescript
// lib/calculations.ts

// 1. Tasa de cambio promedio ponderada
calcularTasaCambioPromedio(pagos: PagoChina[]): number

// 2. ⭐ Distribución de gastos (función principal)
distribuirGastosLogisticos(
  items: OCChinaItem[],
  gastosLogisticos: GastoLogistico[],
  pagosChina: PagoChina[]
): ItemConCostos[]

// 3. Resumen financiero de una orden
calcularResumenFinanciero(
  items: OCChinaItem[],
  pagosChina: PagoChina[],
  gastosLogisticos: GastoLogistico[]
)

// 4. Protecciones contra división por cero
calcularCostoUnitarioFinal(totalInversionRD: number, cantidadRecibida: number): number
calcularPorcentajeRecepcion(cantidadRecibida: number, cantidadOrdenada: number): number
// ... y más
```

---

## 🔌 API Endpoints

### Órdenes de Compra

```http
GET    /api/oc-china              # Lista OCs (incluye items)
POST   /api/oc-china              # Crear OC con items
GET    /api/oc-china/:id          # Obtener OC con items, pagos, gastos
PUT    /api/oc-china/:id          # Actualizar OC y sus items
DELETE /api/oc-china/:id          # Eliminar OC (cascade: items, pagos, gastos)
```

### Inventario Recibido

```http
POST   /api/inventario-recibido   # Crear recepción
                                   # Body: { ocId, itemId, cantidadRecibida, ... }
                                   # → Calcula costos con distribuirGastosLogisticos()
```

Ver código de APIs para detalles de implementación.

---

## 🐳 Deployment

### Easypanel (Automático)

El repositorio incluye:
- `Dockerfile` multi-stage optimizado
- `start.sh` que aplica migraciones automáticamente
- Deploy automático en cada push a la rama principal

**Configuración en Easypanel**:
```env
DATABASE_URL=postgresql://user:pass@postgres:5432/db
NEXT_PUBLIC_API_URL=https://tu-dominio.com
NODE_ENV=production
```

### Deployment Manual

```bash
# Build
docker build -t importaciones .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  importaciones
```

---

## 🛡️ Robustez y Principios de Diseño

### Diseño Siguiendo Odoo ERP

El sistema fue diseñado siguiendo los principios del ERP Odoo:

1. **Campos Computados vs Almacenados**
   - ✅ `cantidadOrdenada`, `costoFOBTotalUSD` → Computados dinámicamente
   - ✅ Pagos, gastos, fechas → Almacenados como hechos históricos

2. **Landed Costs (Distribución de Gastos)**
   - ✅ Gastos distribuidos proporcionalmente por % FOB
   - ✅ Similar al módulo de Odoo Purchase/Stock

3. **Protecciones Matemáticas**
   - ✅ TODAS las divisiones protegidas contra cero
   - ✅ Validaciones completas de negocio
   - ✅ Manejo correcto de tipos Decimal

4. **Integridad Referencial**
   - ✅ Cascadas correctas (Items, Pagos, Gastos → Cascade)
   - ✅ Referencias opcionales (InventarioRecibido.item → SetNull)

### Ver Análisis Completo

📖 **[ROBUSTEZ_SISTEMA.md](./ROBUSTEZ_SISTEMA.md)** contiene:
- Análisis detallado de todas las protecciones
- Comparación con Odoo ERP
- Casos extremos manejados
- Garantías de robustez
- Mejoras futuras planificadas

**El sistema NO fallará en condiciones normales de operación.**

---

## 📜 Scripts Disponibles

```bash
npm run dev              # Desarrollo (localhost:3000)
npm run build            # Build producción
npm run start            # Servidor producción

npx prisma generate      # Generar cliente Prisma
npx prisma migrate deploy  # Aplicar migraciones
npx prisma db seed       # Cargar datos de prueba
npx prisma studio        # UI para base de datos
```

---

## 🚦 Estado del Proyecto

**Versión**: 2.0.0 - Sistema Multi-Producto

**Última Actualización**: Noviembre 2025

**Funcionalidades Completas**:
- ✅ Sistema multi-producto para órdenes
- ✅ Distribución de gastos logísticos tipo Odoo
- ✅ Vinculación inventario-producto específico
- ✅ Cálculos robustos con protecciones completas
- ✅ Dashboard con KPIs
- ✅ Deployment automático
- ✅ Documentación técnica completa

**Futuras Mejoras** (backlog):
- 🔶 Recálculo de costos post-recepción (wizard)
- 🔶 Validación de sobre-recepción
- 🔶 Audit trail completo
- 🔶 Exportación a Excel/PDF

---

## 👥 Para Nuevas Sesiones de Claude

**Si eres Claude Code en una nueva sesión, LEE PRIMERO**:

1. ⭐⭐⭐ Este `README.md` - Visión general completa
2. ⭐⭐⭐ `ROBUSTEZ_SISTEMA.md` - Principios de diseño
3. ⭐⭐ `lib/calculations.ts` - Lógica de cálculos
4. ⭐⭐ `prisma/schema.prisma` - Modelo de datos
5. ⭐ `git log --oneline -20` - Últimos cambios

**Contexto clave**:
- Sistema multi-producto (v2.0) - NO single-product
- `cantidadOrdenada` y `costoFOBTotalUSD` son CALCULADOS (no en BD)
- Distribución de gastos es proporcional por % FOB
- Todas las divisiones están protegidas contra cero
- El sistema sigue principios de Odoo ERP

---

## 📞 Soporte

- **Documentación**: Este README + ROBUSTEZ_SISTEMA.md
- **Código**: Revisar `lib/calculations.ts` para lógica
- **Issues**: Crear en el repositorio

---

<div align="center">

**🎯 Sistema de Gestión de Importaciones**

*Robusto • Preciso • Basado en Principios ERP*

**© 2025 - Todos los derechos reservados**

[⬆ Volver arriba](#-sistema-de-gestión-de-importaciones-desde-china)

</div>
