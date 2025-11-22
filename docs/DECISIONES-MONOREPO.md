# 📋 Registro de Decisiones - Migración al Monorepo

**Proyecto:** CuretCore Monorepo Migration
**Repositorio:** https://github.com/curetcore/curetcore.git
**Fecha inicio:** 2025-01-22

---

## 🎯 Decisiones Estratégicas

### Decisión 001: Estrategia de Migración

**Fecha:** 2025-01-22
**Tomada por:** Usuario + Claude
**Contexto:** Proyecto en producción, necesita migración sin downtime

**Opciones consideradas:**

1. Migrar gradual (mantener ambos repos temporalmente)
2. Migrar todo de una vez al monorepo
3. Construcción en paralelo + switch cuando esté listo

**Decisión:** **Opción 3 - Construcción en paralelo**

**Razones:**

- ✅ 0 riesgo para producción durante construcción
- ✅ Tiempo para validar TODO antes del switch
- ✅ Rollback fácil si algo falla
- ✅ No duplica esfuerzo (migración única)

**Impacto:**

- Producción en `/curet-importaciones/` NO se toca durante DÍA 1-6
- Monorepo se construye en `/curetcore/` desde cero
- Switch en DÍA 7-8 solo cuando TODO esté validado

---

### Decisión 002: Nombre del Repositorio

**Fecha:** 2025-01-22
**Tomada por:** Usuario
**Contexto:** Necesitaba nombre para crear repo en GitHub

**Opciones consideradas:**

1. `curetcore` - Corto, profesional
2. `curetcore-platform` - Más descriptivo
3. `curetcore-monorepo` - Deja claro que es monorepo

**Decisión:** **`curetcore`**

**Razones:**

- ✅ Corto y memorable
- ✅ Profesional
- ✅ Escalable (puede incluir múltiples apps sin que suene raro)

**Implementación:**

- Repo creado: https://github.com/curetcore/curetcore.git
- Organización: `curetcore`
- Nombre: `curetcore`

---

### Decisión 003: Visibilidad del Repositorio

**Fecha:** 2025-01-22
**Tomada por:** Usuario
**Contexto:** Decidir si repo público o privado

**Opciones consideradas:**

1. Público - Gratis, portfolio, comunidad
2. Privado - Código protegido, secretos seguros

**Decisión:** **Privado** (inferido por el contexto de negocio)

**Razones:**

- ✅ Sistema ERP con lógica de negocio propietaria
- ✅ Mejor control sobre exposición
- ✅ Secretos/credenciales protegidos
- ✅ Puede hacerse público después si se desea

---

### Decisión 004: Aplicar Rebrand Durante Migración

**Fecha:** 2025-01-22
**Tomada por:** Usuario + Claude
**Contexto:** Existe doc de rebrand (MIGRACION-REBRAND-CURETCORE.md)

**Opciones consideradas:**

1. Migrar primero, rebrand después
2. Rebrand primero, migrar después
3. Hacer ambos simultáneamente

**Decisión:** **Opción 3 - Rebrand + Migración simultánea**

**Razones:**

- ✅ Eficiencia: Un solo cambio en lugar de dos
- ✅ Nombres correctos desde día 1
- ✅ Menos trabajo total
- ✅ Más profesional

**Impacto:**

- Package names: `@curetcore/*` desde inicio
- Assets: Sin "-importacion" en nombres
- Código: "CuretCore Platform" desde día 1

---

### Decisión 005: Velocidad de Trabajo

**Fecha:** 2025-01-22
**Tomada por:** Usuario
**Contexto:** Definir ritmo de trabajo

**Opciones consideradas:**

1. Modo Conservador (1-2h/día, 1-2 meses)
2. Modo Normal (3-4h/día, 2-3 semanas)
3. Modo Sprint (8h/día, 5-7 días)

**Decisión:** **Modo Sprint**

**Razones:**

- ✅ Completar rápido
- ✅ Momentum sostenido
- ✅ Menos riesgo de abandonar a mitad

**Timeline:**

- 5-7 días de trabajo intensivo (8h/día)
- 7 fases bien definidas
- Switch a producción en DÍA 8

---

### Decisión 006: Prioridad de Extracción

**Fecha:** 2025-01-22
**Tomada por:** Usuario
**Contexto:** Decidir qué componentes extraer primero

**Opciones consideradas:**

1. Solo componentes críticos (7 = 60% del valor)
2. Todos los componentes de una vez (36)

**Decisión:** **Opción 2 - TODOS los componentes (36)**

**Razones:**

- ✅ Sistema completo desde día 1
- ✅ No hay componentes huérfanos
- ✅ Validación total antes de producción

**Impacto:**

