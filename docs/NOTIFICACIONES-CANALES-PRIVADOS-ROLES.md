# 🔐 Sistema de Canales Privados + Roles y Permisos

**Fecha de creación:** 2025-01-21
**Estado:** 📋 Pendiente de implementación
**Prioridad:** Alta (seguridad)
**Estimación:** 1.5-2 horas
**Prerequisito:** Sistema de notificaciones en tiempo real (✅ Completado)

---

## 📊 RESUMEN EJECUTIVO

### ¿Qué es este sistema?

Un sistema **flexible y escalable** para gestionar notificaciones en tiempo real basado en:

- **Roles de usuario** (admin, gerente, contador, empleado, etc.)
- **Permisos granulares** por entidad
- **Reglas configurables** desde la UI (sin tocar código)
- **Canales privados** de Pusher para seguridad

### ¿Por qué es necesario?

**Problema actual:**

```
Usuario A crea orden →
  Broadcast a canal público "notifications" →
  TODOS los usuarios reciben la notificación
  (Incluso empleados que no deberían verla)
```

**Con este sistema:**

```
Usuario A crea orden →
  Sistema consulta reglas de notificación →
  Determina que solo admins y gerentes deben verla →
  Broadcast a canales privados:
    - "private-user-admin1"
    - "private-user-admin2"
    - "private-user-gerente1"
  Solo usuarios autorizados reciben la notificación
```

### Beneficios Clave

| Beneficio           | Descripción                                 |
| ------------------- | ------------------------------------------- |
| 🔒 **Seguridad**    | Notificaciones privadas, no públicas        |
| ⚙️ **Configurable** | Cambiar reglas desde UI sin código          |
| 📈 **Escalable**    | Agregar roles/permisos fácilmente           |
| 🎯 **Granular**     | Control fino de quién recibe qué            |
| 📝 **Auditable**    | Registro de todas las reglas aplicadas      |
| 🚀 **Futuro-proof** | Compatible con sistema de permisos avanzado |

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. EVENTO (Crear/Editar/Eliminar registro)                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. AUDIT LOGGER                                                  │
│    - Registra la acción en AuditLog                             │
│    - Llama a createNotificationFromAudit()                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. DISTRIBUCIÓN DE NOTIFICACIONES                               │
│    getNotificationRecipients(entityType, action, data)          │
│    ┌──────────────────────────────────────────────────┐        │
│    │ 3.1 Consultar reglas en BD                       │        │
│    │     WHERE entityType = "OCChina"                 │        │
│    │     AND action = "CREATE"                        │        │
│    │     AND enabled = true                           │        │
│    └─────────────────┬────────────────────────────────┘        │
│                      │                                          │
│    ┌─────────────────▼────────────────────────────────┐        │
│    │ 3.2 Filtrar por condiciones (si existen)        │        │
│    │     IF conditions.montoOriginal > 5000           │        │
│    │     THEN incluir regla                           │        │
│    └─────────────────┬────────────────────────────────┘        │
│                      │                                          │
│    ┌─────────────────▼────────────────────────────────┐        │
│    │ 3.3 Obtener usuarios por roles                  │        │
│    │     SELECT users WHERE role IN ["admin", ...]    │        │
│    │     → [userId1, userId2, userId3]                │        │
│    └─────────────────┬────────────────────────────────┘        │
└──────────────────────┼──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. CREAR NOTIFICACIONES (para cada usuario)                     │
│    FOR EACH userId:                                              │
│      createNotification({ ..., usuarioId })                     │
│      ├─ Guardar en BD                                           │
│      └─ triggerNotification()                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. PUSHER BROADCAST                                              │
│    Canal: "private-user-{userId}"                               │
│    Evento: "new-notification"                                   │
│    Datos: { id, titulo, descripcion, url, ... }                │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. CLIENTE (Browser)                                             │
│    useNotifications hook escucha "private-user-{userId}"        │
│    ├─ Recibe notificación INSTANTLY (<100ms)                   │
│    ├─ Muestra toast                                             │
│    ├─ Actualiza contador                                        │
│    └─ Agrega a dropdown                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes del Sistema

#### 1. **Base de Datos**

- `roles` - Definición de roles (admin, gerente, contador, etc.)
- `notification_rules` - Reglas de quién recibe qué notificaciones
- `users.roleId` - Relación usuario → rol

#### 2. **Backend Services**

- `notification-distribution.ts` - Lógica de distribución
- `notification-service.ts` - Creación de notificaciones
- `pusher-server.ts` - Broadcast a canales privados

#### 3. **Frontend**

