# 🏗️ Plan de Migración a Monorepo - Curet Design System

## 📋 Resumen Ejecutivo

**Objetivo:** Estandarizar diseño, tecnología y estructura entre todas las aplicaciones del ecosistema Curet mediante un sistema de diseño compartido (Design System) en arquitectura monorepo.

**Problema actual:**

- ❌ Cada nueva app requiere copiar/pegar componentes
- ❌ Cambios de diseño requieren actualizar múltiples proyectos
- ❌ Inconsistencia visual entre aplicaciones
- ❌ No hay single source of truth para UI/UX

**Solución propuesta:**

- ✅ Monorepo con Turborepo + pnpm workspaces
- ✅ Paquete `@curet/ui` con componentes compartidos
- ✅ Paquetes compartidos (database, utils, config)
- ✅ Apps independientes usando paquetes comunes

**Beneficios esperados:**

- 🚀 Nueva app lista en 5-10 minutos (vs 2-3 días)
- 🎨 Actualización de diseño global en segundos
- 📦 Reutilización de código: ~70% de código compartido
- ⚡ Builds incrementales 10-50x más rápidos con caché
- 🎯 Consistencia visual 100% entre apps

---

## 🎯 Estrategia de Implementación

**Approach seleccionado:** **Migración Mínima + Extracción Incremental**

### ¿Por qué NO esperar a terminar el proyecto?

1. **Evita refactor masivo:** Migrar ahora = 2 horas, migrar después = 2-3 días
2. **Aprendizaje orgánico:** Identificas componentes reutilizables mientras desarrollas
3. **Preparado para oportunidades:** Si surge otro proyecto, ya tienes la base
4. **Momentum:** El proyecto nunca estará "100% terminado"

### Principios de Migración

- ✅ **No romper nada:** App actual funciona exactamente igual
- ✅ **Incremental:** Extraer componentes solo cuando estén maduros
- ✅ **Pragmático:** Solo compartir lo que realmente se reutiliza
- ✅ **Sin sobre-ingeniería:** KISS (Keep It Simple, Stupid)

---

## 📅 Plan por Fases

### **FASE 1: Setup Monorepo Base** ⏱️ 2 horas | 🎯 Prioridad: CRÍTICA

> **Objetivo:** Crear estructura de monorepo sin cambiar código existente

**Estado:** [ ] Pendiente

#### 1.1 Preparación (15 min)

- [ ] Hacer commit de cambios actuales en `importaciones`

  ```bash
  git add .
  git commit -m "chore: Snapshot antes de migración a monorepo"
  git push origin claude/hola-014tf8tKCMUr8rF6TMBmTqK9
  ```

- [ ] Instalar `pnpm` globalmente

  ```bash
  npm install -g pnpm
  pnpm --version  # Verificar instalación
  ```

- [ ] Backup del proyecto actual
  ```bash
  cd /Users/ronaldopaulino
  cp -r curet-importaciones curet-importaciones.backup
  ```

#### 1.2 Crear Estructura Monorepo (30 min)

- [ ] Crear directorio raíz del monorepo

  ```bash
  cd /Users/ronaldopaulino
  mkdir curet-monorepo
  cd curet-monorepo
  ```

- [ ] Inicializar pnpm workspace

  ```bash
  pnpm init
  ```

- [ ] Crear estructura de carpetas

  ```bash
  mkdir -p apps packages
  ```