- FASE 4: 7 componentes críticos (8-10h)
- FASE 5: 29 componentes restantes (12-16h)
- Total: 36 componentes en packages/ui

---

### Decisión 007: Estructura de Documentación

**Fecha:** 2025-01-22
**Tomada por:** Claude + Usuario
**Contexto:** Organizar docs globales vs específicas de módulo

**Decisión:** **Separación clara: Global vs Módulo-específica**

**Estructura:**

```
/docs/                    ← GLOBAL (arquitectura, testing, monorepo)
apps/importaciones/docs/  ← ESPECÍFICA (lógica de negocio, features)
```

**Razones:**

- ✅ Claridad sobre qué es compartido vs específico
- ✅ Escalable para nuevos módulos
- ✅ Facilita encontrar documentación relevante

---

### Decisión 008: Naming Convention

**Fecha:** 2025-01-22
**Tomada por:** Claude
**Contexto:** Nombres consistentes en todo el monorepo

**Decisión:**

**Packages:**

- `@curetcore/ui` - Componentes React
- `@curetcore/utils` - Utilidades compartidas
- `@curetcore/config` - Configuraciones
- `@curetcore/database` - Prisma schemas
- `@curetcore/logger` - Sistema de logging

**Apps:**

- `@curetcore/importaciones` - App de importaciones
- `@curetcore/inventario` - App de inventario (futura)
- `@curetcore/tesoreria` - App de tesorería (futura)

**Razones:**

- ✅ Consistencia total
- ✅ Scope claro (@curetcore/)
- ✅ Fácil identificar paquetes vs apps
- ✅ Sigue best practices de monorepos

---

## 🛠️ Decisiones Técnicas

### Decisión 101: Herramientas del Monorepo

**Fecha:** 2025-01-22 (heredado de plan anterior)
**Contexto:** Ya decidido en monorepo base existente

**Stack elegido:**

- **Turborepo** v2.0.0 - Build system
- **pnpm** v10.23.0 - Package manager
- **TypeScript** v5.5.4 - Type safety
- **Next.js** 15+ - Framework

**Razones:**

- ✅ Ya funcionando en `/curet-monorepo/`
- ✅ Turborepo: Mejor caché y performance
- ✅ pnpm: Más rápido que npm/yarn
- ✅ TypeScript: Type safety esencial

---

### Decisión 102: Estructura de Packages

**Fecha:** 2025-01-22
**Contexto:** Qué packages compartidos crear

**Decisión:**

**Fase inicial (ya creados en `/curet-monorepo/`):**

1. `packages/ui` - Componentes React
2. `packages/utils` - Utilidades
3. `packages/config` - Configuraciones
4. `packages/logger` - Logging

**A crear en FASE 6:** 5. `packages/database` - Prisma schemas 6. `packages/eslint-config` - ESLint compartido 7. `packages/tsconfig` - TypeScript configs 8. `packages/tailwind-config` - Tailwind compartido

**Razones:**

- ✅ Separación de responsabilidades clara
- ✅ Reutilización máxima
- ✅ Escalable para nuevas apps

---

### Decisión 103: Estrategia de Testing

**Fecha:** 2025-01-22
**Contexto:** Asegurar calidad durante migración

**Decisión:**

**Tests a mantener:**

- ✅ Unit tests (Jest) - 79 tests existentes
- ✅ E2E tests (Playwright) - 20+ tests

**Tests a agregar:**

- [ ] Tests de componentes migrados
- [ ] Tests de integración del monorepo
- [ ] Validación de build

**Criterio de éxito:**

- Todos los tests existentes deben pasar
- 0 regresiones
- Build sin warnings

---

## 📦 Decisiones de Assets y Branding

### Decisión 201: Renombrado de Assets

**Fecha:** 2025-01-22
**Contexto:** Aplicar rebrand a imágenes

**Decisión:**

**Antes:**

```
isotipo-importacion.png
logotipo-importacion.png
logotipo-importacion-grisclaro.png
```

**Después:**

```
isotipo.png
logotipo.png
logotipo-grisclaro.png
```

**Razones:**

- ✅ Genérico, no específico de módulo
- ✅ Reutilizable en todas las apps
- ✅ Más corto y limpio

---

### Decisión 202: Textos de UI

**Fecha:** 2025-01-22
**Contexto:** Rebrand de textos visibles

**Decisión:**

**Reemplazos:**

- "Sistema de Importaciones" → "CuretCore Platform"
- "sistema de importación" → "CuretCore"
- "importacion.curetcore.com" → "curetcore.com"

**Archivos afectados:**

- Login page
- PDFs de exportación
- Email templates
- Navbar
- Documentación (57 archivos)