- `useNotifications.ts` - Hook para escuchar notificaciones
- `/configuracion/notificaciones` - UI para gestionar reglas

---

## 🗄️ PASO 1: MIGRACIONES DE BASE DE DATOS

### 1.1 Agregar Tabla de Roles

```prisma
// prisma/schema.prisma

model Role {
  id          String   @id @default(cuid())
  name        String   @unique  // "admin", "gerente", "contador", "empleado"
  displayName String            // "Administrador", "Gerente", etc.
  description String?
  permissions Json     @default("[]")  // Array de permisos: ["orders.read", "orders.write"]

  // Color para UI (opcional)
  color       String?  @default("#3B82F6")

  // Orden de prioridad (para mostrar en UI)
  priority    Int      @default(0)

  // Sistema
  isSystem    Boolean  @default(false)  // true = no se puede eliminar

  // Relaciones
  users       User[]

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("roles")
  @@index([name])
}

// Extender modelo User
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String
  lastName        String?   @map("last_name")

  // ROL - NUEVA RELACIÓN
  roleId          String?   @map("role_id")
  role            Role?     @relation(fields: [roleId], references: [id], onDelete: SetNull)

  // ... resto de campos existentes ...

  @@index([roleId])
}
```

### 1.2 Agregar Tabla de Reglas de Notificación

```prisma
model NotificationRule {
  id          String   @id @default(cuid())

  // Metadata
  name        String            // "Notificar creación de órdenes"
  description String?           // Descripción detallada

  // Qué evento trigger la notificación
  entityType  String            // "OCChina", "PagosChina", "GastosLogisticos", etc.
  action      String            // "CREATE", "UPDATE", "DELETE"

  // A quién notificar
  notifyRoles String[]          // ["admin", "gerente"] - nombres de roles
  notifyUsers String[]  @default([])  // IDs específicos (opcional)

  // Condiciones (JSON) - Opcional
  // Ejemplo: { "montoOriginal": { ">": 5000 } }
  // Solo aplica la regla si las condiciones se cumplen
  conditions  Json?

  // Configuración
  enabled     Boolean  @default(true)
  priority    String   @default("normal")  // "low", "normal", "high", "urgent"

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("notification_rules")
  @@index([entityType, action])
  @@index([enabled])
}
```

### 1.3 Ejecutar Migración

```bash
# Crear migración
npx prisma migrate dev --name add_roles_and_notification_rules

# Aplicar migración
npx prisma migrate deploy

# Regenerar cliente de Prisma
npx prisma generate
```

---

## 🌱 PASO 2: SEED DE DATOS INICIALES

### 2.1 Crear archivo de seed

