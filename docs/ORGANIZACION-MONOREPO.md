# 📁 Organización de Documentación - Preparación Monorepo

> **Propósito:** Mantener la documentación organizada y preparada para la migración a monorepo
> **Última actualización:** 2025-11-22

---

## 🗂️ Estructura Actual vs Futura

### **Estado Actual (Single App)**

```
curet-importaciones/
├── docs/
│   ├── CURETCORE-ARCHITECTURE.md
│   ├── SEGURIDAD-API-AUTHENTICATION.md  ← 🆕
│   ├── PLAN-MONOREPO.md
│   └── ...
├── app/
├── lib/
└── README.md
```

### **Estado Futuro (Monorepo)**

```
curetcore-monorepo/
├── apps/
│   ├── importaciones/
│   │   ├── docs/                      ← Docs específicos de importaciones
│   │   └── app/
│   ├── inventario/
│   ├── tesoreria/
│   └── contabilidad/
├── packages/
│   ├── ui/                             ← Componentes compartidos
│   ├── database/                       ← Schemas Prisma compartidos
│   └── auth/                           ← Lógica de autenticación compartida
└── docs/
    ├── ARCHITECTURE.md                 ← Arquitectura global
    ├── SECURITY.md                     ← Políticas de seguridad
    └── modules/
        ├── importaciones.md
        ├── inventario.md
        └── ...
```

---

## 📊 Categorización de Documentación

### **🟦 Documentación Global (Mover a /docs raíz en monorepo)**

Aplica a todos los módulos del ecosistema:

- `CURETCORE-ARCHITECTURE.md` - Arquitectura completa
- `SEGURIDAD-API-AUTHENTICATION.md` - Políticas de seguridad
- `PLAN-MONOREPO.md` - Plan de migración
- `MONOREPO-CONFIGS.md` - Configuraciones compartidas
- `DATA-INTEGRATION-ARCHITECTURE.md` - Integridad de datos entre módulos

### **🟩 Documentación de Módulo Importaciones**

Específico del módulo de importaciones:

- `DISTRIBUCION-GASTOS-PROPORCIONAL.md` - Lógica de distribución de costos
- `GUIA-DISTRIBUCION-COSTOS.md` - Guía de costos (legacy)
- `AIRTABLE-VS-CURETCORE-COMPARISON.md` - Comparación con Airtable
- `AIRTABLE-MIGRATION-PLAN.md` - Plan de migración desde Airtable

### **🟨 Documentación de Integración Shopify**

Cross-module (afecta Inventario + Ventas + Importaciones):

- `SHOPIFY-INTEGRATION.md` - Integración completa
- `CUADRES-Y-TESORERIA.md` - Cuadres de caja

### **🟪 Documentación de UI/UX (Compartida)**

Aplica a todos los módulos que usen el design system:

- `SHOPIFY-DESIGN-SYSTEM-AUDIT.md` - Componentes Shopify Admin
- `FEEDBACK-VISUAL-PLAN.md` - Plan de mejoras visuales
- `UI-IMPROVEMENT-PLAN.md` - Plan de mejoras de UI

### **⚙️ Documentación Técnica (Compartida)**

Infraestructura y herramientas compartidas:

- `GUIA-MIGRACION.md` - Migración de BD
- `BACKUP-LOCAL.md` - Backups automáticos
- `FULL-TEXT-SEARCH.md` - FTS con PostgreSQL
- `REDIS-EASYPANEL-SETUP.md` - Redis para caché
- `RATE-LIMIT-USAGE.md` - Rate limiting
- `LOGGER-USAGE.md` - Sistema de logging
- `AUDIT-LOG-USAGE.md` - Audit logs

### **📋 Documentación de Proceso**

Meta-documentación sobre desarrollo:

- `COMPLETED-FEATURES.md` - Features completadas (por módulo)
- `CHANGELOG.md` - Historial de cambios (por módulo)
- `PLANES-FUTUROS.md` - Roadmap (global)

---

## 🔄 Plan de Migración de Docs

### **Fase 1: Preparación (Ahora)**

- [x] Crear `ORGANIZACION-MONOREPO.md`
- [x] Categorizar documentación existente
- [x] Identificar docs globales vs módulo-específicos
- [ ] Crear índice maestro de documentación

### **Fase 2: Durante Migración a Monorepo**

```bash
# Mover docs globales
mv docs/CURETCORE-ARCHITECTURE.md ../curetcore-monorepo/docs/
mv docs/SEGURIDAD-API-AUTHENTICATION.md ../curetcore-monorepo/docs/security/

# Mantener docs específicos del módulo
# (ya están en apps/importaciones/docs/)

# Crear symlinks si es necesario para referencias cruzadas
```

