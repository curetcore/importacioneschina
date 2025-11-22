# 🔄 Estado de Migración al Monorepo CuretCore

**Proyecto:** Migración de `curet-importaciones` → `curetcore` (monorepo)
**Repositorio nuevo:** https://github.com/curetcore/curetcore.git
**Fecha inicio:** 2025-01-22
**Última actualización:** 2025-01-22

---

## 📊 Progreso General

```
FASE 0: Documentación y Tracking  [██████████] 100% ✅ COMPLETADA
FASE 1: Git Remote y Estructura   [░░░░░░░░░░]   0% ⏸️ PENDIENTE
FASE 2: Rebrand Completo          [░░░░░░░░░░]   0% ⏸️ PENDIENTE
FASE 3: Migración Documentación   [░░░░░░░░░░]   0% ⏸️ PENDIENTE
FASE 4: Componentes Críticos      [░░░░░░░░░░]   0% ⏸️ PENDIENTE
FASE 5: Componentes Restantes     [░░░░░░░░░░]   0% ⏸️ PENDIENTE
FASE 6: Utils, Hooks, Database    [░░░░░░░░░░]   0% ⏸️ PENDIENTE
FASE 7: Validación y Tests        [░░░░░░░░░░]   0% ⏸️ PENDIENTE
────────────────────────────────────────────────
TOTAL GENERAL:                    [█░░░░░░░░░]  10% 🚧 EN PROGRESO
```

**Timeline estimado:** 5-7 días (modo sprint)
**Días completados:** 0
**Días restantes:** 5-7

---

## 🎯 Fase Actual: FASE 0

### FASE 0: Documentación y Tracking ✅

**Duración:** 30 minutos
**Estado:** ✅ COMPLETADA

**Tareas completadas:**

- [x] Crear `docs/ESTADO-MIGRACION-MONOREPO.md` (este archivo)
- [x] Crear `docs/DECISIONES-MONOREPO.md`
- [x] Inicializar TodoList con todas las fases
- [x] Documentar estrategia completa

**Entregables:**

- ✅ Sistema de tracking activo
- ✅ Documentación de decisiones
- ✅ Plan por fases documentado

---

## 📅 Fases Detalladas

### FASE 1: Git Remote y Estructura Base ⏸️

**Duración estimada:** 2-3 horas
**Estado:** ⏸️ PENDIENTE
**Dependencias:** FASE 0 ✅

**Tareas:**

- [ ] Clonar `/curet-monorepo/` existente como base
- [ ] Configurar Git remote: `git remote add origin https://github.com/curetcore/curetcore.git`
- [ ] Verificar estructura de directorios
- [ ] Crear `.gitignore` apropiado
- [ ] Crear README.md raíz (básico)
- [ ] Push inicial a GitHub

**Entregables esperados:**

- Monorepo en GitHub con estructura base
- Remote configurado correctamente
- Branches: `main` (protegido), `develop`

---

### FASE 2: Rebrand Completo ⏸️

**Duración estimada:** 4-6 horas
**Estado:** ⏸️ PENDIENTE
**Dependencias:** FASE 1

**Tareas:**

- [ ] Actualizar `package.json` raíz (name: `@curetcore/platform`)
- [ ] Renombrar packages: `@curet/*` → `@curetcore/*`
- [ ] Actualizar apps/importaciones/package.json
- [ ] Renombrar assets (logotipos sin "-importacion")
- [ ] Actualizar referencias en código
- [ ] Actualizar turbo.json, pnpm-workspace.yaml
- [ ] Buscar y reemplazar "Sistema de Importaciones" → "CuretCore Platform"

**Archivos críticos a modificar:**

- `package.json` (raíz)
- `packages/ui/package.json`
- `packages/utils/package.json`
- `packages/config/package.json`
- `packages/logger/package.json`
- `apps/importaciones/package.json`
- Todos los componentes con referencias

**Entregables esperados:**

- Todo el código con branding `@curetcore/*`
- Assets renombrados
- 0 referencias a nombres antiguos

---

### FASE 3: Migración de Documentación ⏸️

**Duración estimada:** 2-3 horas
**Estado:** ⏸️ PENDIENTE
**Dependencias:** FASE 2

**Tareas:**