```typescript
// prisma/seed-roles-and-rules.ts

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function seedRolesAndNotificationRules() {
  console.log("🌱 Seeding roles and notification rules...")

  // ============================================
  // 1. CREAR ROLES
  // ============================================

  const roles = [
    {
      name: "superadmin",
      displayName: "Super Administrador",
      description: "Acceso total al sistema incluyendo configuración",
      permissions: [
        "all.read",
        "all.write",
        "all.delete",
        "settings.manage",
        "users.manage",
        "roles.manage",
        "notifications.manage",
      ],
      color: "#DC2626", // Red
      priority: 100,
      isSystem: true,
    },
    {
      name: "admin",
      displayName: "Administrador",
      description: "Gestión completa de operaciones y datos",
      permissions: [
        "orders.read",
        "orders.write",
        "orders.delete",
        "payments.read",
        "payments.write",
        "payments.delete",
        "expenses.read",
        "expenses.write",
        "expenses.delete",
        "inventory.read",
        "inventory.write",
        "inventory.delete",
        "providers.read",
        "providers.write",
        "analytics.read",
      ],
      color: "#2563EB", // Blue
      priority: 90,
      isSystem: true,
    },
    {
      name: "gerente",
      displayName: "Gerente",
      description: "Supervisión de operaciones y aprobaciones",
      permissions: [
        "orders.read",
        "orders.write",
        "payments.read",
        "expenses.read",
        "inventory.read",
        "inventory.write",
        "providers.read",
        "analytics.read",
      ],
      color: "#7C3AED", // Purple
      priority: 80,
      isSystem: false,
    },
    {
      name: "contador",
      displayName: "Contador",
      description: "Gestión financiera y contabilidad",
      permissions: [
        "payments.read",
        "payments.write",
        "expenses.read",
        "expenses.write",
        "orders.read",
        "analytics.read",
      ],
      color: "#059669", // Green
      priority: 70,
      isSystem: false,
    },
    {
      name: "bodeguero",
      displayName: "Bodeguero",
      description: "Gestión de inventario y recepciones",
      permissions: ["inventory.read", "inventory.write", "orders.read"],
      color: "#D97706", // Orange
      priority: 60,
      isSystem: false,
    },
    {
      name: "empleado",
      displayName: "Empleado",
      description: "Acceso básico de solo lectura",
      permissions: ["orders.read", "inventory.read"],
      color: "#6B7280", // Gray
      priority: 50,
      isSystem: false,
    },
  ]

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {}, // No actualizar si ya existe
      create: roleData,
    })
  }

  console.log("✅ Roles creados:", roles.length)

  // ============================================
  // 2. CREAR REGLAS DE NOTIFICACIÓN
  // ============================================

  const rules = [
    // ────────────────────────────────────────
    // ÓRDENES DE COMPRA (OCChina)
    // ────────────────────────────────────────
    {
      name: "Nueva orden de compra",
      description: "Notificar cuando se crea una nueva orden de compra",
      entityType: "OCChina",
      action: "CREATE",
      notifyRoles: ["admin", "gerente"],
      enabled: true,
      priority: "normal",
    },
    {
      name: "Orden modificada",
      description: "Notificar cuando se modifica una orden existente",
      entityType: "OCChina",
      action: "UPDATE",
      notifyRoles: ["admin"],
      enabled: true,
      priority: "low",
    },
    {
      name: "Orden eliminada (CRÍTICO)",
      description: "Alerta urgente cuando se elimina una orden",
      entityType: "OCChina",
      action: "DELETE",
      notifyRoles: ["superadmin", "admin"],
      enabled: true,
      priority: "urgent",
    },

    // ────────────────────────────────────────
    // PAGOS (PagosChina)
    // ────────────────────────────────────────
    {
      name: "Todos los pagos al contador",
      description: "El contador debe ver todos los pagos registrados",
      entityType: "PagosChina",
      action: "CREATE",
      notifyRoles: ["contador"],
      enabled: true,
      priority: "normal",
    },
    {
      name: "Pagos grandes (>$5,000)",
      description: "Notificar pagos mayores a $5,000 USD a admins",
      entityType: "PagosChina",
      action: "CREATE",
      notifyRoles: ["admin", "gerente"],
      conditions: {
        montoOriginal: { ">": 5000 },
      },
      enabled: true,
      priority: "high",
    },
    {
      name: "Pagos muy grandes (>$20,000)",
      description: "Alerta urgente para pagos mayores a $20,000 USD",
      entityType: "PagosChina",
      action: "CREATE",
      notifyRoles: ["superadmin", "admin"],
      conditions: {
        montoOriginal: { ">": 20000 },
      },
      enabled: true,
      priority: "urgent",
    },
    {
      name: "Pago eliminado",
      description: "Notificar cuando se elimina un pago",
      entityType: "PagosChina",
      action: "DELETE",
      notifyRoles: ["admin", "contador"],
      enabled: true,
      priority: "high",
    },

    // ────────────────────────────────────────
    // GASTOS LOGÍSTICOS (GastosLogisticos)
    // ────────────────────────────────────────
    {
      name: "Nuevo gasto logístico",
      description: "Notificar cuando se registra un gasto",
      entityType: "GastosLogisticos",
      action: "CREATE",
      notifyRoles: ["admin", "gerente", "contador"],
      enabled: true,
      priority: "normal",
    },
    {
      name: "Gastos grandes (>$2,000)",
      description: "Notificar gastos mayores a $2,000",
      entityType: "GastosLogisticos",
      action: "CREATE",
      notifyRoles: ["admin"],
      conditions: {
        montoRD: { ">": 2000 },
      },
      enabled: true,
      priority: "high",
    },

    // ────────────────────────────────────────
    // INVENTARIO (InventarioRecibido)
    // ────────────────────────────────────────
    {
      name: "Inventario recibido",
      description: "Notificar cuando llega inventario a bodega",
      entityType: "InventarioRecibido",
      action: "CREATE",
      notifyRoles: ["admin", "gerente", "bodeguero"],
      enabled: true,
      priority: "normal",
    },
    {
      name: "Inventario eliminado",
      description: "Alerta cuando se elimina una recepción de inventario",
      entityType: "InventarioRecibido",
      action: "DELETE",
      notifyRoles: ["admin"],
      enabled: true,
      priority: "high",
    },
  ]

  for (const ruleData of rules) {
    await prisma.notificationRule.create({
      data: ruleData,
    })
  }

  console.log("✅ Reglas de notificación creadas:", rules.length)

  console.log("🎉 Seed completado exitosamente!")
}

// Ejecutar
seedRolesAndNotificationRules()
  .catch(e => {
    console.error("❌ Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### 2.2 Ejecutar seed

```bash
# Opción 1: Ejecutar directamente
npx tsx prisma/seed-roles-and-rules.ts

