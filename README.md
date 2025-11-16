# 🚢 Sistema de Gestión de Importaciones desde China

> **Sistema completo, robusto y seguro** para gestionar importaciones desde China con control financiero automático, distribución de costos tipo ERP, autenticación robusta y cálculos precisos siguiendo principios de Odoo.

[![Next.js](https://img.shields.io/badge/Next.js-14.2.33-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-brightgreen)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue)](https://www.postgresql.org/)
[![NextAuth](https://img.shields.io/badge/NextAuth.js-Latest-purple)](https://next-auth.js.org/)

**📚 Versión 2.5 - Sistema Multi-Producto con Seguridad y Robustez**

[Características](#-características-principales) • [Arquitectura](#-arquitectura) • [Seguridad](#-seguridad-y-autenticación) • [Instalación](#-instalación) • [Modelo de Datos](#️-modelo-de-datos) • [Cálculos](#-cálculos-y-distribución-de-costos) • [Documentación](#-documentación-técnica)

---

## 📋 Tabla de Contenidos

1. [Características Principales](#-características-principales)
2. [Seguridad y Autenticación](#-seguridad-y-autenticación)
3. [Arquitectura del Sistema](#-arquitectura-del-sistema)
4. [Modelo de Datos](#️-modelo-de-datos)
5. [Instalación y Configuración](#-instalación)
6. [Cálculos y Distribución de Costos](#-cálculos-y-distribución-de-costos)
7. [Uso del Sistema](#-uso-del-sistema)
8. [Documentación Técnica](#-documentación-técnica)
9. [API Endpoints](#-api-endpoints)
10. [Deployment](#-deployment)
11. [Robustez y Principios de Diseño](#-robustez-y-principios-de-diseño)
12. [TypeScript y Tipos](#-typescript-y-tipos)

---

## ✨ Características Principales

### 🎯 Sistema Multi-Producto (v2.0)

<table>
<tr>
<td width="50%">

#### 📦 Órdenes con Múltiples Productos
- ✅ Cada OC puede tener **múltiples items/productos**
- ✅ Tracking individual por SKU, nombre, material, color
- ✅ Distribución de tallas opcional (JSON)
- ✅ Cálculos automáticos de totales
- ✅ Validación robusta de tipos y datos

</td>
<td width="50%">

#### 💰 Distribución de Costos Tipo ERP
- ✅ **Landed Costs** inspirados en Odoo
- ✅ Gastos distribuidos proporcionalmente por % FOB
- ✅ Tasa de cambio promedio ponderada
- ✅ Costos precisos por producto
- ✅ Protección contra divisiones por cero

</td>
</tr>
<tr>
<td>

#### 📊 Dashboard Financiero
- ✅ KPIs en tiempo real
- ✅ Gráficos interactivos
- ✅ Métricas por proveedor
- ✅ Análisis de gastos
- ✅ Resumen de inversiones

</td>
<td>

#### 🔍 Trazabilidad Completa
- ✅ Vinculación inventario-producto
- ✅ Historial de transacciones
- ✅ Control de recepciones
- ✅ Reportes detallados
- ✅ Audit trail de cambios

</td>
</tr>
</table>

### 🛡️ Seguridad y Robustez (v2.5)

- ✅ **Autenticación con NextAuth.js** - JWT strategy con sesiones de 30 días
- ✅ **Rate Limiting** - 5 intentos de login por 15 minutos
- ✅ **Mensajes de error genéricos** - Previene enumeración de usuarios
- ✅ **PrismaClient Singleton** - Previene agotamiento de conexiones
- ✅ **TypeScript Strict Mode** - Type safety completo
- ✅ **Sin divisiones por cero** - Todas las operaciones matemáticas protegidas
- ✅ **Validaciones completas** - Datos validados antes de procesar
- ✅ **Integridad referencial** - Cascadas y relaciones correctas
- ✅ **Campos computados** - Valores calculados dinámicamente
- ✅ **Precisión decimal** - Manejo correcto de Prisma.Decimal
- ✅ **Manejo de errores robusto** - Error boundaries y type guards

> 📖 **Ver [ROBUSTEZ_SISTEMA.md](./ROBUSTEZ_SISTEMA.md)** para análisis completo de diseño

---

## 🔐 Seguridad y Autenticación

### Sistema de Autenticación

**Tecnología**: NextAuth.js con Credentials Provider

**Características de seguridad implementadas**:

#### 1. Rate Limiting en Memoria
```typescript
// app/api/auth/[...nextauth]/route.ts

// Límite: 5 intentos fallidos por 15 minutos por email
// Almacenamiento: Map en memoria (para producción usar Redis)
function checkRateLimit(email: string): boolean
```

#### 2. Mensajes de Error Genéricos
```typescript
// ANTES (inseguro - permite enumeración)
throw new Error("Usuario no encontrado")
throw new Error("Contraseña incorrecta")

// AHORA (seguro)
throw new Error("Credenciales incorrectas")
```

#### 3. Gestión de Sesiones
```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 días
}
```

#### 4. Roles de Usuario
```typescript
// Roles disponibles: ADMIN, USUARIO
// Se incluyen en el JWT y session
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.role = user.role
    }
    return token
  }
}
```

#### 5. Contraseñas con bcrypt
```typescript
// Hash con salt rounds = 10
const hashedPassword = await bcrypt.hash(password, 10)
const passwordMatch = await bcrypt.compare(password, user.password)
```

### Variables de Entorno Críticas

```env
# CRÍTICO: Debe estar configurado en producción
NEXTAUTH_SECRET=tu-secret-super-seguro-aqui

# URL de la aplicación
NEXTAUTH_URL=https://tu-dominio.com

# Base de datos (con conexión cifrada en producción)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

⚠️ **IMPORTANTE**: En producción, `NEXTAUTH_SECRET` debe ser una cadena aleatoria fuerte (mínimo 32 caracteres)

### Protecciones Implementadas

| Vulnerabilidad | Protección | Ubicación |
|----------------|-----------|-----------|
| Enumeración de usuarios | Mensajes genéricos | `app/api/auth/[...nextauth]/route.ts:66-67` |
| Brute force | Rate limiting 5/15min | `app/api/auth/[...nextauth]/route.ts:10-41` |
| Sesiones indefinidas | Max age 30 días | `app/api/auth/[...nextauth]/route.ts:116` |
| Conexiones DB exhausted | Singleton pattern | `lib/prisma.ts` |
| Inyección SQL | Prisma ORM | Todos los endpoints |
| XSS | React auto-escape | Componentes |

---

## 🏗 Arquitectura del Sistema

### Stack Tecnológico

```
┌─────────────────────────────────────────────┐
│          Frontend (Next.js 14)              │
│  React + TypeScript + Tailwind CSS          │
├─────────────────────────────────────────────┤
│        Autenticación (NextAuth.js)          │
│     JWT Strategy + Credentials Provider     │
├─────────────────────────────────────────────┤
│        API Routes (Next.js)                 │
│     Validaciones + Error Handling           │
├─────────────────────────────────────────────┤
│         ORM (Prisma 6.19)                   │
│   Cálculos en lib/calculations.ts           │
├─────────────────────────────────────────────┤
│      Base de Datos (PostgreSQL)             │
│    6 tablas principales + JSON              │
└─────────────────────────────────────────────┘
```

### Estructura de Directorios

```
curet-importaciones/
├── 📂 app/
│   ├── 📂 (auth)/                # Páginas de autenticación
│   │   └── login/                # Login con NextAuth
│   ├── 📂 (pages)/               # Páginas protegidas del sistema
│   │   ├── dashboard/            # Dashboard con KPIs
│   │   ├── ordenes/              # Lista y detalle de OCs
│   │   ├── gastos/               # Gastos logísticos
│   │   ├── pagos/                # Pagos a proveedores
│   │   └── inventario/           # Inventario recibido
│   ├── 📂 api/                   # API Routes
│   │   ├── auth/                 # ⭐ NextAuth configuration
│   │   │   └── [...nextauth]/route.ts  # Auth + Rate limiting
│   │   ├── oc-china/             # CRUD órdenes
│   │   ├── pagos-china/          # CRUD pagos
│   │   ├── gastos-logisticos/    # CRUD gastos
│   │   ├── inventario-recibido/  # CRUD inventario
│   │   ├── dashboard/            # Datos dashboard
│   │   └── setup/                # Setup inicial de BD
│   └── layout.tsx
├── 📂 components/
│   ├── forms/                    # Formularios complejos
│   │   ├── OCChinaForm.tsx       # ⭐ Formulario multi-producto
│   │   ├── InventarioRecibidoForm.tsx # Con cálculo de costos
│   │   ├── PagosChinaForm.tsx    # Pagos con conversión
│   │   └── GastosLogisticosForm.tsx   # Gastos logísticos
│   └── ui/                       # Componentes base
│       ├── button.tsx            # ⭐ Mejorado con flex layout
│       └── ...
├── 📂 lib/
│   ├── calculations.ts           # ⭐⭐⭐ LÓGICA DE CÁLCULOS
│   ├── prisma.ts                 # ⭐ Cliente Prisma (Singleton)
│   ├── validations.ts            # Schemas Zod
│   └── id-generator.ts           # Generador de IDs únicos
├── 📂 prisma/
│   ├── schema.prisma             # ⭐⭐⭐ Modelo de datos
│   ├── seed.ts                   # Datos de prueba multi-producto
│   └── migrations/               # Migraciones
├── 📄 ROBUSTEZ_SISTEMA.md        # ⭐ Análisis de robustez
├── 📄 README.md                  # Este archivo
├── 📄 Dockerfile                 # Deploy automático multi-stage
└── 📄 start.sh                   # Script de inicio con migraciones
```

---

## 🗄️ Modelo de Datos

### Diagrama de Relaciones (v2.5)

```
┌──────────────┐
│     User     │ Usuarios del Sistema (NUEVO v2.5)
│              │
│ - id         │
│ - email      │ (unique)
│ - password   │ (hashed con bcrypt)
│ - name       │
│ - role       │ (ADMIN, USUARIO)
│ - activo     │
│ - lastLogin  │
└──────────────┘

┌──────────────┐
│   OCChina    │ Orden de Compra
│              │
│ - id         │
│ - oc         │ (código único)
│ - proveedor  │
│ - fechaOC    │
│ - categoria  │
│ - adjuntos   │ (JSON)
└──┬───────────┘
   │
   ├──1:N──┐
   │       ▼
   │   ┌───────────────────┐
   │   │  OCChinaItem      │ Productos en la OC
   │   │                   │
   │   │ - id              │
   │   │ - ocId (FK)       │
   │   │ - sku             │
   │   │ - nombre          │
   │   │ - material        │
   │   │ - color           │
   │   │ - especificaciones│
   │   │ - tallaDistribucion │ (JsonValue - tipo especial)
   │   │ - cantidadTotal   │
   │   │ - precioUnitarioUSD │
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
   │   │ - itemId (FK)        │ ⭐ Vincular a producto
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
   │   │ - idPago         │ (código único)
   │   │ - ocId (FK)      │
   │   │ - moneda         │ (USD, CNY, RD$)
   │   │ - montoOriginal  │
   │   │ - tasaCambio     │
   │   │ - comisionBancoRD│
   │   │ - montoRDNeto    │ (calculado)
   │   └──────────────────┘
   │
   └──1:N──┐
           ▼
       ┌──────────────────────┐
       │ GastosLogisticos     │
       │                      │
       │ - idGasto            │ (código único)
       │ - ocId (FK)          │
       │ - tipoGasto          │
       │ - montoRD            │
       │ - fechaGasto         │
       └──────────────────────┘
```

### Tipos Especiales de Prisma

#### JsonValue vs InputJsonValue

**CRÍTICO** para trabajar con campos JSON en Prisma:

```typescript
import type { JsonValue, InputJsonValue } from "@prisma/client/runtime/library"

// Para LEER desde la base de datos
interface OCChinaItem {
  tallaDistribucion?: JsonValue  // Puede ser null desde BD
}

// Para ESCRIBIR a la base de datos
interface OCItemValidado {
  tallaDistribucion?: InputJsonValue  // Opcional = undefined, no null
}

// Función de validación debe retornar undefined para null
function validarTallaDistribucion(tallas: unknown): InputJsonValue | undefined {
  if (!tallas) return undefined  // ⚠️ NO retornar null
  // ... validaciones
  return tallasValidadas
}
```

**Regla de oro**:
- `JsonValue` = lectura
- `InputJsonValue` = escritura
- Campos opcionales usan `undefined`, NO `null`

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
cd curet-importaciones

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con:
#   - DATABASE_URL
#   - NEXTAUTH_SECRET (generar con: openssl rand -base64 32)
#   - NEXTAUTH_URL

# 4. Generar cliente Prisma
npx prisma generate

# 5. Aplicar migraciones
npx prisma migrate deploy

# 6. Crear usuario admin inicial
npx prisma db seed

# 7. Ejecutar en desarrollo
npm run dev
```

Abrir http://localhost:3000

**Credenciales por defecto** (seed):
- Email: `admin@curet.com`
- Password: `admin123`

⚠️ **IMPORTANTE**: Cambiar credenciales en producción

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

**Protección**: Si `totalMonto === 0`, retorna `0` (no divide)

#### 2. Distribución de Gastos por Producto

```typescript
// Para cada producto:
porcentajeFOB = (subtotalUSD_producto / totalFOBUSD_orden) × 100

gastosDistribuidos = (subtotalUSD_producto / totalFOBUSD_orden) × totalGastosRD

costoFOBRD = subtotalUSD × tasaCambioPromedio

costoTotalRD = costoFOBRD + gastosDistribuidos

costoUnitarioRD = costoTotalRD / cantidadTotal
```

**Protecciones**:
- Si `totalFOBUSD <= 0`, retorna array vacío (previene división por cero)
- Si `cantidadTotal <= 0`, `costoUnitarioRD = 0`

Ver implementación completa en `lib/calculations.ts:231-292`

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

---

## 📖 Uso del Sistema

### 1. Login

```
http://tu-dominio.com/login
├── Email: admin@curet.com
└── Password: admin123
    → Protección: 5 intentos / 15 minutos
    → Session: 30 días con JWT
```

### 2. Crear Orden de Compra con Productos

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

### 3. Registrar Pagos

```
Seleccionar OC → Nuevo Pago
├── Moneda: USD
├── Monto: $1,000
├── Tasa: 58.5 RD$/USD
└── Comisión: RD$ 500
    → Sistema calcula: RD$ 58,500 (neto: RD$ 59,000)
```

### 4. Registrar Gastos Logísticos

```
Seleccionar OC → Nuevo Gasto
├── Tipo: Flete internacional
├── Monto: RD$ 10,000
└── Fecha: 2025-01-20
    → Sistema distribuye entre todos los productos automáticamente
```

### 5. Recibir Inventario (Vinculado a Producto)

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
| `README.md` | ⭐⭐⭐ **Este archivo - visión general completa** | CRÍTICO - Leer primero |
| `lib/calculations.ts` | ⭐⭐⭐ **Toda la lógica de cálculos** | CRÍTICO - Corazón del sistema |
| `prisma/schema.prisma` | ⭐⭐⭐ **Modelo de datos completo** | CRÍTICO - Estructura BD |
| `app/api/auth/[...nextauth]/route.ts` | ⭐⭐ **Autenticación + Rate limiting** | MUY IMPORTANTE |
| `lib/prisma.ts` | ⭐⭐ **Singleton de PrismaClient** | MUY IMPORTANTE |
| `ROBUSTEZ_SISTEMA.md` | ⭐⭐ **Principios de diseño y robustez** | MUY IMPORTANTE |
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

### Patrones de Error Handling

#### 1. TypeScript Unknown Errors

```typescript
// ❌ INCORRECTO
} catch (error: any) {
  return error.message
}

// ✅ CORRECTO
} catch (error) {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
```

#### 2. Errores de Validación Prisma

```typescript
} catch (error) {
  // Type guard para errores con propiedad 'errors'
  if (error && typeof error === 'object' && 'errors' in error) {
    return NextResponse.json({
      success: false,
      error: "Datos de entrada inválidos",
      details: error.errors,
    }, { status: 400 })
  }

  // Errores genéricos del sistema
  return NextResponse.json({
    success: false,
    error: "Error al procesar solicitud",
  }, { status: 500 })
}
```

#### 3. Errores de Negocio vs Sistema

```typescript
} catch (error) {
  // Distinguir entre errores de validación de negocio (400) y errores del sistema (500)
  if (error instanceof Error && error.message.includes("inventario recibido vinculado")) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 400 })
  }

  return NextResponse.json({
    success: false,
    error: "Error al actualizar orden de compra",
  }, { status: 500 })
}
```

---

## 🔌 API Endpoints

### Autenticación

```http
POST   /api/auth/signin           # Login (NextAuth)
POST   /api/auth/signout          # Logout
GET    /api/auth/session          # Obtener sesión actual
```

### Órdenes de Compra

```http
GET    /api/oc-china              # Lista OCs (incluye items)
                                  # Query: ?page=1&limit=20&search=OC-001&proveedor=Nike
POST   /api/oc-china              # Crear OC con items
                                  # Body: { proveedor, fechaOC, items: [...] }
GET    /api/oc-china/:id          # Obtener OC con items, pagos, gastos
PUT    /api/oc-china/:id          # Actualizar OC y sus items
DELETE /api/oc-china/:id          # Eliminar OC
                                  # Query: ?cascade=true&preview=true
```

### Pagos

```http
GET    /api/pagos-china?ocId=...  # Lista pagos de una OC
POST   /api/pagos-china           # Crear pago
                                  # Calcula: montoRDNeto = montoRD + comisionBancoRD
PUT    /api/pagos-china/:id       # Actualizar pago
DELETE /api/pagos-china/:id       # Eliminar pago
```

### Gastos Logísticos

```http
GET    /api/gastos-logisticos?ocId=...  # Lista gastos de una OC
POST   /api/gastos-logisticos    # Crear gasto
PUT    /api/gastos-logisticos/:id # Actualizar gasto
DELETE /api/gastos-logisticos/:id # Eliminar gasto
```

### Inventario Recibido

```http
POST   /api/inventario-recibido   # Crear recepción
                                   # Body: { ocId, itemId, cantidadRecibida, ... }
                                   # → Calcula costos con distribuirGastosLogisticos()
GET    /api/inventario-recibido?ocId=...  # Lista recepciones
```

### Dashboard

```http
GET    /api/dashboard             # KPIs y métricas
                                  # Returns: { totalOCs, totalInversion, ... }
```

### Setup

```http
GET    /api/setup                 # Setup inicial de BD (solo una vez)
                                  # Ejecuta: prisma generate + db push + seed
```

---

## 🐳 Deployment

### Easypanel (Automático)

El repositorio incluye:
- `Dockerfile` multi-stage optimizado para producción
- `start.sh` que aplica migraciones automáticamente
- Deploy automático en cada push a la rama principal

**Configuración en Easypanel**:

```yaml
# Variables de entorno requeridas
DATABASE_URL=postgresql://user:pass@postgres:5432/db?sslmode=require
NEXTAUTH_SECRET=<generar-con-openssl-rand-base64-32>
NEXTAUTH_URL=https://tu-dominio.com
NODE_ENV=production
PORT=80
```

**Build Args en Dockerfile**:
```dockerfile
ARG DATABASE_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
```

### Dockerfile Multi-Stage

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pasar variables de entorno como build args
ARG DATABASE_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL

ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL

RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY start.sh ./

RUN chmod +x start.sh

EXPOSE 80
CMD ["./start.sh"]
```

### Script de Inicio

```bash
#!/bin/sh
# start.sh

# Aplicar migraciones de Prisma
npx prisma migrate deploy

# Iniciar servidor
node server.js
```

### SSH Access para Debugging

```bash
# Ver logs del servicio
sshpass -p 'PASSWORD' ssh -o StrictHostKeyChecking=no root@IP \
  "docker service logs apps_sistema_de_importacion --tail 50"

# Acceso al contenedor
sshpass -p 'PASSWORD' ssh -o StrictHostKeyChecking=no root@IP \
  "docker exec -it CONTAINER_ID sh"

# Ver estado del servicio
sshpass -p 'PASSWORD' ssh -o StrictHostKeyChecking=no root@IP \
  "docker service ls | grep apps_sistema"
```

### Deployment Manual (Local)

```bash
# Build
docker build -t importaciones \
  --build-arg DATABASE_URL="..." \
  --build-arg NEXTAUTH_SECRET="..." \
  --build-arg NEXTAUTH_URL="..." \
  .

# Run
docker run -p 3000:80 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="..." \
  importaciones
```

---

## 🛡️ Robustez y Principios de Diseño

### Diseño Siguiendo Odoo ERP

El sistema fue diseñado siguiendo los principios del ERP Odoo:

1. **Campos Computados vs Almacenados**
   - ✅ `cantidadOrdenada`, `costoFOBTotalUSD` → Computados dinámicamente desde items
   - ✅ Pagos, gastos, fechas → Almacenados como hechos históricos
   - ✅ Costos unitarios → Calculados en tiempo real con distribución

2. **Landed Costs (Distribución de Gastos)**
   - ✅ Gastos distribuidos proporcionalmente por % FOB
   - ✅ Similar al módulo de Odoo Purchase/Stock
   - ✅ Tasa de cambio promedio ponderada por montos

3. **Protecciones Matemáticas**
   - ✅ TODAS las divisiones protegidas contra cero
   - ✅ Validaciones completas de negocio
   - ✅ Manejo correcto de tipos Decimal de Prisma
   - ✅ Redondeo consistente a 2 decimales

4. **Integridad Referencial**
   - ✅ Cascadas correctas (Items, Pagos, Gastos → Cascade)
   - ✅ Referencias opcionales (InventarioRecibido.itemId → SetNull)
   - ✅ Validaciones pre-delete para prevenir pérdida de datos

5. **Seguridad por Diseño**
   - ✅ PrismaClient singleton (previene connection exhaustion)
   - ✅ Rate limiting en autenticación
   - ✅ Mensajes de error genéricos
   - ✅ TypeScript strict mode
   - ✅ Input validation con type guards

### Ver Análisis Completo

📖 **[ROBUSTEZ_SISTEMA.md](./ROBUSTEZ_SISTEMA.md)** contiene:
- Análisis detallado de todas las protecciones
- Comparación con Odoo ERP
- Casos extremos manejados
- Garantías de robustez
- Mejoras futuras planificadas

**El sistema NO fallará en condiciones normales de operación.**

---

## 🔷 TypeScript y Tipos

### Configuración Strict

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Tipos Críticos de Prisma

#### 1. JsonValue vs InputJsonValue

```typescript
// Importar desde runtime library
import type { JsonValue, InputJsonValue } from "@prisma/client/runtime/library"

// LECTURA desde BD
interface ItemFromDB {
  tallaDistribucion: JsonValue | null
}

// ESCRITURA a BD
interface ItemToCreate {
  tallaDistribucion?: InputJsonValue  // Opcional con undefined
}

// Validación
function validarTallaDistribucion(data: unknown): InputJsonValue | undefined {
  if (!data) return undefined  // NO usar null
  // ... validación
  return validatedData
}
```

#### 2. Prisma.Decimal

```typescript
import { Prisma } from "@prisma/client"

// Normalización de Decimal a number
function toNumber(value: number | Prisma.Decimal): number {
  return typeof value === 'number' ? value : parseFloat(value.toString())
}

// Uso en cálculos
const monto = toNumber(pago.montoOriginal)
const tasa = toNumber(pago.tasaCambio)
const total = monto * tasa
```

#### 3. Error Handling con Type Guards

```typescript
// Patrón recomendado
} catch (error) {
  console.error("Error:", error)

  // Type guard para Error
  if (error instanceof Error) {
    return { error: error.message }
  }

  // Type guard para objetos con 'errors'
  if (error && typeof error === 'object' && 'errors' in error) {
    return { error: "Validation failed", details: error.errors }
  }

  // Fallback
  return { error: String(error) }
}
```

### Errores Comunes y Soluciones

#### Error: Type 'null' is not assignable to type 'InputJsonValue'

```typescript
// ❌ INCORRECTO
interface Item {
  tallaDistribucion: InputJsonValue | null
}

// ✅ CORRECTO
interface Item {
  tallaDistribucion?: InputJsonValue  // Opcional = undefined
}
```

#### Error: 'error' is of type 'unknown'

```typescript
// ❌ INCORRECTO
} catch (error) {
  console.log(error.message)  // Error: 'error' is of type 'unknown'
}

// ✅ CORRECTO
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message)  // OK
  }
}
```

---

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo (localhost:3000)

# Producción
npm run build            # Build para producción
npm run start            # Servidor producción

# Base de datos
npx prisma generate      # Generar cliente Prisma
npx prisma migrate deploy  # Aplicar migraciones
npx prisma db seed       # Cargar datos de prueba
npx prisma studio        # UI para base de datos (localhost:5555)
npx prisma migrate dev   # Crear nueva migración

# Utilidades
npm run lint             # ESLint
npm run type-check       # TypeScript check sin build
```

---

## 🚦 Estado del Proyecto

**Versión**: 2.5.0 - Sistema Multi-Producto con Seguridad y Robustez

**Última Actualización**: Noviembre 2025

### Funcionalidades Completas

#### Core Features
- ✅ Sistema multi-producto para órdenes
- ✅ Distribución de gastos logísticos tipo Odoo
- ✅ Vinculación inventario-producto específico
- ✅ Cálculos robustos con protecciones completas
- ✅ Dashboard con KPIs en tiempo real
- ✅ Deployment automático con Docker

#### Seguridad
- ✅ Autenticación con NextAuth.js + JWT
- ✅ Rate limiting (5 intentos / 15 min)
- ✅ Mensajes de error genéricos
- ✅ PrismaClient singleton pattern
- ✅ TypeScript strict mode
- ✅ Input validation completa

#### UX/UI
- ✅ Botones con texto descriptivo (no solo iconos)
- ✅ Flex layout mejorado en componentes
- ✅ Formularios multi-paso con validación
- ✅ Feedback visual de acciones
- ✅ Responsive design

#### Documentación
- ✅ README completo con ejemplos
- ✅ ROBUSTEZ_SISTEMA.md con análisis técnico
- ✅ Comentarios en código crítico
- ✅ Diagramas de arquitectura
- ✅ Guías de deployment

### Futuras Mejoras (Backlog)

#### Funcionalidad
- 🔶 Recálculo de costos post-recepción (wizard)
- 🔶 Validación de sobre-recepción
- 🔶 Exportación a Excel/PDF
- 🔶 Importación masiva de productos
- 🔶 Historial de cambios (audit trail completo)

#### Seguridad
- 🔶 Rate limiting con Redis (producción)
- 🔶 2FA con autenticador
- 🔶 Logs de auditoría detallados
- 🔶 Encriptación de datos sensibles

#### Performance
- 🔶 Cache de cálculos frecuentes
- 🔶 Paginación optimizada
- 🔶 Índices de BD adicionales
- 🔶 Query optimization

---

## 👥 Para Nuevas Sesiones de Claude

**Si eres Claude Code en una nueva sesión, LEE PRIMERO**:

### Orden de Lectura Recomendado

1. ⭐⭐⭐ **Este `README.md`** - Visión general completa del sistema
2. ⭐⭐⭐ **`ROBUSTEZ_SISTEMA.md`** - Principios de diseño y robustez
3. ⭐⭐ **`lib/calculations.ts`** - Lógica de cálculos (corazón del sistema)
4. ⭐⭐ **`prisma/schema.prisma`** - Modelo de datos
5. ⭐⭐ **`app/api/auth/[...nextauth]/route.ts`** - Autenticación y seguridad
6. ⭐ **`lib/prisma.ts`** - Singleton de PrismaClient
7. ⭐ **`git log --oneline -20`** - Últimos cambios

### Contexto Clave

**Arquitectura**:
- Sistema multi-producto (v2.0) - NO single-product
- `cantidadOrdenada` y `costoFOBTotalUSD` son CALCULADOS (no en BD)
- Distribución de gastos es proporcional por % FOB
- Todas las divisiones están protegidas contra cero

**Seguridad**:
- NextAuth.js con JWT strategy
- Rate limiting en memoria (5/15min)
- Mensajes de error genéricos
- PrismaClient singleton pattern

**TypeScript**:
- Strict mode habilitado
- `JsonValue` para lectura, `InputJsonValue` para escritura
- Campos opcionales JSON usan `undefined`, NO `null`
- Error handling con type guards (`error instanceof Error`)

**Deployment**:
- Dockerfile multi-stage
- Variables de entorno pasadas como build args
- Migraciones automáticas en start.sh
- Deploy en Easypanel con PostgreSQL

### Comandos Útiles

```bash
# Ver estructura del proyecto
ls -la app/api/

# Ver último commit
git log -1 --stat

# Ver servicios remotos
sshpass -p 'PASSWORD' ssh root@IP "docker service ls"

# Ver logs de producción
sshpass -p 'PASSWORD' ssh root@IP "docker service logs apps_sistema_de_importacion --tail 50"
```

### Reglas de Oro

1. **NUNCA** eliminar las protecciones contra división por cero en `lib/calculations.ts`
2. **SIEMPRE** usar `undefined` para campos JSON opcionales, NO `null`
3. **SIEMPRE** validar errores con type guards antes de acceder propiedades
4. **NUNCA** usar `any` en TypeScript, usar `unknown` y type guards
5. **SIEMPRE** usar el PrismaClient singleton de `lib/prisma.ts`
6. **NUNCA** exponer información sensible en mensajes de error de autenticación

---

## 🔗 Enlaces Útiles

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth.js Docs**: https://next-auth.js.org
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 📞 Soporte

- **Documentación Principal**: Este README
- **Análisis Técnico**: ROBUSTEZ_SISTEMA.md
- **Código Fuente**: Revisar `lib/calculations.ts` para lógica de negocio
- **Issues**: Crear en el repositorio

---

## 📝 Changelog

### v2.5.0 (Noviembre 2025)
- ✅ Autenticación con NextAuth.js
- ✅ Rate limiting en login
- ✅ PrismaClient singleton pattern
- ✅ Mejoras de UX en botones
- ✅ Fixes de tipos TypeScript para Prisma JSON
- ✅ Error handling robusto con type guards
- ✅ Documentación completa actualizada

### v2.0.0
- ✅ Sistema multi-producto
- ✅ Distribución de gastos tipo Odoo
- ✅ Vinculación inventario-producto
- ✅ Cálculos protegidos contra división por cero
- ✅ Dashboard con KPIs

### v1.0.0
- ✅ Sistema básico de órdenes de compra
- ✅ Gestión de pagos y gastos
- ✅ Inventario recibido

---

<div align="center">

**🎯 Sistema de Gestión de Importaciones desde China**

*Robusto • Seguro • Preciso • Basado en Principios ERP*

**© 2025 - Todos los derechos reservados**

---

**Versión 2.5.0** | Built with Next.js 14 + TypeScript + Prisma + PostgreSQL + NextAuth.js

---

[⬆ Volver arriba](#-sistema-de-gestión-de-importaciones-desde-china)

</div>
