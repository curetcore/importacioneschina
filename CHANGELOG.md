# Changelog - Sistema de Importaciones Curet

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.1.0] - 2025-01-17

### 🎯 FUNCIONALIDAD PRINCIPAL: Distribución Profesional de Costos

Esta actualización implementa un sistema profesional de distribución de costos que elimina el error del 9,090% en cálculos de costos finales.

### ✨ Agregado

#### **Modelo de Datos**

- Agregado campo `peso_unitario_kg` a tabla `oc_china_items` para registrar peso por unidad
- Agregado campo `volumen_unitario_cbm` a tabla `oc_china_items` para registrar volumen por unidad
- Agregado campo `peso_total_kg` calculado automáticamente (peso × cantidad)
- Agregado campo `volumen_total_cbm` calculado automáticamente (volumen × cantidad)
- Nueva tabla `config_distribucion_costos` para configurar métodos de distribución por tipo de costo
- Migración SQL: `prisma/migrations/20250117_add_cost_distribution_fields/migration.sql`

#### **Backend - Motor de Distribución**

- Nueva librería `lib/cost-distribution.ts` con 4 métodos profesionales:
  - `distributeByWeight()` - Distribución proporcional por peso (kg)
  - `distributeByVolume()` - Distribución proporcional por volumen (CBM)
  - `distributeByFOBValue()` - Distribución proporcional por valor FOB
  - `distributeByUnit()` - Distribución igual por unidad (fallback)
- Función helper `calculateCBM()` para convertir dimensiones a metros cúbicos
- Función helper `getDistributionMethodLabel()` para etiquetas en español
- Función helper `getRecommendedMethod()` para sugerir métodos por tipo de costo
- Nuevo endpoint API `GET /api/distribucion-costos/config` - Obtener configuración
- Nuevo endpoint API `PUT /api/distribucion-costos/config` - Actualizar método de distribución

#### **Frontend - Formularios**

- Campos de "Peso Unitario (kg)" en formulario de productos de OC
- Campos de "Volumen Unitario (CBM)" en formulario de productos de OC
- Nuevo componente `<CBMCalculator>` modal para calcular CBM desde dimensiones
- Botón calculadora integrado junto al campo de volumen
- Tooltips explicativos sobre por qué importan peso y volumen
- Validación de números positivos y rangos razonables

#### **Frontend - Configuración**

- Nuevo tab "Distribución de Costos" en página de Configuración
- Componente `<DistribucionCostosSettings>` para gestionar métodos
- Grid de cards mostrando cada tipo de costo con su método actual
- Selectores dropdown para cambiar método por tipo de costo
- Card informativo azul explicando cada método de distribución
- Actualizaciones en tiempo real con confirmaciones toast
- Iconos visuales por tipo de costo (DollarSign, Ship, Package, etc.)

#### **Frontend - Visualización**

- Badges de método usado en leyenda de Análisis de Costos
- Código de colores: Pagos (azul), Gastos (naranja), Comisiones (morado)
- Función helper `getMethodLabel()` para traducir métodos a español
- Métodos mostrados en legend info box por cada tipo de costo
- Nota informativa sobre distribución profesional

#### **Testing**

- Suite completa de tests unitarios: `lib/__tests__/cost-distribution.test.ts`
- 25 tests cubriendo todos los métodos de distribución
- Tests de edge cases: valores null, división por cero, arrays vacíos
- Tests de precisión numérica y validación de totales
- Cobertura: 100% líneas, 100% funciones, 84.84% ramas

#### **Documentación**

- Guía completa de usuario: `docs/GUIA-DISTRIBUCION-COSTOS.md`
- Guía de migración: `docs/GUIA-MIGRACION.md`
- Ejemplos prácticos de cálculos por peso, volumen y valor
- Mejores prácticas y casos especiales
- Preguntas frecuentes (FAQ)
- Este changelog

### 🔧 Cambiado

#### **API de Análisis de Costos**