---

## 🔄 Decisiones de Proceso

### Decisión 301: Sistema de Tracking

**Fecha:** 2025-01-22
**Tomada por:** Claude
**Contexto:** Necesidad de no perder contexto entre sesiones

**Decisión:** **Sistema triple de tracking**

**Componentes:**

1. `docs/ESTADO-MIGRACION-MONOREPO.md` - Estado actual
2. `docs/DECISIONES-MONOREPO.md` - Este archivo
3. TodoList activa - Tracking en tiempo real

**Razones:**

- ✅ Contexto preservado entre sesiones
- ✅ Cualquier persona puede continuar el trabajo
- ✅ Registro histórico de decisiones
- ✅ Transparencia total

**Actualización:**

- Después de cada sesión de trabajo
- Al completar cada fase
- Al tomar decisiones importantes

---

### Decisión 302: Trabajo por Fases

**Fecha:** 2025-01-22
**Tomada por:** Usuario
**Contexto:** Solicitud de trabajar incrementalmente

**Decisión:** **7 fases bien definidas**

**Fases:** 0. Documentación y Tracking (30 min) ✅

1. Git Remote y Estructura (2-3h)
2. Rebrand Completo (4-6h)
3. Migración Documentación (2-3h)
4. Componentes Críticos (8-10h)
5. Componentes Restantes (12-16h)
6. Utils, Hooks, Database (8-10h)
7. Validación y Tests (6-8h)

**Razones:**

- ✅ Progreso medible
- ✅ Puntos de checkpoint claros
- ✅ Fácil retomar trabajo
- ✅ Reduce riesgo de errores

---

### Decisión 303: Estrategia de Commits

**Fecha:** 2025-01-22
**Tomada por:** Claude
**Contexto:** Mantener historial limpio y útil

**Decisión:** **Commits descriptivos por fase**

**Formato:**

```
feat(fase-N): Descripción clara de lo completado

- Detalle 1
- Detalle 2
- Detalle 3

Fase X completada ✅
```

**Razones:**

- ✅ Historial legible
- ✅ Fácil revertir si necesario
- ✅ Documentación viva del progreso

---

## ⚠️ Decisiones Pendientes

### Pendiente 001: Estrategia de Database

**Contexto:** Decidir si Prisma va en package compartido o por app

**Opciones:**

1. `packages/database` - Schema único compartido
2. Cada app tiene su propio schema
3. Híbrido: Schemas compartidos + específicos

**Estado:** ⏸️ PENDIENTE - Decidir en FASE 6

---

### Pendiente 002: CI/CD

**Contexto:** Configurar pipeline de CI/CD

**Opciones:**

1. GitHub Actions
2. Vercel CI
3. Otro servicio

**Estado:** ⏸️ PENDIENTE - Después de FASE 7

---

### Pendiente 003: Storybook

**Contexto:** Catálogo visual de componentes

**Opciones:**

1. Storybook completo desde día 1
2. Storybook básico en FASE 7
3. Postponer para después

**Estado:** ⏸️ DECIDIR - Probablemente opción 2

---

## 📊 Métricas y KPIs

### KPI 001: Código Compartido

**Meta:** >70% de código compartido entre apps
**Estado actual:** 17% (solo 6/36 componentes en base)
**Meta al final:** >70%

---

### KPI 002: Performance de Build

**Meta:** Build < 30s con caché
**Estado actual:** No medido en monorepo nuevo
**Verificar en:** FASE 7

---

### KPI 003: Cobertura de Tests

**Meta:** Mantener 98% en cálculos críticos
**Estado actual:** 98.29% en proyecto actual
**Verificar en:** FASE 7

---

## 🔗 Referencias

**Documentos relacionados:**

- [ESTADO-MIGRACION-MONOREPO.md](./ESTADO-MIGRACION-MONOREPO.md) - Estado actual
- [PLAN-MONOREPO.md](./PLAN-MONOREPO.md) - Plan original (929 líneas)
- [MIGRACION-REBRAND-CURETCORE.md](./MIGRACION-REBRAND-CURETCORE.md) - Plan de rebrand
- [INICIO-RAPIDO-MONOREPO.md](./INICIO-RAPIDO-MONOREPO.md) - Tutorial paso a paso

**Repositorios:**

- Producción actual: `/Users/ronaldopaulino/curet-importaciones/`
- Monorepo base: `/Users/ronaldopaulino/curet-monorepo/`
- Monorepo nuevo: https://github.com/curetcore/curetcore.git

---

**Este documento es el registro histórico de TODAS las decisiones tomadas.**
**Actualizar cada vez que se tome una decisión importante.**

**Última actualización:** 2025-01-22