- [ ] Identificar docs GLOBALES vs ESPECÍFICAS
- [ ] Migrar docs globales a `/docs/` raíz del monorepo
- [ ] Migrar docs específicas a `apps/importaciones/docs/`
- [ ] Actualizar INDEX.md
- [ ] Actualizar referencias cruzadas entre docs
- [ ] Crear `apps/importaciones/README.md`

**Documentación a migrar:**

**GLOBAL (→ `/docs/`):**

- Arquitectura y robustez
- Testing general
- Monorepo (PLAN-MONOREPO.md, etc.)
- Optimización
- Shopify integration
- Seguridad API

**ESPECÍFICA (→ `apps/importaciones/docs/`):**

- Lógica de negocio
- Distribución de costos
- Pagos y tarjetas
- Configuración dinámica
- Features completadas

**Entregables esperados:**

- Documentación organizada correctamente
- README.md completo en raíz
- README.md de app importaciones

---

### FASE 4: Componentes Críticos ⏸️

**Duración estimada:** 8-10 horas
**Estado:** ⏸️ PENDIENTE
**Dependencias:** FASE 3

**Tareas:**

- [ ] Extraer DataTable → packages/ui/src/components/tables/
- [ ] Extraer VirtualizedDataTable → packages/ui/src/components/tables/
- [ ] Extraer StatCard → packages/ui/src/components/layout/
- [ ] Extraer StatsGrid → packages/ui/src/components/layout/
- [ ] Extraer Dialog → packages/ui/src/components/ui/
- [ ] Extraer Select → packages/ui/src/components/forms/
- [ ] Extraer Textarea → packages/ui/src/components/forms/
- [ ] Actualizar dependencias de packages/ui
- [ ] Actualizar imports en apps/importaciones
- [ ] Probar que todo funciona

**Componentes (7 críticos = 60% del valor):**

1. data-table.tsx ⭐
2. virtualized-data-table.tsx ⭐
3. stat-card.tsx ⭐
4. stats-grid.tsx ⭐
5. dialog.tsx
6. select.tsx
7. textarea.tsx

**Entregables esperados:**

- 7 componentes críticos en packages/ui
- Apps/importaciones usando componentes desde packages
- 0 errores en build

---

### FASE 5: Componentes Restantes ⏸️

**Duración estimada:** 12-16 horas
**Estado:** ⏸️ PENDIENTE
**Dependencias:** FASE 4

**Tareas:**

- [ ] Extraer 29 componentes restantes de UI
- [ ] Organizar en carpetas: forms/, tables/, layout/, ui/
- [ ] Actualizar exports en packages/ui/src/components/index.ts
- [ ] Eliminar componentes duplicados de apps/importaciones
- [ ] Actualizar todos los imports
- [ ] Probar cada categoría de componentes

**Componentes restantes (29):**

- Forms (8): multi-select, datepicker, file-upload, dropdown-menu, popover, slider, command-palette, confirm-dialog
- Layout (10): pagination, tabs, skeleton, toast, detail-navigation, editing-banner, cascade-delete-dialog, rename-attachment-modal, file-preview-modal, pdf-thumbnail
- Specialized (11): airtable-table, attachments-list, add-attachments-dialog, cbm-calculator, size-distribution-input, etc.

**Entregables esperados:**

- TODOS los 36 componentes en packages/ui
- Estructura organizada por categorías
- 100% de imports actualizados

---

### FASE 6: Utils, Hooks y Database ⏸️

**Duración estimada:** 8-10 horas
**Estado:** ⏸️ PENDIENTE
**Dependencias:** FASE 5

**Tareas:**

- [ ] Migrar hooks a packages/ui/src/hooks/
- [ ] Implementar packages/utils con funciones reales
- [ ] Crear packages/database con Prisma
- [ ] Crear shared configs (eslint, tsconfig, tailwind)
- [ ] Actualizar todas las referencias
- [ ] Probar que todo funciona

**Hooks a migrar:**

- useDebounce
- useToast
- usePusher
- usePermissions
- useModuleConfig
- etc.

**Utils a implementar:**

- calculations.ts → packages/utils/src/formatters/
- cost-distribution.ts → packages/utils/src/helpers/
- export-utils.ts → packages/utils/src/helpers/
- validations.ts → packages/utils/src/validators/

**Entregables esperados:**