# Opción 2: Agregar a package.json
# {
#   "prisma": {
#     "seed": "tsx prisma/seed-roles-and-rules.ts"
#   }
# }
npx prisma db seed
```

---

## 💻 PASO 3: SERVICIO DE DISTRIBUCIÓN

### 3.1 Crear archivo principal

```typescript
// lib/notification-distribution.ts

import { getPrismaClient } from "./db-helpers"
import type { Prisma } from "@prisma/client"

/**
 * Determinar qué usuarios deben recibir una notificación
 * basado en las reglas configuradas en la base de datos
 *
 * @param entityType - Tipo de entidad: "OCChina", "PagosChina", etc.
 * @param action - Acción: "CREATE", "UPDATE", "DELETE"
 * @param entityData - Datos de la entidad (para evaluar condiciones)
 * @returns Array de IDs de usuarios que deben recibir la notificación
 */
export async function getNotificationRecipients(
  entityType: string,
  action: string,
  entityData?: Record<string, any>
): Promise<string[]> {
  const db = await getPrismaClient()

  console.log(`📋 [Distribution] Getting recipients for ${entityType}:${action}`)

  // 1. Obtener reglas aplicables
  const rules = await db.notificationRule.findMany({
    where: {
      entityType,
      action,
      enabled: true,
    },
    orderBy: {
      priority: "desc", // Procesar reglas urgentes primero
    },
  })

  if (rules.length === 0) {
    console.log(`⚠️ [Distribution] No rules found for ${entityType}:${action}`)
    return []
  }

  console.log(`📋 [Distribution] Found ${rules.length} rules`)

  // 2. Filtrar reglas por condiciones
  const applicableRules = rules.filter(rule => {
    if (!rule.conditions || !entityData) {
      return true // Sin condiciones = siempre aplica
    }

    const conditionsMatch = evaluateConditions(rule.conditions as Prisma.JsonObject, entityData)

    if (conditionsMatch) {
      console.log(`  ✅ [Distribution] Rule "${rule.name}" matched conditions`)
    } else {
      console.log(`  ⏭️ [Distribution] Rule "${rule.name}" skipped (conditions not met)`)
    }

    return conditionsMatch
  })

  if (applicableRules.length === 0) {
    console.log(`⚠️ [Distribution] No rules matched conditions`)
    return []
  }

  console.log(`📋 [Distribution] ${applicableRules.length} rules applicable`)

  // 3. Recolectar usuarios destinatarios
  const recipientIds = new Set<string>()

  for (const rule of applicableRules) {
    // 3.1 Agregar usuarios por rol
    if (rule.notifyRoles.length > 0) {
      const usersWithRoles = await db.user.findMany({
        where: {
          role: {
            name: { in: rule.notifyRoles },
          },
        },
        select: {
          id: true,
          name: true,
          role: {
            select: { displayName: true },
          },
        },
      })

      usersWithRoles.forEach(user => {
        recipientIds.add(user.id)
        console.log(`    👤 [Distribution] Added ${user.name} (${user.role?.displayName})`)
      })
    }

    // 3.2 Agregar usuarios específicos
    rule.notifyUsers.forEach(userId => {
      recipientIds.add(userId)
      console.log(`    👤 [Distribution] Added specific user ${userId}`)
    })
  }

  const recipients = Array.from(recipientIds)
  console.log(`📬 [Distribution] Total recipients: ${recipients.length}`)

  return recipients
}

/**
 * Evaluar si una entidad cumple con las condiciones especificadas
 *
 * @param conditions - Condiciones JSON: { "campo": { "operador": valor } }
 * @param data - Datos de la entidad a evaluar
 * @returns true si cumple todas las condiciones
 *
 * @example
 * conditions = { "montoOriginal": { ">": 5000 } }
 * data = { montoOriginal: 7500 }
 * → returns true
 */
