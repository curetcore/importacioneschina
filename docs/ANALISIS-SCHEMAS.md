# 📊 Análisis Exhaustivo de Schemas - Local vs Producción

**Fecha:** 2025-11-18
**Objetivo:** Identificar TODAS las diferencias entre schema local y base de datos de producción

---

## 📋 Resumen Ejecutivo

| Aspecto                | Schema Local     | Schema Producción |
| ---------------------- | ---------------- | ----------------- |
| **Líneas de código**   | 411 líneas       | 286 líneas        |
| **Modelos**            | 13 modelos       | 13 modelos        |
| **Convención nombres** | camelCase + @map | snake_case nativo |
| **Documentación**      | ✅ Extensa       | ❌ Mínima         |

---

## 🔍 Diferencias Críticas Encontradas

### 1. ❌ **Columnas `search_vector` ELIMINADAS**

**Estado:** ⚠️ **PÉRDIDA DE DATOS CONFIRMADA**

Las siguientes columnas fueron eliminadas de producción durante el último `prisma db push`:

| Tabla                 | Columna         | Tipo     | Registros Afectados | Impacto                       |
| --------------------- | --------------- | -------- | ------------------- | ----------------------------- |
| `gastos_logisticos`   | `search_vector` | tsvector | 23 registros        | ❌ Búsqueda full-text perdida |
| `inventario_recibido` | `search_vector` | tsvector | 34 registros        | ❌ Búsqueda full-text perdida |
| `oc_china`            | `search_vector` | tsvector | 11 registros        | ❌ Búsqueda full-text perdida |
| `pagos_china`         | `search_vector` | tsvector | 20 registros        | ❌ Búsqueda full-text perdida |
| `proveedores`         | `search_vector` | tsvector | 6 registros         | ❌ Búsqueda full-text perdida |

**Causa:** Schema local NO tiene estas columnas definidas → Prisma las eliminó al sincronizar

**Funcionalidad afectada:**

- ❌ Búsqueda rápida por texto completo (PostgreSQL Full-Text Search)
- ❌ Queries optimizadas con GIN index
- ❌ Feature documentada en `docs/FULL-TEXT-SEARCH.md`

---

### 2. ✅ **Columna `last_name` AGREGADA CORRECTAMENTE**

| Modelo | Campo      | Mapeo BD    | Tipo    | Status          |
| ------ | ---------- | ----------- | ------- | --------------- |
| `User` | `lastName` | `last_name` | String? | ✅ SINCRONIZADO |

**Confirmado en producción:**

```sql
\d users
-- Columna: last_name | text | nullable
```

---

## 📊 Comparación Detallada por Modelo

### **Modelo: User / users**

#### Schema Local (camelCase):

```prisma
model User {
  id         String    @id @default(cuid())
  email      String    @unique
  name       String
  lastName   String?   @map("last_name")  // ← NUEVO
  password   String
  role       String    @default("user")
  activo     Boolean   @default(true)

  auditLogs  AuditLog[]

  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")
  lastLogin  DateTime? @map("last_login")

  @@map("users")
  @@index([email])
  @@index([activo])
}
```

#### Schema Producción (snake_case):

```prisma
model users {
  id         String       @id
  email      String       @unique
  name       String
  last_name  String?      // ← PRESENTE
  password   String
  role       String       @default("user")
  activo     Boolean      @default(true)
  created_at DateTime     @default(now())
  updated_at DateTime
  last_login DateTime?
  audit_logs audit_logs[]

  @@index([activo])
  @@index([email])
}
```

**Diferencias:**

- ✅ Columna `last_name` presente en ambos
- ✅ Todos los campos coinciden
- ⚠️ Local usa nombres bonitos (camelCase) + @map
- ⚠️ Producción usa nombres nativos (snake_case)

---

### **Modelo: OCChina / oc_china**

#### Diferencias Clave:

**FALTA EN PRODUCCIÓN:**

- ❌ Columna `search_vector` (eliminada recientemente)

**PRESENTE EN AMBOS:**