- Hooks compartidos funcionando
- Utils implementados con funciones reales
- Database package configurado
- Shared configs listos

---

### FASE 7: Validación y Tests ⏸️

**Duración estimada:** 6-8 horas
**Estado:** ⏸️ PENDIENTE
**Dependencias:** FASE 6

**Tareas:**

- [ ] Build del monorepo completo (sin errores)
- [ ] Lint passing
- [ ] Type-check passing
- [ ] Tests unitarios (Jest)
- [ ] Tests E2E (Playwright)
- [ ] Validar que apps/importaciones funciona 100%
- [ ] Verificar 0 componentes duplicados
- [ ] Crear Storybook básico
- [ ] Documentación final (READMEs)
- [ ] Commit final y push

**Criterios de éxito:**

- ✅ Build < 30s (con caché)
- ✅ 0 warnings
- ✅ 0 errores de TypeScript
- ✅ >70% código compartido
- ✅ Todos los tests passing
- ✅ App funciona idéntica a producción actual

**Entregables esperados:**

- Monorepo 100% funcional
- Documentación completa
- Tests passing
- Listo para deploy a producción

---

## 🔄 Sesiones de Trabajo

### Sesión 1 - 2025-01-22

**Tiempo:** 30 minutos
**Fase completada:** FASE 0 ✅

**Trabajo realizado:**

- Creado sistema de tracking completo
- Documentadas todas las decisiones tomadas
- Plan por fases detallado
- TodoList inicializado

**Próxima sesión:**

- Empezar FASE 1: Git Remote y Estructura Base

**Notas:**

- Usuario creó repositorio: https://github.com/curetcore/curetcore.git
- Estrategia: Construcción en paralelo (no tocar producción hasta FASE 7)
- Modo: Sprint (8h/día, 5-7 días totales)

---

## 📝 Notas Importantes

### Estrategia de Migración

**CRÍTICO:** El proyecto actual está en producción. La estrategia es:

1. **DÍA 1-6:** Construir monorepo en paralelo
   - `/curet-importaciones/` → Producción (NO TOCAR)
   - `/curetcore/` → Monorepo nuevo (construir aquí)

2. **DÍA 7:** Validación total
   - Probar TODO localmente
   - Confirmar que funciona 100%

3. **DÍA 8:** Switch a producción
   - Deploy desde nuevo repo
   - Monitoreo intensivo
   - Rollback plan listo

### Ubicaciones de Trabajo

```
PRODUCCIÓN (NO TOCAR):
/Users/ronaldopaulino/curet-importaciones/

MONOREPO BASE (REFERENCIA):
/Users/ronaldopaulino/curet-monorepo/

MONOREPO NUEVO (CONSTRUIR AQUÍ):
/Users/ronaldopaulino/curetcore/
```

### Backups

Antes de cualquier cambio en producción:

- [ ] Backup de base de datos
- [ ] Snapshot del servidor Contabo
- [ ] Branch de backup en Git

---

## ✅ Checklist de Completitud

### Pre-Switch a Producción

- [ ] Todas las fases completadas (1-7)
- [ ] Build exitoso sin warnings
- [ ] Tests passing (unit + E2E)
- [ ] Documentación completa
- [ ] App funciona localmente idéntica a producción
- [ ] Backups creados
- [ ] Rollback plan documentado
- [ ] Aprobación para switch

### Post-Switch

- [ ] Deploy exitoso
- [ ] Login funciona
- [ ] Dashboard carga datos
- [ ] Crear OC funciona
- [ ] Uploads funcionan
- [ ] Pusher/notificaciones funcionan
- [ ] Exports (PDF/Excel) funcionan
- [ ] Logs sin errores críticos

---

## 🆘 Rollback Plan

Si algo falla durante el switch:

1. **Rollback en EasyPanel:**
   - Cambiar source repo a `curet-importaciones`
   - Redeploy

2. **Verificar:**
   - App vuelve a funcionar
   - Base de datos intacta

3. **Analizar:**
   - Revisar logs del error
   - Corregir en monorepo
   - Re-validar antes de nuevo intento

---

**Este documento es el SOURCE OF TRUTH del estado de la migración.**
**Actualizar después de cada sesión de trabajo.**

**Última actualización:** 2025-01-22 - FASE 0 completada