function evaluateConditions(conditions: Prisma.JsonObject, data: Record<string, any>): boolean {
  for (const [field, condition] of Object.entries(conditions)) {
    const value = data[field]

    // Manejar valor undefined
    if (value === undefined) {
      console.log(`    ⚠️ [Conditions] Field "${field}" not found in data`)
      return false
    }

    if (typeof condition === "object" && condition !== null) {
      // Operadores: >, <, >=, <=, ==, !=, in, not_in
      for (const [operator, threshold] of Object.entries(condition)) {
        let result = false

        switch (operator) {
          case ">":
            result = value > threshold
            break
          case ">=":
            result = value >= threshold
            break
          case "<":
            result = value < threshold
            break
          case "<=":
            result = value <= threshold
            break
          case "==":
            result = value === threshold
            break
          case "!=":
            result = value !== threshold
            break
          case "in":
            result = Array.isArray(threshold) && threshold.includes(value)
            break
          case "not_in":
            result = Array.isArray(threshold) && !threshold.includes(value)
            break
          default:
            console.warn(`⚠️ [Conditions] Unknown operator: ${operator}`)
            return false
        }

        if (!result) {
          console.log(
            `    ❌ [Conditions] Failed: ${field} ${operator} ${threshold} (value: ${value})`
          )
          return false
        }

        console.log(`    ✅ [Conditions] Passed: ${field} ${operator} ${threshold}`)
      }
    } else {
      // Comparación directa
      if (value !== condition) {
        console.log(`    ❌ [Conditions] Failed: ${field} === ${condition} (value: ${value})`)
        return false
      }
      console.log(`    ✅ [Conditions] Passed: ${field} === ${condition}`)
    }
  }

  return true
}

/**
 * Obtener la prioridad de notificación según las reglas
 * Retorna la prioridad más alta de todas las reglas aplicables
 *
 * @param entityType - Tipo de entidad
 * @param action - Acción
 * @returns "urgent" | "high" | "normal" | "low"
 */
export async function getNotificationPriority(entityType: string, action: string): Promise<string> {
  const db = await getPrismaClient()

  const rule = await db.notificationRule.findFirst({
    where: {
      entityType,
      action,
      enabled: true,
    },
    orderBy: [
      { priority: "desc" }, // urgente > high > normal > low
      { createdAt: "desc" },
    ],
  })

  return rule?.priority || "normal"
}

/**
 * Verificar si un usuario tiene permiso para recibir notificaciones de una entidad
 * Útil para checks adicionales de seguridad
 *
 * @param userId - ID del usuario
 * @param entityType - Tipo de entidad
 * @param action - Acción (opcional)
 * @returns true si el usuario tiene permiso
 */
export async function userCanReceiveNotification(
  userId: string,
  entityType: string,
  action?: string
): Promise<boolean> {
  const db = await getPrismaClient()

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })

  if (!user || !user.role) {
    return false
  }

  // Superadmin puede ver todo
  if (user.role.name === "superadmin") {
    return true
  }

  // Verificar permisos del rol
  const permissions = user.role.permissions as string[]

  // Mapeo básico de entidades a permisos
  const entityPermissionMap: Record<string, string[]> = {
    OCChina: ["orders.read", "orders.write"],
    PagosChina: ["payments.read", "payments.write"],
    GastosLogisticos: ["expenses.read", "expenses.write"],
    InventarioRecibido: ["inventory.read", "inventory.write"],
  }

  const requiredPermissions = entityPermissionMap[entityType] || []

  // El usuario necesita al menos un permiso de lectura
  return requiredPermissions.some(
    perm => permissions.includes(perm) || permissions.includes("all.read")
  )
}
```

---

## 🔄 PASO 4: INTEGRACIÓN EN NOTIFICATION SERVICE

### 4.1 Modificar `notification-service.ts`

```typescript
// lib/notification-service.ts

import { getNotificationRecipients, getNotificationPriority } from "./notification-distribution"

/**
 * Crear notificación desde audit log
 * MODIFICADO: Ahora usa sistema de distribución basado en roles
 */
