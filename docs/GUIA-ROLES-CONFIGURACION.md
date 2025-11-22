# 👥 Guía Visual de Roles - Sistema de Configuración

**Versión:** 1.0.0
**Fecha:** 2025-11-22

---

## 🎯 Comparación Rápida de Roles

### Vista General

| Característica            | Superadmin 👑 | Admin 🔷    | Limitado 👁️ |
| ------------------------- | ------------- | ----------- | ----------- |
| **Secciones visibles**    | 14/14         | 5/14        | 5/14        |
| **Puede editar config**   | ✅ Sí         | ✅ Sí       | ❌ No       |
| **Gestionar usuarios**    | ✅ Sí         | ❌ No       | ❌ No       |
| **Config notificaciones** | ✅ Sí         | ❌ No       | ❌ No       |
| **Ver actividad**         | 👁️ Todos      | 👁️ Propia   | 👁️ Propia   |
| **Eliminar datos**        | ✅ Sí         | ⚠️ Limitado | ❌ No       |

---

## 🖥️ Vistas por Rol

### 👑 SUPERADMIN

```
┌─────────────────────────────────────┐
│ ⚙️ CONFIGURACIÓN                     │
│ Módulo: [Importaciones ▼]           │
│                                     │
│ ▼ GENERAL (3)                       │
│   ✅ Configuraciones                │
│   ✅ Distribución                   │
│   ✅ Proveedores                    │
│                                     │
│ ▼ USUARIOS (3) 👑                   │
│   ✅ Gestión                        │
│   ✅ Roles                          │
│   ✅ Invitaciones                   │
│                                     │
│ ▼ NOTIFICACIONES (3) 👑             │
│   ✅ General                        │
│   ✅ Por Evento                     │
│   ✅ Por Rol                        │
│                                     │
│ ▼ SISTEMA (5)                       │
│   ✅ Mi Cuenta                      │
│   ✅ Actividad (todos) 👁️          │
│   ✅ Auditoría 👑                   │
│   ✅ Config Avanzada 👑             │
│   ✅ Módulos 👑                     │
│                                     │
│ 🏆 TOTAL: 14 secciones              │
└─────────────────────────────────────┘
```

**Acceso Exclusivo:**

- 👑 Gestión de usuarios (crear/editar/eliminar)
- 👑 Configurar roles y permisos
- 👑 Configurar notificaciones del sistema
- 👑 Ver actividad de TODOS
- 👑 Auditoría completa
- 👑 Configuración avanzada

---

### 🔷 ADMIN

```
┌─────────────────────────────────────┐
│ ⚙️ CONFIGURACIÓN                     │
│ Módulo: [Importaciones ▼]           │
│                                     │
│ ▼ GENERAL (3)                       │
│   ✅ Configuraciones                │
│   ✅ Distribución                   │
│   ✅ Proveedores                    │
│                                     │
│ ▼ SISTEMA (2)                       │
│   ✅ Mi Cuenta                      │
│   ✅ Mi Actividad                   │
│                                     │
│ ❌ SECCIONES NO VISIBLES:            │
│    - Usuarios                       │
│    - Notificaciones                 │
│    - Auditoría                      │
│    - Config Avanzada                │
│                                     │
│ 📊 TOTAL: 5 secciones               │
└─────────────────────────────────────┘
```

**Puede hacer:**

- ✅ Editar configuraciones del sistema
- ✅ Crear/editar proveedores
- ✅ Cambiar métodos de distribución
- ✅ Ver su propia actividad

**NO puede:**

- ❌ Gestionar usuarios
- ❌ Configurar notificaciones
- ❌ Ver actividad de otros
- ❌ Acceso a config avanzada

---

### 👁️ LIMITADO

```
┌─────────────────────────────────────┐
│ ⚙️ CONFIGURACIÓN                     │
│ Módulo: [Importaciones ▼]           │
│                                     │
│ ▼ GENERAL (3) - SOLO LECTURA        │
│   👁️ Configuraciones               │
│   👁️ Distribución                  │
│   👁️ Proveedores                   │
│                                     │
│ ▼ SISTEMA (2)                       │
│   ✅ Mi Cuenta (editable)           │
│   👁️ Mi Actividad                  │
│                                     │
│ 💡 MODO: Solo Lectura               │
│                                     │
│ 📊 TOTAL: 5 secciones               │
└─────────────────────────────────────┘
```