### **Fase 3: Post-Migración**

- [ ] Actualizar todos los links entre documentos
- [ ] Crear script de validación de links rotos
- [ ] Generar sitio web de documentación (opcional - VitePress/Docusaurus)

---

## 📚 Índice Maestro de Documentación

### **Por Categoría:**

<details>
<summary><strong>🏗️ Arquitectura y Planificación</strong></summary>

- Global
  - `CURETCORE-ARCHITECTURE.md` - Arquitectura del ecosistema
  - `PLAN-MONOREPO.md` - Plan de migración a monorepo
  - `MONOREPO-CONFIGS.md` - Configuraciones
  - `DATA-INTEGRATION-ARCHITECTURE.md` - Integridad de datos

</details>

<details>
<summary><strong>🔐 Seguridad</strong></summary>

- Global
  - `SEGURIDAD-API-AUTHENTICATION.md` - Autenticación de APIs
  - `API-ERROR-HANDLER-USAGE.md` - Manejo de errores
  - `RATE-LIMIT-USAGE.md` - Rate limiting

</details>

<details>
<summary><strong>🔄 Integraciones</strong></summary>

- Shopify
  - `SHOPIFY-INTEGRATION.md` - Integración completa
  - `CUADRES-Y-TESORERIA.md` - Cuadres de caja

</details>

<details>
<summary><strong>📊 Módulo Importaciones</strong></summary>

- Lógica de Negocio
  - `DISTRIBUCION-GASTOS-PROPORCIONAL.md` - Distribución de costos
  - `GUIA-DISTRIBUCION-COSTOS.md` - Guía legacy
- Migración
  - `AIRTABLE-VS-CURETCORE-COMPARISON.md`
  - `AIRTABLE-MIGRATION-PLAN.md`

</details>

<details>
<summary><strong>🎨 UI/UX</strong></summary>

- Design System
  - `SHOPIFY-DESIGN-SYSTEM-AUDIT.md`
  - `UI-IMPROVEMENT-PLAN.md`
- Mejoras Planificadas
  - `FEEDBACK-VISUAL-PLAN.md`

</details>

<details>
<summary><strong>⚙️ Infraestructura</strong></summary>

- Base de Datos
  - `GUIA-MIGRACION.md`
  - `FULL-TEXT-SEARCH.md`
- Caché y Performance
  - `REDIS-EASYPANEL-SETUP.md`
- Backups
  - `BACKUP-LOCAL.md`
- Logging y Auditoría
  - `LOGGER-USAGE.md`
  - `AUDIT-LOG-USAGE.md`

</details>

<details>
<summary><strong>📋 Gestión de Proyecto</strong></summary>

- Historial
  - `COMPLETED-FEATURES.md`
  - `CHANGELOG.md`
- Futuro
  - `PLANES-FUTUROS.md`
  - `SPRINT-*.md` (varios sprints documentados)

</details>

---

## 🎯 Reglas de Documentación

### **Para Nuevas Features:**

1. **Documentar ANTES de implementar** (design docs)
2. **Actualizar README** con link a nueva doc
3. **Clasificar correctamente** (global vs módulo-específico)
4. **Usar plantilla estándar:**

```markdown
# [EMOJI] Título de la Feature

> **Estado:** [Planificado|En Desarrollo|Completado]
> **Módulo:** [Global|Importaciones|Inventario|etc]
> **Fecha:** YYYY-MM-DD

## 🎯 Objetivo

[Qué problema resuelve]

## 📋 Implementación

[Cómo se implementó]

## ✅ Verificación

[Cómo testear]

## 📚 Referencias

[Links a docs relacionados]
```

### **Para Actualizar Docs Existentes:**

1. Agregar fecha de última actualización
2. Mantener historial de cambios si es significativo
3. Actualizar índice maestro
4. Verificar links no estén rotos

---

## 🔗 Referencias Cruzadas

### **Documentos Relacionados:**

- Ver `PLAN-MONOREPO.md` para arquitectura técnica del monorepo
- Ver `CURETCORE-ARCHITECTURE.md` para visión general del ecosistema
- Ver `COMPLETED-FEATURES.md` para features implementadas

### **Próximos Pasos:**

1. Terminar migración a monorepo (ver `PLAN-MONOREPO.md`)
2. Implementar generador de docs estático (VitePress)
3. Crear sistema de búsqueda de documentación
4. Agregar diagramas interactivos (Mermaid)

---

**Mantenedor:** Sistema CuretCore
**Última revisión:** 2025-11-22