export async function createNotificationFromAudit(
  auditLogId: string,
  entidad: string,
  entidadId: string,
  accion: string,
  usuarioEmail?: string,
  entityData?: any // NUEVO: datos de la entidad para evaluación de condiciones
): Promise<void> {
  try {
    const db = await getPrismaClient()

    // ... código existente para generar título, descripción, icono, url ...

    // ========================================
    // NUEVO: DISTRIBUCIÓN BASADA EN ROLES
    // ========================================

    // 1. Determinar destinatarios basado en reglas
    const recipients = await getNotificationRecipients(entidad, accion, entityData)

    if (recipients.length === 0) {
      console.log(`⚠️ [Notification] No recipients for ${entidad}:${accion}, skipping`)
      return
    }

    console.log(`📬 [Notification] Sending to ${recipients.length} users`)

    // 2. Obtener prioridad desde reglas
    const priority = await getNotificationPriority(entidad, accion)
    console.log(`🎯 [Notification] Priority: ${priority}`)

    // 3. Crear notificación para cada destinatario
    const notificationPromises = recipients.map(userId =>
      createNotification({
        tipo: "audit" as NotificationType,
        titulo,
        descripcion,
        icono,
        entidad,
        entidadId,
        url,
        auditLogId,
        usuarioId: userId, // 🔐 Canal privado por usuario
        actorId: usuarioEmail,
        prioridad: priority as NotificationPriority,
      })
    )

    await Promise.all(notificationPromises)

    console.log(`✅ [Notification] ${recipients.length} notifications created successfully`)
  } catch (error) {
    console.error("❌ [Notification] Error creating notification from audit:", error)
  }
}
```

### 4.2 Actualizar llamadas a `createNotificationFromAudit`

Ahora necesitas pasar los datos de la entidad para que las condiciones funcionen:

```typescript
// Ejemplo en app/api/oc-china/route.ts

const nuevaOrden = await db.oCChina.create({ data: validatedData })

// Audit log
await auditCreate("OCChina", nuevaOrden as any, request)

// Notificación - PASAR DATOS DE LA ENTIDAD
await createNotificationFromAudit(
  auditLog.id,
  "OCChina",
  nuevaOrden.id,
  "CREATE",
  session?.user?.email || undefined,
  nuevaOrden // ← NUEVO: pasar datos para evaluación de condiciones
)
```

---

## 🖥️ PASO 5: INTERFAZ DE CONFIGURACIÓN (UI)

### 5.1 API Endpoints

```typescript
// app/api/notification-rules/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getPrismaClient } from "@/lib/db-helpers"
import { handleApiError, Errors } from "@/lib/api-error-handler"

export const dynamic = "force-dynamic"

// GET /api/notification-rules - Listar reglas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw Errors.unauthorized()
    }

    // Solo superadmin puede ver reglas
    // TODO: verificar rol

    const db = await getPrismaClient()
    const rules = await db.notificationRule.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({
      success: true,
      data: rules,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/notification-rules - Crear regla
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw Errors.unauthorized()
    }

    const body = await request.json()
    const db = await getPrismaClient()

    const rule = await db.notificationRule.create({
      data: {
        name: body.name,
        description: body.description,
        entityType: body.entityType,
        action: body.action,
        notifyRoles: body.notifyRoles || [],
        notifyUsers: body.notifyUsers || [],
        conditions: body.conditions || null,
        enabled: body.enabled ?? true,
        priority: body.priority || "normal",
      },
    })

    return NextResponse.json({
      success: true,
      data: rule,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

```typescript
// app/api/notification-rules/[id]/route.ts

// PUT - Actualizar regla
// DELETE - Eliminar regla
// Similar a otros endpoints...
```

### 5.2 Componente de Configuración

```typescript
// app/(pages)/configuracion/notificaciones/page.tsx

"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Power, AlertTriangle } from "lucide-react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { showToast } from "@/lib/toast"

interface NotificationRule {
  id: string
  name: string
  description: string | null
  entityType: string
  action: string
  notifyRoles: string[]
  notifyUsers: string[]
  conditions: any
  enabled: boolean
  priority: string
  createdAt: string
}

interface Role {
  id: string
  name: string
  displayName: string
  color: string
}

export default function NotificationRulesPage() {
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [rulesRes, rolesRes] = await Promise.all([
        fetch('/api/notification-rules'),
        fetch('/api/roles'),
      ])

      const rulesData = await rulesRes.json()
      const rolesData = await rolesRes.json()

      if (rulesData.success) setRules(rulesData.data)
      if (rolesData.success) setRoles(rolesData.data)
    } catch (error) {
      showToast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/notification-rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })

      if (response.ok) {
        setRules(prev =>
          prev.map(r => r.id === ruleId ? { ...r, enabled } : r)
        )
        showToast.success(enabled ? 'Regla activada' : 'Regla desactivada')
      }
    } catch (error) {
      showToast.error('Error al actualizar regla')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <AlertTriangle className="w-3 h-3" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">Cargando...</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reglas de Notificación
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Configura quién recibe notificaciones para cada tipo de evento
            </p>
          </div>
          <Button onClick={() => {/* TODO: Abrir modal */}}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Regla
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{rules.length}</div>
              <div className="text-xs text-gray-600 mt-1">Reglas totales</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {rules.filter(r => r.enabled).length}
              </div>
              <div className="text-xs text-gray-600 mt-1">Activas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-400">
                {rules.filter(r => !r.enabled).length}
              </div>
              <div className="text-xs text-gray-600 mt-1">Inactivas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {rules.filter(r => r.priority === 'urgent').length}
              </div>
              <div className="text-xs text-gray-600 mt-1">Urgentes</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de reglas */}
        <Card>
          <CardHeader>
            <CardTitle>Reglas Configuradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Regla
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Entidad / Acción
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Destinatarios
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Prioridad
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Estado
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map(rule => (
                    <tr key={rule.id} className="border-b hover:bg-gray-50">
                      {/* Nombre */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm text-gray-900">
                          {rule.name}
                        </div>
                        {rule.description && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {rule.description}
                          </div>
                        )}
                        {rule.conditions && (
                          <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Con condiciones
                          </div>
                        )}
                      </td>

                      {/* Entidad/Acción */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {rule.entityType}
                          </Badge>
                          <span className="text-gray-400">→</span>
                          <Badge variant="secondary" className="text-xs">
                            {rule.action}
                          </Badge>
                        </div>
                      </td>

                      {/* Destinatarios */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {rule.notifyRoles.map(roleName => {
                            const role = roles.find(r => r.name === roleName)
                            return (
                              <Badge
                                key={roleName}
                                style={{
                                  backgroundColor: `${role?.color}20`,
                                  color: role?.color || '#6B7280',
                                  borderColor: role?.color || '#6B7280'
                                }}
                                className="text-xs border"
                              >
                                {role?.displayName || roleName}
                              </Badge>
                            )
                          })}
                        </div>
                      </td>

                      {/* Prioridad */}
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-xs border ${getPriorityColor(rule.priority)}`}
                        >
                          <span className="flex items-center gap-1">
                            {getPriorityIcon(rule.priority)}
                            {rule.priority}
                          </span>
                        </Badge>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                        />
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* TODO: Editar */}}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* TODO: Eliminar */}}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
```

---

## 🧪 PASO 6: TESTING

### Test Plan

```typescript
// tests/notification-distribution.test.ts