- ✅ Todos los campos core (oc, proveedor, fecha_oc, etc.)
- ✅ Campos de soft delete (deleted_at)
- ✅ Adjuntos (JSON)

**ÍNDICES:**

| Índice                   | Local | Producción | Status |
| ------------------------ | ----- | ---------- | ------ |
| `[proveedor]`            | ✅    | ✅         | OK     |
| `[fechaOC]`              | ✅    | ✅         | OK     |
| `[categoriaPrincipal]`   | ✅    | ✅         | OK     |
| `[deletedAt]`            | ✅    | ✅         | OK     |
| `[deletedAt, fechaOC]`   | ✅    | ✅         | OK     |
| `[proveedor, deletedAt]` | ✅    | ✅         | OK     |

---

### **Modelo: OCChinaItem / oc_china_items**

#### Diferencias:

**AGREGADOS CORRECTAMENTE:**

- ✅ `pesoUnitarioKg` → `peso_unitario_kg` (Decimal(10,4))
- ✅ `volumenUnitarioCBM` → `volumen_unitario_cbm` (Decimal(10,6))
- ✅ `pesoTotalKg` → `peso_total_kg` (Decimal(12,4))
- ✅ `volumenTotalCBM` → `volumen_total_cbm` (Decimal(12,6))

**Status:** ✅ **SINCRONIZADO** (campos para distribución de costos)

---

### **Modelo: PagosChina / pagos_china**

#### Diferencias:

**FALTA EN PRODUCCIÓN:**

- ❌ Columna `search_vector` (eliminada)

**ÍNDICES:**

| Índice         | Local | Producción | Status |
| -------------- | ----- | ---------- | ------ |
| `[fechaPago]`  | ✅    | ✅         | OK     |
| `[tipoPago]`   | ✅    | ✅         | OK     |
| `[metodoPago]` | ✅    | ✅         | OK     |
| `[moneda]`     | ✅    | ✅         | OK     |
| `[deletedAt]`  | ✅    | ✅         | OK     |

---

### **Modelo: GastosLogisticos / gastos_logisticos**

#### Diferencias:

**FALTA EN PRODUCCIÓN:**

- ❌ Columna `search_vector` (eliminada)

**ÍNDICES:**

| Índice         | Local | Producción | Status |
| -------------- | ----- | ---------- | ------ |
| `[fechaGasto]` | ✅    | ✅         | OK     |
| `[tipoGasto]`  | ✅    | ✅         | OK     |
| `[metodoPago]` | ✅    | ✅         | OK     |
| `[deletedAt]`  | ✅    | ✅         | OK     |

---

### **Modelo: InventarioRecibido / inventario_recibido**

#### Diferencias:

**FALTA EN PRODUCCIÓN:**

- ❌ Columna `search_vector` (eliminada)

**ÍNDICES:**

| Índice            | Local | Producción | Status |
| ----------------- | ----- | ---------- | ------ |
| `[fechaLlegada]`  | ✅    | ✅         | OK     |
| `[bodegaInicial]` | ✅    | ✅         | OK     |
| `[deletedAt]`     | ✅    | ✅         | OK     |
| `[ocId]`          | ✅    | ✅         | OK     |
| `[itemId]`        | ✅    | ✅         | OK     |

---

### **Modelo: Proveedor / proveedores**

#### Diferencias:

**FALTA EN PRODUCCIÓN:**

- ❌ Columna `search_vector` (eliminada)

**PRESENTE:**

- ✅ Todos los campos core
- ✅ Índices básicos

---

### **Modelo: AuditLog / audit_logs**

#### Status: ✅ **SINCRONIZADO**

Todos los campos coinciden:

- ✅ entidad, entidad_id, accion
- ✅ usuario_id, usuario_email
- ✅ ip_address, user_agent
- ✅ cambios_antes, cambios_despues
- ✅ campos_modificados (String[])
- ✅ metadata (JSON)

---

### **Modelo: ConfiguracionDistribucionCostos / config_distribucion_costos**