**Puede hacer:**

- 👁️ Ver configuraciones (consulta)
- 👁️ Ver proveedores (directorio)
- 👁️ Ver métodos de distribución
- ✅ Editar su perfil
- ✅ Cambiar su contraseña
- 👁️ Ver su actividad

**NO puede:**

- ❌ Editar NADA del sistema
- ❌ Crear/eliminar datos
- ❌ Gestionar usuarios
- ❌ Configurar notificaciones

---

## 📋 Permisos Detallados por Sección

### 1. Configuraciones Dinámicas

| Acción           | Superadmin | Admin           | Limitado |
| ---------------- | ---------- | --------------- | -------- |
| Ver listado      | ✅         | ✅              | ✅       |
| Crear nueva      | ✅         | ✅              | ❌       |
| Editar existente | ✅         | ✅              | ❌       |
| Eliminar         | ✅         | ⚠️ Solo sin uso | ❌       |
| Reordenar        | ✅         | ✅              | ❌       |

### 2. Distribución de Costos

| Acción          | Superadmin | Admin | Limitado |
| --------------- | ---------- | ----- | -------- |
| Ver métodos     | ✅         | ✅    | ✅       |
| Cambiar método  | ✅         | ✅    | ❌       |
| Ver explicación | ✅         | ✅    | ✅       |

### 3. Proveedores CRM

| Acción           | Superadmin | Admin | Limitado |
| ---------------- | ---------- | ----- | -------- |
| Ver listado      | ✅         | ✅    | ✅       |
| Ver detalle      | ✅         | ✅    | ✅       |
| Crear nuevo      | ✅         | ✅    | ❌       |
| Editar existente | ✅         | ✅    | ❌       |
| Eliminar         | ✅         | ✅    | ❌       |
| Calificar        | ✅         | ✅    | ❌       |

### 4. Gestión de Usuarios (Solo Superadmin)

| Acción           | Superadmin | Admin | Limitado |
| ---------------- | ---------- | ----- | -------- |
| Ver usuarios     | ✅         | ❌    | ❌       |
| Crear usuario    | ✅         | ❌    | ❌       |
| Editar usuario   | ✅         | ❌    | ❌       |
| Eliminar usuario | ✅         | ❌    | ❌       |
| Cambiar rol      | ✅         | ❌    | ❌       |
| Ver detalles     | ✅         | ❌    | ❌       |

### 5. Roles y Permisos (Solo Superadmin)

| Acción              | Superadmin | Admin | Limitado |
| ------------------- | ---------- | ----- | -------- |
| Ver roles           | ✅         | ❌    | ❌       |
| Editar permisos     | ✅         | ❌    | ❌       |
| Crear rol nuevo     | ✅         | ❌    | ❌       |
| Ver matriz permisos | ✅         | ❌    | ❌       |

### 6. Notificaciones (Solo Superadmin)

| Acción                 | Superadmin | Admin | Limitado |
| ---------------------- | ---------- | ----- | -------- |
| Config general         | ✅         | ❌    | ❌       |
| Habilitar/deshabilitar | ✅         | ❌    | ❌       |
| Config por rol         | ✅         | ❌    | ❌       |
| Config por evento      | ✅         | ❌    | ❌       |
| Ver plantillas         | ✅         | ❌    | ❌       |

### 7. Mi Cuenta (Todos)

| Acción             | Superadmin | Admin | Limitado |
| ------------------ | ---------- | ----- | -------- |
| Ver perfil propio  | ✅         | ✅    | ✅       |
| Editar perfil      | ✅         | ✅    | ✅       |
| Cambiar contraseña | ✅         | ✅    | ✅       |
| Subir foto         | ✅         | ✅    | ✅       |
| Ver preferencias   | ✅         | ✅    | ✅       |

### 8. Actividad

| Acción              | Superadmin | Admin            | Limitado |
| ------------------- | ---------- | ---------------- | -------- |
| Ver propia          | ✅         | ✅               | ✅       |
| Ver de otros        | ✅         | ❌               | ❌       |
| Filtrar por usuario | ✅         | ❌               | ❌       |
| Exportar            | ✅         | ✅ (solo propia) | ❌       |

---

## 🎨 Indicadores Visuales en la UI

### Badges de Permisos