- [ ] Crear `pnpm-workspace.yaml`

  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
  ```

- [ ] Crear `turbo.json` (configuración base)
- [ ] Crear `.gitignore` raíz
- [ ] Actualizar `package.json` raíz con scripts

**Archivos a crear:** Ver Anexo A

#### 1.3 Migrar Proyecto Actual (30 min)

- [ ] Mover proyecto `curet-importaciones` a `apps/importaciones`

  ```bash
  mv ../curet-importaciones ./apps/importaciones
  ```

- [ ] Actualizar `apps/importaciones/package.json`
  - Cambiar `"name"` a `"@curet/importaciones"`
  - Agregar `"private": true`

- [ ] Instalar dependencias

  ```bash
  pnpm install
  ```

- [ ] Verificar que app funciona
  ```bash
  cd apps/importaciones
  pnpm dev
  # Abrir http://localhost:3000
  # Verificar que todo carga correctamente
  ```

#### 1.4 Configurar Turborepo (30 min)

- [ ] Instalar Turborepo

  ```bash
  cd /Users/ronaldopaulino/curet-monorepo
  pnpm add -D turbo
  ```

- [ ] Configurar pipeline en `turbo.json`
- [ ] Agregar scripts en `package.json` raíz
  - `pnpm dev`
  - `pnpm build`
  - `pnpm test`
  - `pnpm lint`

- [ ] Probar comandos de Turborepo
  ```bash
  pnpm dev  # Debe iniciar apps/importaciones
  ```

#### 1.5 Inicializar Git (15 min)

- [ ] Crear repositorio Git

  ```bash
  git init
  git add .
  git commit -m "feat: Migrar a monorepo estructura base"
  ```

- [ ] Crear nuevo repositorio en GitHub: `curet-monorepo`
- [ ] Conectar y push
  ```bash
  git remote add origin git@github.com:tu-usuario/curet-monorepo.git
  git push -u origin main
  ```

**✅ Criterios de éxito Fase 1:**

- [ ] `pnpm dev` inicia la app correctamente
- [ ] No hay errores en consola
- [ ] Todas las funcionalidades existentes funcionan
- [ ] Git inicializado con commit inicial

---

### **FASE 2: Desarrollo Normal** ⏱️ 2-3 semanas | 🎯 Prioridad: ALTA

> **Objetivo:** Continuar desarrollo del proyecto sin distracciones

**Estado:** [ ] Pendiente

#### Instrucciones de Trabajo

- [ ] Trabajar en `apps/importaciones` como de costumbre
- [ ] NO extraer componentes todavía
- [ ] Hacer commits normales
- [ ] Terminar features pendientes del README:
  - [ ] Validación Consistente
  - [ ] Backup Automático de Archivos
  - [ ] PostgreSQL Full-Text Search (si prioritario)

#### Identificar Candidatos a Extracción

Mientras desarrollas, **documentar** componentes que:

- ✅ Se usan 3+ veces sin modificación
- ✅ No tienen lógica de negocio específica
- ✅ Son visualmente estables (diseño final)
- ✅ Están bien tipados con TypeScript

**Crear lista de candidatos en:** `docs/COMPONENTES-PARA-EXTRAER.md`

**✅ Criterios de éxito Fase 2:**

- [ ] Features prioritarias completadas
- [ ] Lista de 10-20 componentes candidatos documentada
- [ ] App estable y testeada

---

### **FASE 3: Crear Paquete UI Base** ⏱️ 4-6 horas | 🎯 Prioridad: ALTA

> **Objetivo:** Crear `@curet/ui` con componentes base extraídos

**Estado:** [ ] Pendiente

#### 3.1 Setup del Paquete (1 hora)

- [ ] Crear estructura base

  ```bash
  cd packages
  mkdir ui
  cd ui
  pnpm init
  ```

- [ ] Crear estructura de carpetas

  ```bash
  mkdir -p src/{components,hooks,utils,styles}
  mkdir -p src/components/{ui,forms,layout}
  ```

- [ ] Configurar `package.json` del paquete
- [ ] Crear `tsconfig.json`
- [ ] Crear `tailwind.config.js` con tokens de diseño

**Archivos a crear:** Ver Anexo B

#### 3.2 Definir Design Tokens (1 hora)

- [ ] Crear `src/styles/tokens.ts` con:
  - [ ] Paleta de colores (primary, secondary, success, danger, etc.)
  - [ ] Tipografía (font family, sizes, weights)
  - [ ] Spacing scale (4px base)
  - [ ] Border radius
  - [ ] Shadows
  - [ ] Breakpoints

- [ ] Crear `src/styles/globals.css` con estilos base
- [ ] Documentar tokens en `README.md` del paquete

#### 3.3 Extraer Primeros 5 Componentes (2 horas)

**Componentes prioritarios:**

- [ ] **Button** - `src/components/ui/Button.tsx`
  - Copiar de `apps/importaciones/components/ui/button.tsx`
  - Limpiar lógica específica de negocio
  - Agregar variantes: primary, secondary, danger, ghost
  - Agregar sizes: sm, md, lg
  - Tipado completo con TypeScript

- [ ] **Card** - `src/components/ui/Card.tsx`
  - Componente base de tarjeta
  - Subcomponentes: CardHeader, CardContent, CardFooter

- [ ] **Input** - `src/components/forms/Input.tsx`
  - Input con label, error, hint
  - Integración con react-hook-form

- [ ] **Select** - `src/components/forms/Select.tsx`
  - Dropdown con búsqueda
  - Multi-select support

- [ ] **Modal** - `src/components/ui/Modal.tsx`
  - Modal base reutilizable
  - Overlay, close button, responsive

#### 3.4 Crear Exports Barrel (30 min)

- [ ] Crear `src/components/index.ts` con exports
- [ ] Crear `src/hooks/index.ts`
- [ ] Crear `src/utils/index.ts`
- [ ] Crear `src/index.ts` raíz

#### 3.5 Integrar en App (1 hora)

- [ ] Agregar dependencia en `apps/importaciones/package.json`

  ```json
  {
    "dependencies": {
      "@curet/ui": "workspace:*"
    }
  }
  ```

- [ ] Instalar dependencias

  ```bash
  pnpm install
  ```

- [ ] Reemplazar imports en 1-2 páginas de prueba

  ```tsx
  // ANTES
  import { Button } from "@/components/ui/button"

  // DESPUÉS
  import { Button } from "@curet/ui/components"
  ```

- [ ] Verificar que funciona correctamente
- [ ] Eliminar componentes duplicados de `apps/importaciones`

**✅ Criterios de éxito Fase 3:**

- [ ] Paquete `@curet/ui` funciona correctamente
- [ ] 5 componentes extraídos y funcionando
- [ ] App usa componentes del paquete sin errores
- [ ] Documentación básica del paquete creada

---

### **FASE 4: Extraer Más Paquetes** ⏱️ 6-8 horas | 🎯 Prioridad: MEDIA

> **Objetivo:** Crear paquetes compartidos de utilidades y configuración

**Estado:** [ ] Pendiente

#### 4.1 Paquete `@curet/utils` (2 horas)

- [ ] Crear estructura `packages/utils`
- [ ] Extraer utilidades de `apps/importaciones/lib/`:
  - [ ] `currency.ts` - Funciones de moneda (currency.js)
  - [ ] `date.ts` - Formateo de fechas (date-fns)
  - [ ] `export.ts` - Export Excel/PDF
  - [ ] `validators.ts` - Validaciones comunes
  - [ ] `format.ts` - Formatters (números, textos)

- [ ] Configurar exports
- [ ] Integrar en app
- [ ] Reemplazar imports

#### 4.2 Paquete `@curet/database` (2 horas)

- [ ] Crear estructura `packages/database`
- [ ] Mover Prisma schema a paquete compartido

  ```bash
  mv apps/importaciones/prisma packages/database/prisma
  ```

- [ ] Crear cliente Prisma compartido

  ```typescript
  // packages/database/src/client.ts
  export * from "@prisma/client"
  export { prisma } from "./prisma-client"
  ```

- [ ] Configurar scripts de migración
- [ ] Actualizar `apps/importaciones` para usar paquete

**Nota:** Este paso es opcional si cada app tendrá su propia BD

#### 4.3 Paquete `@curet/config` (2 horas)

- [ ] Crear estructura `packages/config`
- [ ] Extraer configuraciones compartidas:
  - [ ] `eslint/index.js` - ESLint config base
  - [ ] `tailwind/index.js` - Tailwind config base
  - [ ] `typescript/base.json` - TSConfig base
  - [ ] `typescript/nextjs.json` - TSConfig para Next.js

- [ ] Configurar como paquete
- [ ] Actualizar `apps/importaciones` para extender configs

#### 4.4 Paquete `@curet/logger` (1 hora)

- [ ] Crear estructura `packages/logger`
- [ ] Mover `lib/logger.ts` al paquete
- [ ] Configurar Winston centralizado
- [ ] Integrar en app

**✅ Criterios de éxito Fase 4:**

- [ ] 4 paquetes compartidos creados
- [ ] App usa todos los paquetes correctamente
- [ ] Código duplicado eliminado
- [ ] Documentación de cada paquete creada

---

### **FASE 5: Extracción Masiva de UI** ⏱️ 8-12 horas | 🎯 Prioridad: MEDIA

> **Objetivo:** Migrar todos los componentes reutilizables a `@curet/ui`

**Estado:** [ ] Pendiente

#### Componentes a Extraer (por categoría)

**UI Básicos** (3 horas):

- [ ] Badge
- [ ] Tooltip
- [ ] Spinner/Loader
- [ ] Alert
- [ ] Toast (Sonner configurado)
- [ ] Skeleton
- [ ] Separator
- [ ] Avatar

**Forms** (3 horas):

- [ ] Textarea
- [ ] Checkbox
- [ ] Radio
- [ ] Switch
- [ ] DatePicker
- [ ] FileUpload (con Dropzone)
- [ ] FormField wrapper

**Tablas y Datos** (3 horas):

- [ ] DataTable (react-table configurado)
- [ ] Pagination
- [ ] DataTableToolbar
- [ ] DataTableFilters
- [ ] EmptyState

**Layout** (2 horas):

- [ ] Container
- [ ] Grid
- [ ] Stack
- [ ] Divider

**Navegación** (1 hora):

- [ ] Tabs
- [ ] Breadcrumb
- [ ] Dropdown Menu

#### Para Cada Componente:

1. [ ] Copiar de `apps/importaciones`
2. [ ] Limpiar lógica de negocio específica
3. [ ] Mejorar tipado TypeScript
4. [ ] Agregar props documentation (JSDoc)
5. [ ] Crear archivo de tests básico
6. [ ] Actualizar exports
7. [ ] Reemplazar en app
8. [ ] Eliminar versión antigua

**✅ Criterios de éxito Fase 5:**

- [ ] 25-30 componentes extraídos
- [ ] Coverage de componentes >80%
- [ ] Todos los componentes documentados
- [ ] App funciona 100% con paquetes compartidos

---

### **FASE 6: Crear Segunda App** ⏱️ 2-4 horas | 🎯 Prioridad: ALTA

> **Objetivo:** Validar el sistema creando una nueva app desde cero

**Estado:** [ ] Pendiente

#### Opciones de Segunda App:

**Opción A: Inventario (recomendada)**

- Gestión de stock y almacenes
- Usa mismos componentes de tablas
- Comparte lógica de productos

**Opción B: Facturación**

- Sistema de facturación e invoicing
- Usa componentes de formularios
- Comparte utilidades de moneda

**Opción C: CRM Simple**

- Gestión de clientes y proveedores
- Usa componentes de tablas y forms
- Comparte database (Proveedores)

#### Pasos:

- [ ] Crear nueva app

  ```bash
  cd apps
  pnpx create-next-app@latest nueva-app --typescript --tailwind --app
  ```

- [ ] Configurar `package.json`

  ```json
  {
    "name": "@curet/nueva-app",
    "dependencies": {
      "@curet/ui": "workspace:*",
      "@curet/utils": "workspace:*",
      "@curet/config": "workspace:*"
    }
  }
  ```

- [ ] Instalar dependencias

  ```bash
  pnpm install
  ```

- [ ] Configurar Tailwind extendiendo de `@curet/config`
- [ ] Crear layout base usando componentes compartidos
- [ ] Implementar 2-3 páginas básicas
- [ ] Verificar consistencia visual con `importaciones`

#### Medición de Éxito:

- [ ] **Tiempo de setup:** ¿Cuánto tardaste? (objetivo: <30 min)
- [ ] **Reutilización:** ¿% de componentes compartidos? (objetivo: >70%)
- [ ] **Consistencia:** ¿Se ve idéntico a importaciones? (sí/no)
- [ ] **Developer Experience:** ¿Fue fácil? (escala 1-10)

**✅ Criterios de éxito Fase 6:**

- [ ] Nueva app funcionando en <1 hora
- [ ] > 70% código compartido
- [ ] Look & feel idéntico a app original
- [ ] Cero bugs relacionados con componentes compartidos

---

### **FASE 7: Optimización y Tooling** ⏱️ 4-6 horas | 🎯 Prioridad: BAJA

> **Objetivo:** Mejorar DX (Developer Experience) y documentación

**Estado:** [ ] Pendiente

#### 7.1 Storybook (3 horas)

- [ ] Instalar Storybook en `packages/ui`

  ```bash
  cd packages/ui
  npx storybook@latest init
  ```

- [ ] Crear stories para cada componente
  - Ejemplo: `Button.stories.tsx`
  - Mostrar todas las variantes
  - Props playground

- [ ] Configurar Storybook con Tailwind
- [ ] Deploy Storybook a Vercel/Netlify (público o privado)

**Beneficio:** Catálogo visual de todos los componentes

#### 7.2 Testing (2 horas)

- [ ] Configurar Jest en `packages/ui`
- [ ] Crear tests para componentes críticos:
  - [ ] Button
  - [ ] Input
  - [ ] DataTable
  - [ ] Modal

- [ ] Configurar CI para ejecutar tests en PRs

#### 7.3 Changelog y Versionado (1 hora)

- [ ] Configurar `changesets` para versioning

  ```bash
  pnpm add -D @changesets/cli
  pnpm changeset init
  ```

- [ ] Crear proceso de release
- [ ] Documentar en `CONTRIBUTING.md`

**✅ Criterios de éxito Fase 7:**

- [ ] Storybook funcionando y deployado
- [ ] Tests con >60% coverage
- [ ] Proceso de versionado establecido

---

### **FASE 8: Documentación Final** ⏱️ 3-4 horas | 🎯 Prioridad: ALTA

> **Objetivo:** Documentar todo el sistema para uso futuro

**Estado:** [ ] Pendiente

#### Documentos a Crear:

- [ ] **README.md raíz**
  - Overview del monorepo
  - Estructura de carpetas
  - Cómo empezar
  - Scripts disponibles

- [ ] **packages/ui/README.md**
  - Guía de uso del Design System
  - Instalación
  - Ejemplos de componentes
  - Design tokens
  - Best practices

- [ ] **docs/DESIGN-SYSTEM.md**
  - Filosofía de diseño
  - Paleta de colores
  - Tipografía
  - Spacing y layout
  - Componentes disponibles

- [ ] **docs/MONOREPO-GUIDE.md**
  - Cómo crear nueva app
  - Cómo agregar nuevo paquete
  - Cómo actualizar componentes compartidos
  - Troubleshooting común

- [ ] **docs/CONTRIBUTING.md**
  - Cómo contribuir
  - Estándares de código
  - Process de PR
  - Testing requirements

**✅ Criterios de éxito Fase 8:**

- [ ] Documentación completa y clara
- [ ] Nuevos desarrolladores pueden empezar sin ayuda
- [ ] Todos los componentes documentados

---

## 📊 Métricas de Éxito

### KPIs del Proyecto

| Métrica                    | Antes    | Meta             | Cómo Medir                          |
| -------------------------- | -------- | ---------------- | ----------------------------------- |
| **Tiempo crear nueva app** | 2-3 días | <1 hora          | Cronometrar creación de segunda app |
| **Código compartido**      | 0%       | >70%             | Análisis de líneas de código        |
| **Tiempo de build**        | 120s     | <10s (con caché) | `time turbo run build`              |
| **Consistencia visual**    | 60%      | 100%             | Audit manual de componentes         |
| **Developer Satisfaction** | -        | 8/10             | Encuesta al equipo                  |

### Checklist de Validación Final

Antes de considerar el proyecto "completo":

- [ ] **Funcional:**
  - [ ] Al menos 2 apps funcionando en producción
  - [ ] Paquete UI con >25 componentes
  - [ ] 3+ paquetes compartidos operativos

- [ ] **Técnico:**
  - [ ] Builds incrementales funcionando (caché hit >80%)
  - [ ] Tests corriendo en CI
  - [ ] Zero TypeScript errors
  - [ ] Zero console warnings

- [ ] **UX:**
  - [ ] Todas las apps tienen look idéntico
  - [ ] Componentes responsive en mobile
  - [ ] Accesibilidad básica (contraste, keyboard nav)

- [ ] **Documentación:**
  - [ ] README completo en cada paquete
  - [ ] Guías de uso escritas
  - [ ] Storybook deployado (opcional pero recomendado)

- [ ] **DevOps:**
  - [ ] CI/CD configurado
  - [ ] Deploys automáticos funcionando
  - [ ] Monitoring básico activo

---

## 🚧 Riesgos y Mitigación

### Riesgos Identificados

**1. Sobre-complejidad temprana**

- **Riesgo:** Crear demasiados paquetes/abstracciones innecesarias
- **Mitigación:** Regla de 3 - Solo extraer cuando se usa 3+ veces
- **Severidad:** Media

**2. Romper app existente**

- **Riesgo:** Migración introduce bugs en producción
- **Mitigación:** Migración incremental + testing exhaustivo
- **Severidad:** Alta

**3. Pérdida de momentum**

- **Riesgo:** Proyecto muy largo, se abandona a mitad
- **Mitigación:** Fases cortas con wins tempranos
- **Severidad:** Media

**4. Curva de aprendizaje**

- **Riesgo:** Turborepo/monorepo nuevo para el equipo
- **Mitigación:** Documentación clara + pair programming
- **Severidad:** Baja

**5. Performance en desarrollo**

- **Riesgo:** Monorepo lento con muchos paquetes
- **Mitigación:** Turborepo + caché + filtros correctos
- **Severidad:** Baja

---

## 📚 Recursos y Referencias

### Documentación Oficial

- [Turborepo Docs](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)

### Ejemplos Reales

- [Vercel Turborepo Examples](https://github.com/vercel/turbo/tree/main/examples)
- [Shadcn UI](https://github.com/shadcn/ui) - Arquitectura similar
- [Cal.com Monorepo](https://github.com/calcom/cal.com) - Producción real

### Inspiración de Design Systems

- [Shopify Polaris](https://polaris.shopify.com/)
- [Stripe Design System](https://stripe.com/docs/design)
- [Vercel Design](https://vercel.com/design)
- [Radix UI](https://www.radix-ui.com/)

---

## 🗓️ Timeline Estimado

### Escenario Conservador (tiempo parcial)

```
Semana 1: FASE 1 (Setup Monorepo)           [███████░░░] Día 1-2
Semana 2-3: FASE 2 (Desarrollo Normal)      [███████░░░] Continuo
Semana 4: FASE 3 (Paquete UI Base)          [███████░░░] Día 22-23
Semana 5: FASE 4 (Más Paquetes)             [███████░░░] Día 29-30
Semana 6: FASE 5 (Extracción Masiva)        [███████░░░] Día 36-38
Semana 7: FASE 6 (Segunda App)              [███████░░░] Día 43-44
Semana 8: FASE 7-8 (Optimización + Docs)    [███████░░░] Día 50-52