#### Status: ✅ **SINCRONIZADO**

Sistema de distribución de costos correctamente implementado:

- ✅ tipo_costo (unique)
- ✅ metodo_distribucion
- ✅ activo (boolean)
- ✅ Índices en tipo_costo y activo

---

### **Modelo: Configuracion / configuracion**

#### Status: ✅ **SINCRONIZADO**

Configuración dinámica correcta:

- ✅ categoria, valor (unique compound)
- ✅ orden, activo
- ✅ Índices apropiados

---

### **Modelo: Notificacion / notificaciones**

#### Status: ✅ **SINCRONIZADO**

Sistema de notificaciones completo:

- ✅ Todos los campos presentes
- ✅ Índices optimizados
- ✅ Soporte para notificaciones leídas/no leídas

---

### **Modelo: Producto / productos**

#### Status: ✅ **SINCRONIZADO**

Catálogo de productos básico:

- ✅ SKU (unique)
- ✅ nombre, precio_venta
- ✅ Soft delete (deleted_at)

---

## 🚨 Problemas Críticos Identificados

### ❌ **PROBLEMA #1: Columnas search_vector eliminadas**

**Severidad:** ALTA
**Impacto:** Funcionalidad de búsqueda full-text perdida

**Solución requerida:**

1. Agregar columnas `search_vector` al schema local
2. Recrear índices GIN
3. Crear triggers para actualización automática
4. Repoblar datos de búsqueda

**Archivos a actualizar:**

- `prisma/schema.prisma` - Agregar columnas search_vector
- `prisma/migrations/` - Crear migración para restaurar

**Estimación:** 2-3 horas de trabajo

---

### ✅ **PROBLEMA #2: Columna last_name (RESUELTO)**

**Status:** ✅ RESUELTO
**Fecha:** 2025-11-18
**Acción:** Columna agregada exitosamente

---

## 📈 Estadísticas de Sincronización

### Columnas por Tabla

| Tabla                      | Columnas Local | Columnas Producción | Diferencia            |
| -------------------------- | -------------- | ------------------- | --------------------- |
| users                      | 11             | 11                  | ✅ 0                  |
| oc_china                   | 10             | 9                   | ❌ -1 (search_vector) |
| oc_china_items             | 17             | 17                  | ✅ 0                  |
| pagos_china                | 16             | 15                  | ❌ -1 (search_vector) |
| gastos_logisticos          | 12             | 11                  | ❌ -1 (search_vector) |
| inventario_recibido        | 13             | 12                  | ❌ -1 (search_vector) |
| proveedores                | 18             | 17                  | ❌ -1 (search_vector) |
| audit_logs                 | 13             | 13                  | ✅ 0                  |
| config_distribucion_costos | 5              | 5                   | ✅ 0                  |
| configuracion              | 6              | 6                   | ✅ 0                  |
| notificaciones             | 15             | 15                  | ✅ 0                  |
| productos                  | 6              | 6                   | ✅ 0                  |
| gastos_logisticos_oc       | 4              | 4                   | ✅ 0                  |

**Total:** 5 tablas con columnas faltantes (search_vector)

---

### Índices por Tabla

| Tabla               | Índices Local | Índices Producción | Status |
| ------------------- | ------------- | ------------------ | ------ |
| users               | 2             | 2                  | ✅ OK  |
| oc_china            | 6             | 6                  | ✅ OK  |
| oc_china_items      | 3             | 3                  | ✅ OK  |
| pagos_china         | 5             | 5                  | ✅ OK  |
| gastos_logisticos   | 4             | 4                  | ✅ OK  |
| inventario_recibido | 5             | 5                  | ✅ OK  |
| proveedores         | 3             | 3                  | ✅ OK  |
| audit_logs          | 8             | 8                  | ✅ OK  |
| notificaciones      | 8             | 8                  | ✅ OK  |

**Total:** Todos los índices sincronizados ✅

---

## 🔧 Plan de Acción Recomendado

### **PRIORIDAD ALTA - Restaurar search_vector**