```typescript
// Superadmin
<Badge variant="purple">Super Admin</Badge>

// Admin
<Badge variant="blue">Administrador</Badge>

// Limitado
<Badge variant="gray">Usuario Limitado</Badge>

// Solo Lectura
<Badge variant="outline">
  👁️ Solo Lectura
</Badge>
```

### Botones Deshabilitados

```typescript
// Para usuarios sin permisos
<Button disabled className="opacity-50 cursor-not-allowed">
  <Lock className="w-4 h-4 mr-2" />
  Sin Permisos
</Button>
```

### Mensajes de Información

```typescript
// Usuario limitado
<Alert>
  <Info className="w-4 h-4" />
  <AlertDescription>
    Estás en modo solo lectura. Contacta a un administrador
    si necesitas modificar configuraciones.
  </AlertDescription>
</Alert>
```

---

## 🔐 Seguridad

### Nivel de Aplicación (Frontend)

```typescript
// Hook de permisos
const { can, role } = usePermissions()

// Renderizado condicional
{can('editar', 'configuracion') ? (
  <EditButton />
) : (
  <ViewOnlyBadge />
)}

// Ocultar completamente
{can('ver', 'usuarios') && (
  <UsersManagement />
)}
```

### Nivel de API (Backend)

```typescript
// Middleware de autorización
if (!session) {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 })
}

const role = session.user.role

// Verificar permisos
if (method === "DELETE" && role !== "superadmin") {
  return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
}
```

---

## 📱 Responsivo

### Desktop (> 1024px)

```
┌──────────┬────────────────────────┐
│          │                        │
│ SIDEBAR  │     CONTENIDO          │
│ (264px)  │     (flexible)         │
│          │                        │
└──────────┴────────────────────────┘
```

### Tablet (768px - 1024px)

```
┌──────────┬──────────────┐
│          │              │
│ SIDEBAR  │  CONTENIDO   │
│ (200px)  │  (flexible)  │
│          │              │
└──────────┴──────────────┘
```

### Mobile (< 768px)

```
┌────────────────────────┐
│  HAMBURGER MENU        │
├────────────────────────┤
│                        │
│    CONTENIDO FULL      │
│                        │
└────────────────────────┘
```

---

## 🚀 Casos de Uso

### Caso 1: Superadmin configura nuevo rol

**Flujo:**

1. Ir a Configuración → Usuarios → Roles
2. Click "Crear Nuevo Rol"
3. Nombre: "Contador"
4. Seleccionar permisos:
   - Pagos: Ver ✅, Crear ✅, Editar ✅
   - Gastos: Ver ✅, Crear ✅, Editar ✅
   - Órdenes: Ver ✅
5. Guardar
6. Asignar rol a usuario

### Caso 2: Admin crea nueva categoría

**Flujo:**

1. Ir a Configuración → General → Configuraciones
2. Click "+ Agregar" en Categorías
3. Nombre: "Accesorios Tecnológicos"
4. Guardar
5. Categoría disponible en formularios

### Caso 3: Limitado consulta proveedor

**Flujo:**

1. Ir a Configuración → General → Proveedores
2. Ver listado (sin botón editar)
3. Click en proveedor
4. Ver detalles completos
5. NO puede modificar nada

---

## 💡 Tips de Uso

### Para Superadmin

✅ **Haz:**

- Configura roles específicos para tu equipo
- Revisa actividad regularmente
- Documenta cambios importantes

❌ **Evita:**

- Dar permisos de admin a todos
- Eliminar configuraciones en uso
- Cambiar permisos sin comunicar

### Para Admin

✅ **Haz:**

- Mantén configuraciones organizadas
- Documenta nuevos proveedores
- Reporta problemas a superadmin

❌ **Evita:**

- Crear configuraciones duplicadas
- Eliminar datos críticos

### Para Limitado

✅ **Haz:**

- Consulta información que necesites
- Solicita cambios a admin
- Reporta datos incorrectos

❌ **Evita:**

- Intentar editar sin permisos
- Compartir credenciales

---

## 📞 Soporte

### Preguntas Frecuentes

**P: ¿Por qué no puedo editar configuraciones?**
R: Tu rol es "Limitado" (solo lectura). Contacta a un administrador.

**P: ¿Cómo solicito permisos adicionales?**
R: Contacta al superadmin del sistema.

**P: ¿Puedo ver actividad de otros usuarios?**
R: Solo si eres superadmin. Admin y Limitado ven solo su actividad.

---

**Última actualización:** 2025-11-22
**Versión:** 1.0.0
