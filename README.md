# 🚢 Sistema de Gestión de Importaciones desde China

> **Sistema completo, robusto y seguro** para gestionar importaciones desde China con control financiero automático, distribución de costos tipo ERP, autenticación robusta y cálculos precisos siguiendo principios de Odoo.

[![Next.js](https://img.shields.io/badge/Next.js-14.2.33-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-brightgreen)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue)](https://www.postgresql.org/)
[![NextAuth](https://img.shields.io/badge/NextAuth.js-Latest-purple)](https://next-auth.js.org/)

**📚 Versión 2.5.1 - Sistema Multi-Producto con Seguridad y Robustez + Documentación Exhaustiva**

[Características](#-características-principales) • [Arquitectura](#-arquitectura) • [Seguridad](#-seguridad-y-autenticación) • [Instalación](#-instalación) • [Modelo de Datos](#️-modelo-de-datos) • [Cálculos](#-cálculos-y-distribución-de-costos) • [Documentación](#-documentación-técnica)

---

## 📋 Tabla de Contenidos

1. [Características Principales](#-características-principales)
2. [Plan de Modernización de Librerías](#-plan-de-modernización-de-librerías)
3. [Métricas del Proyecto](#-métricas-del-proyecto)
4. [Seguridad y Autenticación](#-seguridad-y-autenticación)
5. [Arquitectura del Sistema](#-arquitectura-del-sistema)
6. [Análisis de Componentes](#-análisis-de-componentes)
7. [Modelo de Datos](#️-modelo-de-datos)
8. [Instalación y Configuración](#-instalación)
9. [Cálculos y Distribución de Costos](#-cálculos-y-distribución-de-costos)
10. [Flujos de Datos Principales](#-flujos-de-datos-principales)
11. [Uso del Sistema](#-uso-del-sistema)
12. [Documentación Técnica](#-documentación-técnica)
13. [API Endpoints](#-api-endpoints)
14. [Deployment](#-deployment)
15. [Robustez y Principios de Diseño](#-robustez-y-principios-de-diseño)
16. [TypeScript y Tipos](#-typescript-y-tipos)
17. [Patrones de Diseño](#-patrones-de-diseño)

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

## 🚀 Plan de Modernización de Librerías

Plan completo de integración de librerías modernas para mejorar performance, DX (Developer Experience), y funcionalidad del sistema. Implementación gradual sin romper el código existente.

### Estado General: 🟢 Fase 1 Completada

**Progreso Total:** 5/21 librerías implementadas (23.8%)

---

### 📦 Fase 1: Fundación y Quick Wins ✅
**Objetivo:** Mejorar UX inmediatamente y establecer bases sólidas
**Tiempo estimado:** 4-6 horas
**Impacto:** 🔥 Alto
**Estado:** ✅ COMPLETADO

- [x] **xlsx** - Exportación a Excel (✅ IMPLEMENTADO)
- [x] **sonner** - Sistema de notificaciones toast mejorado (✅ IMPLEMENTADO)
- [x] **date-fns** - Manejo robusto de fechas y formateo (✅ IMPLEMENTADO)
- [x] **currency.js** - Cálculos precisos de moneda (✅ IMPLEMENTADO)
- [x] **clsx** - Utilidad para classNames condicionales (✅ YA EXISTÍA)

**Beneficios logrados:**
- ✅ Notificaciones más elegantes con Sonner (animaciones suaves, stacking automático)
- ✅ Cálculos financieros sin errores de floating point usando currency.js
- ✅ Manejo de fechas robusto con date-fns (validaciones, comparaciones, rangos, locale español)
- ✅ Exportación a Excel funcional en todos los módulos principales

---

### 📝 Fase 2: Formularios Modernos
**Objetivo:** Simplificar formularios y validaciones
**Tiempo estimado:** 12-16 horas
**Impacto:** 🔥 Alto

- [ ] **react-hook-form** - Manejo de formularios con mejor performance
- [ ] **zod** - Validación type-safe de esquemas
- [ ] **@hookform/resolvers** - Integración zod + react-hook-form

**Archivos a migrar:**
- `components/forms/OCChinaForm.tsx`
- `components/forms/PagosChinaForm.tsx`
- `components/forms/GastosLogisticosForm.tsx`
- `components/forms/InventarioRecibidoForm.tsx`
- `components/forms/ConfiguracionForm.tsx`
- `components/forms/ProveedorForm.tsx`

**Beneficios esperados:**
- ~60% menos código en formularios
- Menos re-renders (mejor performance)
- Validación consistente y type-safe
- Mensajes de error automáticos

---

### 🔄 Fase 3: Data Management & Caching
**Objetivo:** Optimizar fetching de datos y cache inteligente
**Tiempo estimado:** 8-10 horas
**Impacto:** 🔥 Alto

- [ ] **@tanstack/react-query** - Client-side caching y data fetching
- [ ] **@tanstack/react-query-devtools** - Debugging tools

**Endpoints a migrar:**
- `/api/oc-china` → useQuery
- `/api/pagos-china` → useQuery
- `/api/gastos-logisticos` → useQuery
- `/api/inventario-recibido` → useQuery
- `/api/proveedores` → useQuery
- `/api/configuracion` → useQuery
- `/api/dashboard` → useQuery

**Beneficios esperados:**
- Cache automático (menos requests al servidor)
- Revalidación inteligente
- Loading/error states simplificados
- Optimistic updates
- Eliminar ~200 líneas de código de manejo de loading

---

### 📊 Fase 4: Tablas Profesionales
**Objetivo:** Tablas con sorting, filtering, pagination avanzada
**Tiempo estimado:** 10-14 horas
**Impacto:** 🔥 Alto

- [ ] **@tanstack/react-table** - Tablas con features avanzadas

**Tablas a migrar:**
- `app/(pages)/ordenes/page.tsx` - Tabla de órdenes
- `app/(pages)/pagos-china/page.tsx` - Tabla de pagos
- `app/(pages)/gastos-logisticos/page.tsx` - Tabla de gastos
- `app/(pages)/inventario-recibido/page.tsx` - Tabla de inventario
- `app/(pages)/configuracion/page.tsx` - Tabla de configuración
- `components/registros/ProveedoresList.tsx` - Lista de proveedores

**Beneficios esperados:**
- Sorting multi-columna
- Filtering avanzado
- Column visibility toggle
- Row selection
- Export mejorado
- Reemplaza ~500 líneas de código custom

---

### 📈 Fase 5: Visualización de Datos
**Objetivo:** Gráficos y dashboards interactivos
**Tiempo estimado:** 14-18 horas
**Impacto:** 🟡 Medio-Alto

- [ ] **recharts** - Librería de gráficos para React
- [ ] **@tremor/react** - Componentes de dashboard (opcional, alternativa a recharts)

**Componentes a crear:**
- Dashboard de tendencias de pagos por mes
- Gráfico de gastos logísticos por tipo
- Comparativa de proveedores (costos, tiempos)
- Análisis de tasas de cambio histórico
- Distribución de inventario por bodega
- Gráfico de costos FOB vs Landed Cost

**Beneficios esperados:**
- Visualización clara de tendencias
- Toma de decisiones basada en datos
- Dashboard ejecutivo profesional

---

### 📄 Fase 6: Generación de Reportes
**Objetivo:** PDFs e impresión profesional
**Tiempo estimado:** 12-16 horas
**Impacto:** 🟡 Medio

- [ ] **jspdf** - Generación de PDFs en el cliente
- [ ] **jspdf-autotable** - Tablas automáticas en PDFs
- [ ] **react-to-print** - Impresión optimizada de componentes

**Reportes a implementar:**
- PDF de Orden de Compra completa
- PDF de Reporte de Pagos
- PDF de Gastos Logísticos por período
- PDF de Inventario Recibido
- Resumen ejecutivo mensual
- Reporte de proveedor específico

**Beneficios esperados:**
- Documentos profesionales para contabilidad
- Reportes imprimibles para presentaciones
- Backup en PDF de transacciones importantes

---

### 🔧 Fase 7: Utilidades y Helpers
**Objetivo:** Funciones auxiliares para operaciones comunes
**Tiempo estimado:** 6-8 horas
**Impacto:** 🟢 Medio

- [ ] **lodash-es** - Utilidades para arrays, objetos, números
- [ ] **validator** - Validación y sanitización de inputs
- [ ] **numeral** - Formateo avanzado de números

**Uso propuesto:**
- `groupBy`, `sumBy` para agregaciones de KPIs
- Validación de emails, URLs, números
- Formateo de números grandes (1.5M, 2.3K)
- Sanitización de inputs del usuario

**Beneficios esperados:**
- Código más limpio y legible
- Funciones probadas y optimizadas
- Prevención de vulnerabilidades (XSS, injection)

---

### ⚡ Fase 8: UX Avanzada
**Objetivo:** Mejoras de experiencia de usuario avanzadas
**Tiempo estimado:** 8-10 horas
**Impacto:** 🟢 Medio

- [ ] **cmdk** - Command Palette (Cmd+K)
- [ ] **react-hot-keys-hook** - Keyboard shortcuts

**Features a implementar:**
- Command palette para navegación rápida
- Búsqueda global de OCs, productos, proveedores
- Shortcuts de teclado para acciones comunes
- Quick actions desde cualquier página

**Beneficios esperados:**
- Navegación más rápida (power users)
- Búsqueda instantánea cross-módulo
- Productividad aumentada

---

### 📋 Resumen por Fase

| Fase | Librerías | Tiempo | Impacto | Estado |
|------|-----------|--------|---------|--------|
| **Fase 1** | 5 librerías | 4-6h | 🔥 Alto | 🟢 100% ✅ |
| **Fase 2** | 3 librerías | 12-16h | 🔥 Alto | ⚪ 0% |
| **Fase 3** | 2 librerías | 8-10h | 🔥 Alto | ⚪ 0% |
| **Fase 4** | 1 librería | 10-14h | 🔥 Alto | ⚪ 0% |
| **Fase 5** | 2 librerías | 14-18h | 🟡 Medio | ⚪ 0% |
| **Fase 6** | 3 librerías | 12-16h | 🟡 Medio | ⚪ 0% |
| **Fase 7** | 3 librerías | 6-8h | 🟢 Bajo | ⚪ 0% |
| **Fase 8** | 2 librerías | 8-10h | 🟢 Bajo | ⚪ 0% |
| **TOTAL** | **21 librerías** | **74-98h** | - | **23.8%** |

---

### 🎯 Principios de Implementación

1. **Sin romper el estilo existente** - Mantener diseño Tailwind + shadcn/ui
2. **Migración gradual** - Implementar por fases, sin big-bang
3. **Backward compatible** - Código viejo sigue funcionando durante migración
4. **100% funcional** - Solo features probadas y estables
5. **Documentado** - Cada cambio documentado en commits
6. **Testing incremental** - Probar cada fase antes de siguiente

---

### 📦 Instalación Completa (cuando esté todo listo)

```bash
# Fase 1: Fundación
npm install sonner date-fns currency.js clsx

# Fase 2: Formularios
npm install react-hook-form zod @hookform/resolvers

# Fase 3: Data Management
npm install @tanstack/react-query @tanstack/react-query-devtools

# Fase 4: Tablas
npm install @tanstack/react-table

# Fase 5: Visualización
npm install recharts
# O alternativa premium:
npm install @tremor/react

# Fase 6: Reportes
npm install jspdf jspdf-autotable react-to-print

# Fase 7: Utilidades
npm install lodash-es validator numeral
npm install -D @types/lodash-es @types/numeral

# Fase 8: UX Avanzada
npm install cmdk react-hotkeys-hook
```

---

## 📊 Métricas del Proyecto

### Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Versión** | 2.5.0 |
| **Arquitectura** | Full-stack monolítico (Next.js App Router) |
| **Modelos de Datos** | 7 tablas (Prisma) |
| **API Endpoints** | 22 rutas |
| **Componentes UI** | 28 base + 6 formularios complejos |
| **Líneas de código** | ~15,000+ (estimado) |
| **Archivos TypeScript** | ~70 archivos |
| **Dependencias Prod** | 41 paquetes |
| **Dependencias Dev** | 14 paquetes |
| **Cobertura de tests** | Manual (sin tests automáticos aún) |

### Distribución de Código

```
Estructura del Proyecto:
├── Backend (API Routes)      ~3,500 líneas
│   ├── Autenticación         ~150 líneas
│   ├── CRUD Endpoints        ~2,800 líneas
│   └── Dashboard/Setup       ~550 líneas
├── Frontend (Components)     ~5,000 líneas
│   ├── Formularios           ~2,500 líneas
│   ├── UI Base               ~1,500 líneas
│   ├── Layout                ~500 líneas
│   └── Tablas/Listas         ~500 líneas
├── Lógica de Negocio (lib/)  ~800 líneas
│   ├── calculations.ts       ~342 líneas (⭐ crítico)
│   ├── validations.ts        ~151 líneas
│   ├── id-generator.ts       ~103 líneas
│   └── Otros                 ~204 líneas
├── Modelo de Datos           ~400 líneas
│   ├── schema.prisma         ~250 líneas
│   ├── seed.ts               ~150 líneas
└── Configuración             ~300 líneas
    ├── Tailwind/Next.js      ~150 líneas
    ├── TypeScript            ~50 líneas
    └── Docker                ~100 líneas
```

### Complejidad por Módulo

| Módulo | Archivos | Complejidad | Criticidad |
|--------|----------|-------------|------------|
| **lib/calculations.ts** | 1 | 🔴 Alta | ⭐⭐⭐ Crítico |
| **Formularios Multi-producto** | 2 | 🔴 Alta | ⭐⭐⭐ Crítico |
| **API CRUD Endpoints** | 15 | 🟡 Media | ⭐⭐ Importante |
| **Autenticación NextAuth** | 1 | 🟡 Media | ⭐⭐⭐ Crítico |
| **Dashboard/KPIs** | 2 | 🟡 Media | ⭐⭐ Importante |
| **Componentes UI** | 28 | 🟢 Baja | ⭐ Standard |
| **Validaciones Zod** | 2 | 🟢 Baja | ⭐⭐ Importante |
| **Generador de IDs** | 1 | 🟡 Media | ⭐⭐⭐ Crítico |

### Stack Tecnológico Detallado

**Core Framework:**
- Next.js 14.2.0 (App Router, Server Components, API Routes)
- React 18.3.0 (Server + Client Components)
- TypeScript 5.5.0 (Strict mode enabled)

**Base de Datos:**
- Prisma 6.19.0 (ORM con type-safety)
- PostgreSQL (última versión estable)
- Migraciones versionadas

**Autenticación y Seguridad:**
- NextAuth.js 4.24.13 (JWT strategy)
- bcryptjs 3.0.3 (password hashing)
- Rate limiting en memoria (5/15min)

**Validación:**
- Zod 3.23.0 (schema validation)
- React Hook Form 7.53.0 (formularios)
- @hookform/resolvers 3.9.0 (integración RHF + Zod)

**UI/UX:**
- Tailwind CSS 3.4.0
- Radix UI (componentes headless)
- Lucide React 0.441.0 (iconos)
- Recharts 2.12.0 (gráficos)
- TanStack Table 8.20.0 (tablas avanzadas)

**Deployment:**
- Docker (multi-stage build)
- Node.js 20 Alpine (imagen base)
- Standalone output (Next.js optimizado)

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

## 🔍 Análisis de Componentes

### Componentes Críticos del Sistema

#### 1. Formularios Complejos (6 componentes principales)

**OCChinaForm.tsx** (600 líneas) ⭐⭐⭐ **EL MÁS COMPLEJO**
```typescript
Responsabilidad: Crear/editar órdenes de compra multi-producto
Complejidad: 🔴 Alta

Características:
- Gestión de múltiples productos con expand/collapse
- Validación de tallaDistribucion (JSON o formato "38:10 / 39:20")
- Cálculo automático de subtotales y totales en tiempo real
- Carga dinámica de proveedores y categorías desde configuración
- Upload de adjuntos (PDFs, imágenes)
- Modo edición vs creación
- Validación: min 1 producto, cada uno con SKU + nombre + cantidad + precio

Estados principales:
- formData: Datos básicos de la OC
- items[]: Array de productos
- expandedItems: Set<string> - productos expandidos
- adjuntos[]: Archivos subidos

Ubicación: components/forms/OCChinaForm.tsx
API: POST /api/oc-china, PUT /api/oc-china/:id
```

**InventarioRecibidoForm.tsx** (448 líneas) ⭐⭐⭐
```typescript
Responsabilidad: Recepción de inventario con cálculo de costos
Complejidad: 🔴 Alta

Características:
- Selector de OC dinámico (carga items, pagos, gastos)
- Selector de producto específico (opcional)
- Cálculo automático de costos al seleccionar producto:
  * Ejecuta distribuirGastosLogisticos() en cliente
  * Muestra: costoFOBRD, gastosDistribuidos, costoUnitarioRD
  * Calcula costoTotalRecepcionRD en tiempo real
- Warning si no se selecciona producto específico
- Carga dinámica de bodegas desde configuración
- Validación de sobre-recepción

Estados principales:
- selectedOcData: OC con items, pagos, gastos
- selectedItemData: Producto seleccionado
- itemsOptions[]: Lista de productos disponibles
- costosCalculados: Resultado de distribuirGastosLogisticos()

Ubicación: components/forms/InventarioRecibidoForm.tsx
API: POST /api/inventario-recibido
Depende de: lib/calculations.ts (distribuirGastosLogisticos)
```

**PagosChinaForm.tsx** (~300 líneas) ⭐⭐
```typescript
Responsabilidad: Registro de pagos con conversión de monedas
Características:
- Selector de OC
- Selector de moneda (USD, CNY, RD$)
- Cálculo automático: montoRD = montoOriginal × tasaCambio
- Cálculo de montoRDNeto = montoRD + comisionBancoRD
- Carga dinámica de tipos y métodos de pago
- Upload de adjuntos (recibos, comprobantes)
```

**GastosLogisticosForm.tsx** (~250 líneas) ⭐⭐
```typescript
Responsabilidad: Registro de gastos logísticos
Características:
- Selector de OC
- Selector de tipoGasto desde configuración
- Selector de metodoPago desde configuración
- Upload de adjuntos (facturas, documentos)
```

**ProveedorForm.tsx** (~350 líneas) ⭐
```typescript
Responsabilidad: CRM de proveedores
Características:
- Información de contacto completa (20+ campos)
- Datos comerciales (términos de pago, mínimo de orden)
- Calificación (0-5 estrellas)
- Auto-generación de códigos (PROV-001, PROV-002, etc.)
```

**ConfiguracionForm.tsx** (~200 líneas) ⭐
```typescript
Responsabilidad: CRUD de configuraciones dinámicas
Características:
- Selector de categoría (proveedores, bodegas, tipos, etc.)
- Control de orden y estado activo/inactivo
- Validación de valores únicos por categoría
```

#### 2. Componentes UI Base (28 componentes)

Todos siguiendo el estilo **shadcn/ui** con Radix UI primitives:

**Componentes de Entrada:**
- `input.tsx` - Input básico con variantes
- `textarea.tsx` - Textarea con auto-resize
- `select.tsx` - Select mejorado con búsqueda
- `datepicker.tsx` - Selector de fechas (date-fns)
- `file-upload.tsx` ⭐ - Gestión de archivos con preview

**Componentes de Feedback:**
- `toast.tsx` - Notificaciones (sonner)
- `dialog.tsx` - Diálogos modales
- `confirm-dialog.tsx` ⭐ - Confirmación de acciones
- `cascade-delete-dialog.tsx` ⭐ - Preview de eliminaciones en cascada
- `alert.tsx` - Alertas y mensajes

**Componentes de Display:**
- `card.tsx` - Tarjetas de contenido
- `badge.tsx` - Etiquetas y estados
- `button.tsx` ⭐ - Botón mejorado con flex layout
- `tabs.tsx` - Navegación por pestañas
- `table.tsx` - Tabla básica
- `airtable-table.tsx` ⭐ - Tabla estilo Airtable

**Componentes de Layout:**
- `separator.tsx` - Separadores
- `scroll-area.tsx` - Área con scroll
- `sheet.tsx` - Panel lateral
- `popover.tsx` - Popovers
- `dropdown-menu.tsx` - Menús desplegables

**Componentes Especializados:**
- `attachments-list.tsx` ⭐ - Lista de adjuntos con preview
- `add-attachments-dialog.tsx` - Diálogo para añadir archivos
- `file-preview-modal.tsx` - Modal de vista previa
- `pagination.tsx` - Paginación de listas

#### 3. Lógica de Negocio (lib/)

**lib/calculations.ts** (342 líneas) ⭐⭐⭐ **CORAZÓN DEL SISTEMA**
```typescript
Funciones principales:

1. calcularTasaCambioPromedio(pagos: PagoChina[]): number
   - Tasa ponderada por montos
   - Fórmula: Σ(tasa × monto) / Σ(monto)
   - Protección: retorna 0 si totalMonto === 0

2. distribuirGastosLogisticos(...): ItemConCostos[] ⭐⭐⭐ CRÍTICA
   - Distribuye gastos proporcional al % FOB (tipo Odoo)
   - Para cada producto calcula:
     * porcentajeFOB = (subtotalUSD / totalFOB) × 100
     * gastosDistribuidos = (subtotalUSD / totalFOB) × totalGastosRD
     * costoFOBRD = subtotalUSD × tasaCambioPromedio
     * costoTotalRD = costoFOBRD + gastosDistribuidos
     * costoUnitarioRD = costoTotalRD / cantidadTotal
   - ⚠️ TODAS las divisiones protegidas contra cero

3. calcularResumenFinanciero(...): ResumenFinanciero
   - KPIs: inversión total, costos promedio, etc.
   - Usado en dashboard

4. Otras funciones:
   - calcularMontoRD()
   - calcularMontoRDNeto()
   - calcularTotalInversion()
   - calcularCostoUnitarioFinal()
   - calcularPorcentajeRecepcion()
   - calcularCostoTotalRecepcion()
   - calcularCostoFOBUnitario()
   - calcularOC() - Función agregadora

Patrones:
- Normalización de Prisma.Decimal a number
- Redondeo a 2 decimales (Math.round(x * 100) / 100)
- Validaciones de valores negativos
- Protección contra división por cero en TODAS las operaciones
```

**lib/prisma.ts** (11 líneas) ⭐⭐⭐ **PATRÓN SINGLETON**
```typescript
Propósito: Evitar "Too many connections" en desarrollo
Patrón: Singleton con globalThis

const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

⚠️ IMPORTANTE: NUNCA crear múltiples instancias de PrismaClient
⚠️ SIEMPRE importar desde lib/prisma.ts
```

**lib/id-generator.ts** (103 líneas) ⭐⭐
```typescript
Propósito: Generación de IDs thread-safe
Patrón: Transacción con isolation level Serializable

generateUniqueId(modelName, fieldName, prefix): Promise<string>
- Usa transacción Prisma con:
  * isolationLevel: Serializable (máxima protección)
  * maxWait: 5000ms
  * timeout: 10000ms
- Garantiza IDs únicos incluso con peticiones concurrentes
- Genera: OC-00001, PAG-00001, GAS-00001, REC-00001, PROV-001

⚠️ NO cambiar el nivel de aislamiento (puede causar IDs duplicados)
```

**lib/validations.ts** (151 líneas) ⭐⭐
```typescript
Schemas Zod para validación:
- ocChinaSchema
- pagosChinaSchema
- gastosLogisticosSchema
- inventarioRecibidoSchema
- configuracionSchema
- proveedorSchema

Características:
- Validaciones estrictas (min, max, positive, email, url)
- Coerción de tipos (z.coerce.date(), z.coerce.number())
- Mensajes de error personalizados
- Validación de fechas pasadas (no futuras)
- Enums para monedas, tipos, etc.
```

**lib/api-client.ts** (~100 líneas)
```typescript
Cliente HTTP para frontend:
- apiGet(url, options)
- apiPost(url, data, options)
- apiPut(url, data, options)
- apiDelete(url, options)
- getErrorMessage(error): string - Type-safe error handling

Características:
- Manejo de errores centralizado
- Type guards para unknown errors
- Retorna objetos tipados
```

#### 4. API Routes (22 endpoints)

**Autenticación:**
- `app/api/auth/[...nextauth]/route.ts` (150 líneas) ⭐⭐⭐
  * NextAuth.js configuration
  * Rate limiting en memoria (5/15min)
  * Mensajes de error genéricos
  * JWT callbacks con role

**CRUD Principales:**
- `app/api/oc-china/*` (4 archivos, ~600 líneas)
  * GET, POST, PUT, DELETE con validaciones
  * Gestión de items multi-producto
  * Upload de adjuntos
  * Cascade delete preview

- `app/api/pagos-china/*` (4 archivos, ~400 líneas)
  * CRUD pagos + adjuntos
  * Cálculo de montoRDNeto
  * Validación de tasas de cambio

- `app/api/gastos-logisticos/*` (4 archivos, ~350 líneas)
  * CRUD gastos + adjuntos
  * Validación de montos

- `app/api/inventario-recibido/*` (3 archivos, ~400 líneas) ⭐⭐⭐
  * Cálculo de costos distribuidos
  * Validación de sobre-recepción
  * Vinculación a producto específico

**Utilidades:**
- `app/api/dashboard/route.ts` (200 líneas) ⭐⭐
  * KPIs optimizados
  * Eliminación de N+1 queries
  * Límite de 500 OCs (previene OOM)

- `app/api/configuracion/*` (3 archivos, ~250 líneas)
  * CRUD configuraciones dinámicas

- `app/api/proveedores/*` (3 archivos, ~300 líneas)
  * CRM de proveedores
  * Auto-generación de códigos

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

## 🔄 Flujos de Datos Principales

### Flujo 1: Crear Orden de Compra con Múltiples Productos

```
┌─────────────────┐
│  Usuario (UI)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  OCChinaForm.tsx                │
│  - Datos básicos (proveedor,    │
│    fecha, categoría)            │
│  - Productos (min 1):           │
│    * SKU, nombre, cantidad,     │
│      precio                     │
│    * Opcional: material, color, │
│      tallas, especificaciones   │
│  - Adjuntos (PDFs, imágenes)    │
│  - Cálculo de subtotales        │
│    en tiempo real               │
└────────┬────────────────────────┘
         │ Submit
         ▼
┌─────────────────────────────────┐
│  POST /api/oc-china             │
│                                 │
│  1. Validar campos requeridos   │
│  2. Validar min 1 producto      │
│  3. Para cada producto:         │
│     - SKU, nombre required      │
│     - cantidad > 0, precio > 0  │
│     - subtotal = cant × precio  │
│     - max $999,999.99           │
│     - Validar tallas (JSON)     │
│  4. generateUniqueId():         │
│     - Transacción Serializable  │
│     - Genera OC-00001, etc.     │
│  5. Crear OC + items:           │
│     - 1 registro en oc_china    │
│     - N registros en items      │
│     - Relación 1:N CASCADE      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  PostgreSQL Database            │
│  - oc_china (1 registro)        │
│  - oc_china_items (N registros) │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Response → UI                  │
│  - OC creada con ID             │
│  - Redirect a detalle de OC     │
└─────────────────────────────────┘
```

**Ejemplo de Datos:**
```json
{
  "proveedor": "Nike China",
  "fechaOC": "2025-01-15",
  "categoriaPrincipal": "Zapatos",
  "items": [
    {
      "sku": "ZAP-001-01",
      "nombre": "Zapatos Deportivos Negros",
      "material": "Cuero sintético",
      "color": "Negro",
      "tallaDistribucion": {"38": 10, "39": 20, "40": 15, "41": 5},
      "cantidadTotal": 50,
      "precioUnitarioUSD": 12.50,
      "subtotalUSD": 625.00
    },
    {
      "sku": "ZAP-002-01",
      "nombre": "Zapatillas Running Blancas",
      "cantidadTotal": 100,
      "precioUnitarioUSD": 15.00,
      "subtotalUSD": 1500.00
    }
  ]
}
```

---

### Flujo 2: Calcular y Distribuir Gastos Logísticos

```
┌─────────────────┐
│  Usuario (UI)   │
│  - Selecciona   │
│    recibir      │
│    inventario   │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  InventarioRecibidoForm.tsx              │
│                                          │
│  1. Seleccionar OC                       │
│     → GET /api/oc-china/:id              │
│     → Carga: items, pagos, gastos        │
│                                          │
│  2. Seleccionar producto (opcional)      │
│     → Lista de productos de la OC        │
│                                          │
│  3. CÁLCULO AUTOMÁTICO (cliente):        │
│     distribuirGastosLogisticos(          │
│       oc.items,                          │
│       oc.gastosLogisticos,               │
│       oc.pagosChina                      │
│     )                                    │
│     ↓                                    │
│     Muestra en UI:                       │
│     - Costo FOB RD$                      │
│     - Gastos Distribuidos (% FOB)        │
│     - Costo Unitario RD$                 │
│     - Costo Total Recepción              │
│                                          │
│  4. Usuario ingresa:                     │
│     - Cantidad recibida                  │
│     - Bodega inicial                     │
└────────┬─────────────────────────────────┘
         │ Submit
         ▼
┌──────────────────────────────────────────┐
│  POST /api/inventario-recibido           │
│                                          │
│  1. Validar sobre-recepción:             │
│     totalRecibido = existente + nuevo    │
│     if (totalRecibido > ordenado) ERROR  │
│                                          │
│  2. Calcular costos (servidor):          │
│     itemsConCostos =                     │
│       distribuirGastosLogisticos(...)    │
│                                          │
│     ALGORITMO:                           │
│     a) totalFOBUSD = Σ items.subtotalUSD │
│     b) totalGastosRD = Σ gastos.montoRD  │
│     c) tasaPromedio = calcular()         │
│                                          │
│     Para cada item:                      │
│     - % FOB = subtotal / totalFOB × 100  │
│     - gastosItem = (subtotal / totalFOB) │
│                    × totalGastosRD       │
│     - costoFOBRD = subtotal × tasa       │
│     - costoTotalRD = FOB + gastos        │
│     - costoUnitarioRD = total / cantidad │
│                                          │
│  3. Determinar costo a usar:             │
│     if (itemId especificado)             │
│       → usar item.costoUnitarioRD        │
│     else                                 │
│       → promedio ponderado de OC         │
│                                          │
│  4. Crear recepción con costos           │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  PostgreSQL Database                     │
│  - inventario_recibido                   │
│    * idRecepcion: REC-00001              │
│    * ocId: (FK)                          │
│    * itemId: (FK) - producto específico  │
│    * cantidadRecibida: 95                │
│    * costoUnitarioFinalRD: 401.50        │
│    * costoTotalRecepcionRD: 38,142.50    │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Response → UI                           │
│  - Recepción creada                      │
│  - Mostrar costos finales                │
│  - Actualizar tabla de inventario        │
└──────────────────────────────────────────┘
```

**Ejemplo de Cálculo (OC con 3 productos):**

```
Datos de Entrada:
----------------
Items:
- Zapatos A: 100 × $10 = $1,000 (40% FOB)
- Zapatos B: 50 × $20 = $1,000 (40% FOB)
- Carteras C: 20 × $25 = $500 (20% FOB)
Total FOB: $2,500

Pagos:
- $1,000 USD × 58.5 = RD$ 58,500 + comisión RD$ 500 = RD$ 59,000
- ¥7,300 CNY × 8.2 = RD$ 59,860 + comisión RD$ 250 = RD$ 60,110
Total Pagado: RD$ 119,110

Gastos:
- Flete: RD$ 10,000
- Aduana: RD$ 5,000
- Broker: RD$ 2,000
Total Gastos: RD$ 17,000

Cálculos:
---------
Tasa Promedio = (58.5×1000 + 8.2×1000) / 2000 = 33.35 RD$/USD

Zapatos A (40% FOB):
  costoFOBRD = $1,000 × 33.35 = RD$ 33,350
  gastosDistribuidos = 40% × RD$ 17,000 = RD$ 6,800
  costoTotalRD = RD$ 40,150
  costoUnitarioRD = RD$ 40,150 / 100 = RD$ 401.50/unidad ✓

Recepción de 95 zapatos A:
  costoTotalRecepcionRD = 95 × RD$ 401.50 = RD$ 38,142.50 ✓
```

---

### Flujo 3: Dashboard con KPIs

```
┌─────────────────┐
│  Usuario        │
│  - Accede a     │
│    /dashboard   │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  GET /api/dashboard                      │
│                                          │
│  1. Cargar datos (máximo 500 OCs):       │
│     const ocs = await prisma.oCChina     │
│       .findMany({                        │
│         take: 500,                       │
│         orderBy: { createdAt: 'desc' },  │
│         include: {                       │
│           items: true,                   │
│           pagosChina: true,              │
│           gastosLogisticos: true,        │
│           inventarioRecibido: {          │
│             include: { item: true }      │
│           }                              │
│         }                                │
│       })                                 │
│                                          │
│  2. Para cada OC, calcular:              │
│     const calculos = calcularOC({        │
│       costoFOBTotalUSD: Σ items.subtotal,│
│       cantidadOrdenada: Σ items.cantidad,│
│       pagos: oc.pagosChina,              │
│       gastos: oc.gastosLogisticos,       │
│       inventario: oc.inventarioRecibido  │
│     })                                   │
│                                          │
│  3. Agregar KPIs:                        │
│     - inversionTotal = Σ totalInversionRD│
│     - unidadesOrdenadas = Σ cantidades   │
│     - unidadesRecibidas = Σ recepciones  │
│     - costoPromedio = inversión / recib  │
│                                          │
│  4. Optimización:                        │
│     - Usa flatMap en lugar de queries    │
│       adicionales (elimina N+1)          │
│     - Límite de 500 OCs (previene OOM)   │
│     - Carga solo últimas transacciones   │
│                                          │
│  5. Estructurar datos:                   │
│     {                                    │
│       kpis: {...},                       │
│       financiero: {...},                 │
│       gastos: {...},                     │
│       inventario: {...},                 │
│       proveedores: {...},                │
│       tablas: {                          │
│         topOCs: [...],                   │
│         transacciones: [...]             │
│       }                                  │
│     }                                    │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Dashboard UI (React)                    │
│                                          │
│  - KPI Cards (4-6 tarjetas)              │
│  - Gráficos (Recharts):                  │
│    * Inversión por proveedor             │
│    * Gastos por tipo                     │
│    * Inventario por bodega               │
│    * Tendencias temporales               │
│  - Tablas:                               │
│    * Top 10 OCs por inversión            │
│    * Últimas 10 transacciones            │
└──────────────────────────────────────────┘
```

**Performance:**
- Máximo 500 OCs cargadas
- Sin N+1 queries (usa flatMap)
- Cálculos en memoria (rápidos)
- Tiempo de respuesta: ~500ms - 1s

---

### Flujo 4: Autenticación con Rate Limiting

```
┌─────────────────┐
│  Usuario        │
│  - Ingresa      │
│    email/pass   │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  POST /api/auth/signin (NextAuth)        │
│                                          │
│  1. Validar input:                       │
│     - email presente                     │
│     - password presente                  │
│                                          │
│  2. Verificar rate limit:                │
│     checkRateLimit(email)                │
│     - Max 5 intentos / 15 minutos        │
│     - Usa Map en memoria                 │
│     if (excedido) → ERROR 429            │
│                                          │
│  3. Buscar usuario:                      │
│     user = await prisma.user.findUnique( │
│       { where: { email } }               │
│     )                                    │
│                                          │
│  4. Validaciones (mensajes genéricos):   │
│     if (!user || !user.activo)           │
│       → "Credenciales incorrectas" ⚠️    │
│                                          │
│  5. Verificar password:                  │
│     passwordMatch = await bcrypt.compare(│
│       password, user.password            │
│     )                                    │
│     if (!passwordMatch)                  │
│       → "Credenciales incorrectas" ⚠️    │
│       → Incrementar contador rate limit  │
│                                          │
│  6. Login exitoso:                       │
│     - Resetear contador rate limit       │
│     - Actualizar lastLogin               │
│     - Retornar user object               │
│                                          │
│  7. NextAuth genera:                     │
│     - JWT con role incluido              │
│     - Session cookie (30 días)           │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Middleware.ts (protección rutas)        │
│                                          │
│  - Verifica session para rutas:          │
│    /panel, /ordenes, /oc-china,          │
│    /pagos-china, /gastos-logisticos,     │
│    /inventario-recibido, /configuracion, │
│    /dashboard                            │
│                                          │
│  - Si no autenticado:                    │
│    → Redirect a /login                   │
│                                          │
│  - Si autenticado:                       │
│    → Permite acceso                      │
│    → Session disponible en página        │
└──────────────────────────────────────────┘
```

**Seguridad:**
- ✅ Rate limiting (5/15min)
- ✅ Mensajes genéricos (previene enumeración)
- ✅ bcrypt para passwords
- ✅ JWT con expiración (30 días)
- ✅ Middleware automático

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

## 🎨 Patrones de Diseño

El sistema implementa varios patrones de diseño reconocidos para garantizar mantenibilidad, escalabilidad y robustez:

### 1. Singleton Pattern

**Ubicación:** `lib/prisma.ts`

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Propósito:**
- Garantiza una única instancia de PrismaClient
- Previene el error "Too many connections" en desarrollo
- Reutiliza conexiones a la base de datos

**Beneficios:**
- ✅ Performance mejorado
- ✅ Control de recursos (conexiones DB)
- ✅ Compatibilidad con hot reload de Next.js

---

### 2. Repository Pattern

**Ubicación:** API Routes (`app/api/*`)

Cada módulo tiene su propio "repositorio" encapsulado en API Routes:

```
app/api/oc-china/         → Repositorio de Órdenes de Compra
app/api/pagos-china/      → Repositorio de Pagos
app/api/gastos-logisticos/→ Repositorio de Gastos
app/api/inventario-recibido/ → Repositorio de Inventario
```

**Propósito:**
- Separar lógica de acceso a datos de lógica de negocio
- Encapsular queries de Prisma
- Proporcionar interfaz HTTP consistente (GET, POST, PUT, DELETE)

**Beneficios:**
- ✅ Código organizado y mantenible
- ✅ Fácil de testear
- ✅ Cambios en DB no afectan frontend

---

### 3. Strategy Pattern

**Ubicación:** `lib/calculations.ts` (distribuirGastosLogisticos)

El sistema usa diferentes estrategias para calcular costos según el contexto:

```typescript
// ESTRATEGIA 1: Producto específico seleccionado
if (itemId) {
  const itemConCosto = itemsConCostos.find(i => i.id === itemId)
  costoUnitarioFinalRD = itemConCosto.costoUnitarioRD
}

// ESTRATEGIA 2: Sin producto específico (lote mixto)
else {
  const totalUnidades = itemsConCostos.reduce(...)
  const totalCosto = itemsConCostos.reduce(...)
  costoUnitarioFinalRD = totalCosto / totalUnidades // Promedio ponderado
}
```

**Propósito:**
- Permitir diferentes algoritmos de cálculo según contexto
- Flexibilidad en determinar costos

**Beneficios:**
- ✅ Flexibilidad
- ✅ Código extensible
- ✅ Fácil añadir nuevas estrategias

---

### 4. Factory Pattern

**Ubicación:** `lib/id-generator.ts`

```typescript
export async function generateUniqueId(
  modelName: string,
  fieldName: string,
  prefix: string
): Promise<string> {
  // Factory que crea IDs únicos según el modelo
  // OC-00001, PAG-00001, GAS-00001, REC-00001, PROV-001
}
```

**Propósito:**
- Centralizar creación de IDs únicos
- Garantizar formato consistente
- Thread-safe con isolation Serializable

**Beneficios:**
- ✅ IDs consistentes en todo el sistema
- ✅ Sin duplicados (garantizado por transacción)
- ✅ Fácil de mantener

---

### 5. Composite Pattern

**Ubicación:** Modelo de datos (OCChina + OCChinaItem)

```typescript
interface OCChina {
  id: string
  oc: string
  proveedor: string
  // ...
  items: OCChinaItem[]  // ⭐ Composición
  pagos: PagoChina[]
  gastos: GastoLogistico[]
}
```

**Propósito:**
- Modelar relaciones jerárquicas (OC contiene items)
- Tratar objetos individuales y composiciones de forma uniforme

**Beneficios:**
- ✅ Estructura de datos natural
- ✅ Fácil de navegar (oc.items[0].sku)
- ✅ Queries eficientes con Prisma include

---

### 6. Observer Pattern

**Ubicación:** React State Management

```typescript
// Componentes observan cambios de estado
const [items, setItems] = useState<OCItem[]>([])

// Cuando el estado cambia, los componentes se re-renderizan
useEffect(() => {
  // Observar cambios y recalcular
  const nuevoTotal = items.reduce(...)
  setTotal(nuevoTotal)
}, [items])  // ⭐ Observer: escucha cambios en 'items'
```

**Propósito:**
- Reactividad en la UI
- Propagación automática de cambios

**Beneficios:**
- ✅ UI siempre sincronizada
- ✅ Cálculos automáticos en tiempo real
- ✅ Menos código boilerplate

---

### 7. Facade Pattern

**Ubicación:** `lib/calculations.ts`

```typescript
// FACADE que encapsula lógica compleja de cálculos
export function distribuirGastosLogisticos(
  items: OCChinaItem[],
  gastosLogisticos: GastoLogistico[],
  pagosChina: PagoChina[]
): ItemConCostos[] {
  // Internamente usa múltiples funciones:
  const tasaPromedio = calcularTasaCambioPromedio(pagosChina)
  const totalFOB = calcularTotalFOB(items)
  const totalGastos = calcularTotalGastos(gastosLogisticos)

  // Pero expone una interfaz simple
  return itemsConCostos
}
```

**Propósito:**
- Ocultar complejidad de cálculos
- Interfaz simple para operaciones complejas

**Beneficios:**
- ✅ Fácil de usar desde formularios
- ✅ Lógica encapsulada y testeable
- ✅ Cambios internos no afectan a clientes

---

### 8. Decorator Pattern

**Ubicación:** Middleware de NextAuth

```typescript
// middleware.ts - "Decora" rutas con autenticación
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/panel/:path*",
    "/ordenes/:path*",
    // ... más rutas
  ],
}
```

**Propósito:**
- Añadir funcionalidad (autenticación) a rutas existentes
- Sin modificar el código de las rutas

**Beneficios:**
- ✅ Separación de concerns
- ✅ Reutilizable
- ✅ Fácil de activar/desactivar

---

### 9. Builder Pattern (Implícito)

**Ubicación:** Formularios complejos (OCChinaForm)

```typescript
// Construcción paso a paso de una OC compleja
const formData = {
  // 1. Datos básicos
  proveedor: "...",
  fechaOC: "...",

  // 2. Añadir productos (construcción incremental)
  items: []
}

// Usuario añade items uno por uno
const handleAddItem = () => {
  setItems([...items, nuevoItem])
}

// 3. Submit final construye objeto completo
const handleSubmit = () => {
  const ocCompleta = {
    ...formData,
    items: items
  }
}
```

**Propósito:**
- Construcción incremental de objetos complejos
- Permitir diferentes representaciones del objeto

**Beneficios:**
- ✅ Flexibilidad en construcción
- ✅ Validación en cada paso
- ✅ UX mejorada (construcción guiada)

---

### 10. Template Method Pattern

**Ubicación:** API Routes (estructura común)

Todos los API endpoints siguen el mismo template:

```typescript
// TEMPLATE común en todos los endpoints
export async function POST(request: Request) {
  try {
    // 1. Validar input (Zod)
    const body = await request.json()
    const validado = schema.parse(body)

    // 2. Lógica de negocio (varía por endpoint)
    const resultado = await prisma.modelo.create(...)

    // 3. Retornar respuesta (formato estándar)
    return NextResponse.json({
      success: true,
      data: resultado
    }, { status: 201 })

  } catch (error) {
    // 4. Manejo de errores (estándar)
    return NextResponse.json({
      success: false,
      error: mensaje
    }, { status: 500 })
  }
}
```

**Propósito:**
- Estructura consistente en todos los endpoints
- Pasos comunes definidos, detalles específicos varían

**Beneficios:**
- ✅ Código predecible
- ✅ Fácil de entender
- ✅ Menos errores

---

### Resumen de Patrones

| Patrón | Ubicación | Propósito Principal |
|--------|-----------|-------------------|
| **Singleton** | lib/prisma.ts | Una única instancia de PrismaClient |
| **Repository** | app/api/* | Encapsular acceso a datos |
| **Strategy** | lib/calculations.ts | Diferentes algoritmos de cálculo |
| **Factory** | lib/id-generator.ts | Creación de IDs únicos |
| **Composite** | Modelo de datos | Estructura jerárquica (OC + items) |
| **Observer** | React state | Reactividad en UI |
| **Facade** | lib/calculations.ts | Interfaz simple para lógica compleja |
| **Decorator** | middleware.ts | Añadir autenticación a rutas |
| **Builder** | Formularios | Construcción incremental de objetos |
| **Template Method** | API Routes | Estructura consistente en endpoints |

**Principios SOLID aplicados:**

- ✅ **Single Responsibility:** Cada módulo tiene una responsabilidad clara
- ✅ **Open/Closed:** Abierto a extensión (añadir endpoints), cerrado a modificación
- ✅ **Liskov Substitution:** Componentes UI intercambiables
- ✅ **Interface Segregation:** APIs específicas por módulo
- ✅ **Dependency Inversion:** Depende de abstracciones (Prisma ORM, NextAuth)

---

## 📝 Changelog

### v2.5.1 (Noviembre 2025)
- ✅ **Documentación exhaustiva actualizada**
  - Métricas del proyecto (15,000+ líneas de código)
  - Análisis completo de componentes críticos
  - Flujos de datos principales detallados (4 flujos)
  - Patrones de diseño documentados (10 patrones)
  - Distribución de código por módulo
  - Stack tecnológico detallado
- ✅ Análisis de complejidad por módulo
- ✅ Guía completa de arquitectura

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

**Versión 2.5.1** | Built with Next.js 14 + TypeScript + Prisma + PostgreSQL + NextAuth.js

---

[⬆ Volver arriba](#-sistema-de-gestión-de-importaciones-desde-china)

</div>