describe("Notification Distribution", () => {
  it("should notify admins when order is created", async () => {
    const recipients = await getNotificationRecipients("OCChina", "CREATE")

    // Verificar que hay al menos un admin
    expect(recipients.length).toBeGreaterThan(0)

    // Verificar que todos los recipients son admins o gerentes
    const users = await prisma.user.findMany({
      where: { id: { in: recipients } },
      include: { role: true },
    })

    users.forEach(user => {
      expect(["admin", "gerente"]).toContain(user.role?.name)
    })
  })

  it("should only notify admins for large payments", async () => {
    const paymentData = { montoOriginal: 15000 }
    const recipients = await getNotificationRecipients("PagosChina", "CREATE", paymentData)

    // Verificar que solo admins y gerentes reciben notificación
    const users = await prisma.user.findMany({
      where: { id: { in: recipients } },
      include: { role: true },
    })

    users.forEach(user => {
      expect(["admin", "gerente"]).toContain(user.role?.name)
    })
  })

  it("should evaluate conditions correctly", async () => {
    // Test para montos pequeños
    const smallPayment = { montoOriginal: 1000 }
    const recipientsSmall = await getNotificationRecipients("PagosChina", "CREATE", smallPayment)

    // Solo contador debería recibir
    const usersSmall = await prisma.user.findMany({
      where: { id: { in: recipientsSmall } },
      include: { role: true },
    })

    expect(usersSmall.every(u => u.role?.name === "contador")).toBe(true)
  })
})
```

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### Preparación

- [ ] Backup de base de datos actual
- [ ] Review de código con equipo
- [ ] Plan de rollback documentado

### Base de Datos

- [ ] Agregar modelo `Role` a schema.prisma
- [ ] Agregar modelo `NotificationRule` a schema.prisma
- [ ] Agregar `roleId` a modelo `User`
- [ ] Ejecutar migración: `npx prisma migrate dev`
- [ ] Verificar migración exitosa
- [ ] Ejecutar seed: `npx tsx prisma/seed-roles-and-rules.ts`
- [ ] Verificar que roles fueron creados
- [ ] Verificar que reglas fueron creadas

### Backend

- [ ] Crear `lib/notification-distribution.ts`
- [ ] Modificar `lib/notification-service.ts`
- [ ] Actualizar todas las llamadas a `createNotificationFromAudit()`
- [ ] Crear API `/api/notification-rules`
- [ ] Crear API `/api/notification-rules/[id]`
- [ ] Crear API `/api/roles`
- [ ] Agregar tests unitarios

### Frontend

- [ ] Crear página `/configuracion/notificaciones`
- [ ] Agregar link en navegación
- [ ] Implementar tabla de reglas
- [ ] Implementar modal de creación/edición
- [ ] Implementar toggle enable/disable
- [ ] Agregar filtros y búsqueda
- [ ] Tests E2E

### Testing

- [ ] Test: Crear orden → Solo admins reciben notificación
- [ ] Test: Pago grande → Admins y gerentes reciben
- [ ] Test: Pago pequeño → Solo contador recibe
- [ ] Test: Eliminar orden → Solo superadmin recibe
- [ ] Test: Desactivar regla → No se envían notificaciones
- [ ] Test: Condiciones complejas funcionan
- [ ] Test: Multi-usuario simultáneo
- [ ] Test: Performance con 100+ usuarios

### Deploy

- [ ] Deploy a staging
- [ ] Verificar notificaciones funcionan
- [ ] Asignar roles a usuarios reales
- [ ] Configurar reglas según necesidades
- [ ] Deploy a producción
- [ ] Monitorear logs de Pusher
- [ ] Verificar no hay errores
- [ ] Solicitar feedback de usuarios

---

## ❓ FAQ

### ¿Qué pasa si un usuario no tiene rol asignado?

No recibirá ninguna notificación basada en reglas. Solo recibirá notificaciones si se le agrega específicamente en `notifyUsers`.

### ¿Puedo tener una regla que notifique a TODOS los usuarios?

Sí, crea una regla sin `notifyRoles` y sin `notifyUsers`, y modifica `getNotificationRecipients` para retornar todos los usuarios en ese caso.

### ¿Cómo agrego un nuevo rol?

1. Via UI: Ir a `/configuracion/roles` (por implementar)
2. Via código:

```typescript
await prisma.role.create({
  data: {
    name: "mi_rol",
    displayName: "Mi Rol Nuevo",
    permissions: ["orders.read"],
  },
})
```

### ¿Cómo funciona el sistema de condiciones?

Las condiciones son JSON que se evalúan contra los datos de la entidad:

```json
{
  "montoOriginal": { ">": 5000 },
  "moneda": { "==": "USD" },
  "proveedor": { "in": ["Alibaba", "DHgate"] }
}
```

Operadores soportados: `>`, `>=`, `<`, `<=`, `==`, `!=`, `in`, `not_in`

### ¿Cómo migro usuarios existentes a roles?

```typescript
// Script de migración
const admins = await prisma.user.findMany({
  where: { email: { in: ["admin@ejemplo.com", "gerente@ejemplo.com"] } },
})