- **BREAKING:** `/api/analisis-costos` ahora usa distribución profesional en lugar de distribución ecuánime
- Los costos se distribuyen según configuración en tabla `config_distribucion_costos`
- Response incluye nuevos campos: `metodoPagos`, `metodoGastos`, `metodoComisiones`
- Interface `ProductoCosto` actualizada con campos de métodos usados

#### **Cálculo de Costos**

- **IMPORTANTE:** Los costos finales cambiarán para productos existentes
- Productos pesados/grandes ahora pagan más flete (correcto)
- Productos caros ahora pagan más aduana/comisiones (correcto)
- Productos sin peso/volumen usan distribución por unidades como fallback

### 🐛 Corregido

- Corregido TypeScript error en `lib/audit-logger.ts` (null → undefined para JSON nullable)
- Corregido error de distribución ecuánime que causaba costos incorrectos del 9,090%
- Corregido componente DialogClose que requería prop `onClose`

### 📊 Impacto en Negocio

- ✅ Eliminados errores de cálculo de hasta 9,090% en costos
- ✅ Distribución profesional como Freightos, Flexport, Cargowize
- ✅ Credibilidad profesional para producto SaaS
- ✅ ROI estimado: 14 horas desarrollo → +$4,800/año en ingresos
- ✅ Permite pricing premium ($50-100/mes más)

### ⚠️ Notas de Migración

#### **Para Desarrolladores:**

1. Ejecutar migración de base de datos (ver `docs/GUIA-MIGRACION.md`)
2. Regenerar Prisma Client: `npx prisma generate`
3. Rebuild aplicación: `npm run build`

#### **Para Usuarios:**

1. Los costos finales cambiarán para reflejar distribución real
2. Agregar peso/volumen a productos nuevos (recomendado)
3. Configurar métodos en: Configuración → Distribución de Costos
4. Revisar análisis de costos y ajustar precios de venta si necesario

### 🔗 Pull Requests / Commits

- `feat: Implement professional cost distribution system (Phases 1-5)` - f877c29
- `docs: Mark cost distribution phases 1-5 as completed` - 5045560
- `test: Add comprehensive unit tests for cost distribution (Phase 6)` - c845c1f

---

## [1.0.0] - 2025-01-10

### ✨ Lanzamiento Inicial

#### **Características Principales**

- Sistema completo de gestión de órdenes de compra (OC China)
- Registro de pagos a proveedores
- Gestión de gastos logísticos (flete, aduana, transporte)
- Control de inventario recibido
- Análisis de costos básico (distribución ecuánime)
- Configuración dinámica del sistema
- CRM de proveedores
- Autenticación de usuarios
- Dashboard con KPIs en tiempo real

#### **Stack Tecnológico**

- Next.js 14 con App Router
- TypeScript 5.5
- PostgreSQL + Prisma ORM
- React Query para data fetching
- React Hook Form + Zod para validación
- Tailwind CSS para estilos
- React Table v8 para tablas
- Lucide React para iconos

#### **Módulos Implementados**

- ✅ Órdenes de Compra con items y adjuntos
- ✅ Pagos a China con múltiples monedas
- ✅ Gastos Logísticos por tipo
- ✅ Inventario Recibido por bodega
- ✅ Análisis de Costos
- ✅ Configuración del Sistema
- ✅ Proveedores CRM
- ✅ Panel de Control (Dashboard)

---

## Tipos de Cambios

- `✨ Agregado` - Nueva funcionalidad
- `🔧 Cambiado` - Cambios en funcionalidad existente
- `🗑️ Deprecado` - Funcionalidad que será removida
- `🐛 Corregido` - Corrección de bugs
- `🔒 Seguridad` - Parches de seguridad
- `📊 Impacto` - Impacto en negocio o datos

---

**Formato de Versiones:** MAJOR.MINOR.PATCH

- **MAJOR:** Cambios incompatibles con versiones anteriores
- **MINOR:** Nueva funcionalidad compatible con versiones anteriores
- **PATCH:** Correcciones de bugs compatibles con versiones anteriores