TOTAL: ~8 semanas (tiempo parcial, 1-2h/día)
```

### Escenario Agresivo (tiempo completo)

```
Día 1: FASE 1 (Setup)
Día 2-10: FASE 2 (Desarrollo features)
Día 11: FASE 3 (UI Base)
Día 12: FASE 4 (Paquetes)
Día 13-14: FASE 5 (Extracción masiva)
Día 15: FASE 6 (Segunda app)
Día 16-17: FASE 7-8 (Optimización + Docs)

TOTAL: ~17 días de trabajo (8h/día)
```

---

## 🎯 Próximos Pasos Inmediatos

### Esta Semana

1. [ ] **HOY:** Hacer commit de cambios actuales
2. [ ] **HOY:** Ejecutar FASE 1 completa (2 horas)
3. [ ] **Mañana:** Verificar que todo funciona correctamente
4. [ ] **Resto de semana:** Continuar desarrollo normal (FASE 2)

### Próxima Semana

1. [ ] Terminar features pendientes de importaciones
2. [ ] Documentar componentes candidatos a extracción
3. [ ] Preparar FASE 3 (crear paquete UI)

### Mes 1

1. [ ] Completar FASES 1-4
2. [ ] Tener paquete UI básico funcionando
3. [ ] App actual usando componentes compartidos

---

## 📝 Notas y Decisiones

### Decisiones de Arquitectura

**1. ¿Monorepo vs Multi-repo?**

- **Decisión:** Monorepo
- **Razón:** Sincronización de cambios, refactors atómicos, mejor DX
- **Fecha:** 2025-11-18

**2. ¿Turborepo vs Nx vs Lerna?**

- **Decisión:** Turborepo
- **Razón:** Mejor para ecosistema Next.js, más simple, caché superior
- **Fecha:** 2025-11-18

**3. ¿pnpm vs npm vs yarn?**

- **Decisión:** pnpm
- **Razón:** Más rápido, ahorra espacio, workspaces nativos
- **Fecha:** 2025-11-18

**4. ¿Extraer Prisma a paquete compartido?**

- **Decisión:** Pendiente
- **Consideración:** Depende de si apps compartirán BD o tendrán propias
- **Revisar en:** FASE 4

**5. ¿Storybook opcional o requerido?**

- **Decisión:** Opcional (FASE 7)
- **Razón:** Nice to have pero no bloqueante
- **Fecha:** 2025-11-18

---

## 📞 Soporte y Contacto

### ¿Dudas Durante la Implementación?

- **Documentación:** Este archivo + docs/MONOREPO-GUIDE.md (crear en FASE 8)
- **Ejemplos:** Ver carpeta `examples/` cuando se cree
- **Issues:** GitHub Issues del monorepo

### Checklist de Troubleshooting

Si algo no funciona:

1. [ ] ¿Ejecutaste `pnpm install` en la raíz?
2. [ ] ¿Los imports usan `@curet/...` correctamente?
3. [ ] ¿El paquete está en `pnpm-workspace.yaml`?
4. [ ] ¿El `package.json` tiene `"workspace:*"` en dependencies?
5. [ ] ¿Ejecutaste `turbo run build` para rebuilds?
6. [ ] ¿Limpiaste caché con `turbo run clean`?

---

## ✅ Estado del Plan

**Última actualización:** 2025-11-18
**Versión del plan:** 1.0.0
**Estado general:** [ ] No iniciado

### Progreso por Fase

```
[░░░░░░░░░░] FASE 1: Setup Monorepo (0%)
[░░░░░░░░░░] FASE 2: Desarrollo Normal (0%)
[░░░░░░░░░░] FASE 3: Paquete UI Base (0%)
[░░░░░░░░░░] FASE 4: Más Paquetes (0%)
[░░░░░░░░░░] FASE 5: Extracción Masiva (0%)
[░░░░░░░░░░] FASE 6: Segunda App (0%)
[░░░░░░░░░░] FASE 7: Optimización (0%)
[░░░░░░░░░░] FASE 8: Documentación (0%)
─────────────────────────────────────
[░░░░░░░░░░] TOTAL: 0/8 fases (0%)
```

---

## 📎 Anexos

### Anexo A: Archivos de Configuración FASE 1

Ver ejemplos completos en: `docs/anexos/monorepo-configs.md` (crear durante implementación)

**Archivos a crear:**

- `turbo.json`
- `pnpm-workspace.yaml`
- `package.json` (raíz)
- `.gitignore`
- `README.md` (raíz)

### Anexo B: Estructura Paquete UI

Ver estructura detallada en: `docs/anexos/ui-package-structure.md` (crear durante implementación)

**Archivos a crear:**

- `package.json`
- `tsconfig.json`
- `tailwind.config.js`
- `src/index.ts`
- Componentes base

---

**🚀 ¡Listo para empezar! El futuro de Curet empieza aquí.**