const adminRole = await prisma.role.findUnique({ where: { name: "admin" } })

for (const user of admins) {
  await prisma.user.update({
    where: { id: user.id },
    data: { roleId: adminRole.id },
  })
}
```

### ¿Qué pasa con las notificaciones existentes?

Las notificaciones ya creadas no se ven afectadas. El nuevo sistema solo aplica a notificaciones nuevas.

### ¿Puedo tener reglas que se contradigan?

Sí, pero se aplican todas. Si dos reglas dicen "notificar a admin", el admin recibe UNA notificación (se deduplicam por `recipientIds` siendo un Set).

### ¿Cómo debugging si una notificación no llega?

1. Verificar logs en consola: `[Distribution]` logs
2. Verificar que la regla está `enabled: true`
3. Verificar que el usuario tiene el rol correcto
4. Verificar que las condiciones se cumplen
5. Verificar Pusher dashboard para eventos

---

## 🎯 MÉTRICAS DE ÉXITO

Después de implementar, medir:

- ✅ **Seguridad**: 0 notificaciones llegando a usuarios no autorizados
- ✅ **Configurabilidad**: >80% de cambios sin tocar código
- ✅ **Performance**: <100ms para determinar recipients
- ✅ **Satisfacción**: Usuarios encuentran notificaciones relevantes
- ✅ **Escalabilidad**: Sistema funciona con 100+ usuarios

---

## 📚 RECURSOS ADICIONALES

- **Pusher Private Channels**: https://pusher.com/docs/channels/using_channels/private-channels/
- **Prisma JSON Fields**: https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#json-fields
- **Role-Based Access Control**: https://en.wikipedia.org/wiki/Role-based_access_control

---

**Fecha última actualización:** 2025-01-21
**Autor:** Claude Code
**Estado:** 📋 Listo para implementación
**Estimación:** 1.5-2 horas