#### Paso 1: Agregar Columnas al Schema

```prisma
model OCChina {
  // ... campos existentes ...

  // ⚠️ AGREGAR: Full-text search (unsupported by Prisma, pero existe en BD)
  /// @DeveloperNote: Columna search_vector manejada por triggers de PostgreSQL
  /// No es accesible directamente desde Prisma Client
  // searchVector Unsupported("tsvector")?

  @@map("oc_china")
}
```

**Nota:** Prisma NO soporta tipo `tsvector` directamente. Alternativas:

1. Ignorar en schema (dejar que PostgreSQL lo maneje con triggers)
2. Usar `Unsupported("tsvector")` (visible pero no usable)
3. Documentar como columna externa manejada por triggers

#### Paso 2: Crear Migración SQL

```sql
-- Archivo: prisma/migrations/YYYYMMDDHHMMSS_restore_search_vectors/migration.sql

-- Restaurar columnas search_vector
ALTER TABLE oc_china ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE pagos_china ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE gastos_logisticos ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE inventario_recibido ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Recrear índices GIN
CREATE INDEX IF NOT EXISTS oc_china_search_idx ON oc_china USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS pagos_china_search_idx ON pagos_china USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS gastos_logisticos_search_idx ON gastos_logisticos USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS inventario_recibido_search_idx ON inventario_recibido USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS proveedores_search_idx ON proveedores USING GIN(search_vector);

-- Triggers para actualización automática
-- Ver docs/FULL-TEXT-SEARCH.md para código completo de triggers
```

#### Paso 3: Repoblar Datos

```sql
-- Repoblar search_vector con datos actuales
UPDATE oc_china SET search_vector =
  to_tsvector('spanish', coalesce(oc,'') || ' ' || coalesce(proveedor,'') || ' ' || coalesce(descripcion_lote,''));

UPDATE pagos_china SET search_vector =
  to_tsvector('spanish', coalesce(id_pago,'') || ' ' || coalesce(tipo_pago,'') || ' ' || coalesce(metodo_pago,''));

-- ... resto de tablas
```

---

### **PRIORIDAD MEDIA - Prevención Futura**

1. **Crear workflow de revisión pre-push:**
   - Script que compare schema local vs producción
   - Advertir si hay columnas que se eliminarán
   - Requerir flag `--confirm-data-loss` explícito

2. **Documentar columnas especiales:**
   - Agregar comentarios en schema sobre search_vector
   - Documentar que son manejadas por triggers PostgreSQL
   - Explicar por qué no están en Prisma

3. **Mejorar CI/CD:**
   - Dry-run de migraciones antes de aplicar
   - Backup automático antes de cada migración
   - Rollback automático si falla

---

## 📝 Conclusiones

### ✅ Aspectos Positivos:

1. Schema local está bien estructurado con nombres claros (camelCase)
2. Todos los índices están correctamente definidos
3. Soft deletes implementados consistentemente
4. Sistema de audit logs completo
5. Distribución de costos profesional integrada

### ❌ Aspectos a Mejorar:

1. **CRÍTICO:** 5 columnas `search_vector` eliminadas (pérdida de funcionalidad)
2. Falta documentación sobre columnas no-Prisma
3. No hay validación pre-push para prevenir pérdida de datos
4. Schema de producción no tiene comentarios

### 🎯 Próximos Pasos:

1. [ ] Decidir: ¿Restaurar search_vector o usar solución alternativa?
2. [ ] Si restaurar: Ejecutar migración SQL manual
3. [ ] Actualizar schema local con documentación de columnas especiales
4. [ ] Crear script de validación pre-push
5. [ ] Documentar proceso en `docs/PRISMA-BEST-PRACTICES.md`

---

**Fecha de análisis:** 2025-11-18
**Analizado por:** Claude Code
**Schema local:** 411 líneas, 13 modelos
**Schema producción:** 286 líneas, 13 modelos
**Diferencias críticas:** 5 columnas faltantes (search_vector)
