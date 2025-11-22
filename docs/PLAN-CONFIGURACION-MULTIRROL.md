# 🏗️ Plan de Implementación: Sistema de Configuración Multi-Rol

**Proyecto:** Sistema de Configuración Escalable para Monorepo
**Fecha de creación:** 2025-11-22
**Estado:** ⏸️ Pendiente de aprobación
**Versión:** 1.0.0

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estado Actual vs Objetivo](#estado-actual-vs-objetivo)
3. [Arquitectura Propuesta](#arquitectura-propuesta)
4. [Fases de Implementación](#fases-de-implementación)
5. [Criterios de Éxito](#criterios-de-éxito)
6. [Riesgos y Mitigación](#riesgos-y-mitigación)
7. [Timeline](#timeline)

---

## 📊 Resumen Ejecutivo

### Objetivo

Crear un sistema de configuración escalable preparado para el monorepo multi-módulo, con control granular de permisos por rol y una UI profesional tipo Shopify Settings.

### Problema Actual

❌ **Permisos no granulares:** Usuario "limitado" puede editar todo
❌ **No escalable:** Hard-coded para un solo módulo
❌ **UI básica:** 4 tabs horizontales sin estructura
❌ **Sin control de notificaciones:** No se puede configurar quién recibe qué
❌ **No preparado para monorepo:** No hay concepto de módulos

### Solución Propuesta

✅ **Sistema de permisos granular:** Control por recurso y acción
✅ **Multi-módulo:** Preparado para importaciones, inventario, tesorería, etc.
✅ **UI profesional:** Layout tipo Shopify con sidebar de navegación
✅ **Notificaciones configurables:** Control por evento y por rol
✅ **Escalable:** Agregar módulos sin refactorizar

### Beneficios Esperados

- 🔐 **Seguridad:** Control total de quién puede hacer qué
- 🚀 **Escalabilidad:** Agregar 10+ módulos sin cambiar código
- 🎨 **UX Mejorada:** Navegación clara y profesional
- ⚡ **Productividad:** Notificaciones relevantes por rol
- 📦 **Preparado para monorepo:** Base sólida para futuro

---

## 🔄 Estado Actual vs Objetivo

### Estado Actual

```
PÁGINA DE CONFIGURACIÓN ACTUAL
┌─────────────────────────────────────┐
│ MainLayout (sidebar principal)     │
│ ├─ 4 Tabs horizontales              │
│ │  ├─ Configuración                 │
│ │  ├─ Distribución                  │
│ │  ├─ Proveedores                   │
│ │  └─ Mi Cuenta                     │
│ └─ Permisos: Solo check isSuperAdmin│
└─────────────────────────────────────┘

ROLES ACTUALES
- Superadmin: Ve gestión de usuarios
- Admin: Ve todo igual que superadmin
- Limitado: Ve todo y puede editar TODO ❌

PROBLEMAS
❌ Limitado tiene demasiados permisos
❌ No hay diferenciación real entre roles
❌ No escalable para múltiples módulos
❌ UI básica y poco profesional
```

### Estado Objetivo

```
NUEVA PÁGINA DE CONFIGURACIÓN
┌─────────────────────────────────────────────────────┐
│ SettingsLayout (layout especial)                   │
│ ├─ Navbar (igual)                                   │
│ ├─ SettingsSidebar (nuevo - 14 secciones)          │
│ │  ├─ General (3)                                   │
│ │  ├─ Usuarios (3) - Solo Superadmin 👑            │
│ │  ├─ Notificaciones (3) - Solo Superadmin 👑      │
│ │  └─ Sistema (5)                                   │
│ └─ Contenido dinámico por sección                  │
└─────────────────────────────────────────────────────┘

ROLES MEJORADOS
- Superadmin: 14/14 secciones + gestión completa
- Admin: 5/14 secciones + operaciones completas
- Limitado: 5/14 secciones + SOLO LECTURA ✅

MEJORAS
✅ Permisos granulares (ver/crear/editar/eliminar)
✅ Roles diferenciados claramente
✅ Preparado para multi-módulo
✅ UI profesional tipo Shopify
✅ Notificaciones configurables
```

---

## 🏗️ Arquitectura Propuesta

### Nuevos Modelos de Datos

```prisma
// 1. Módulos del sistema
model Module {
  id          String @id @default(cuid())
  codigo      String @unique  // "importaciones", "inventario"
  nombre      String
  icono       String?
  activo      Boolean @default(true)
  orden       Int @default(0)

  configuraciones ModuleConfig[]
  permisos        ModulePermission[]
  notificaciones  ModuleNotification[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("modules")
}

// 2. Configuración por módulo
model ModuleConfig {
  id       String @id @default(cuid())
  moduleId String
  categoria String
  valor    String
  orden    Int @default(0)
  activo   Boolean @default(true)

  module Module @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@unique([moduleId, categoria, valor])
  @@map("module_configs")
}

// 3. Permisos por módulo y rol
model ModulePermission {
  id       String @id @default(cuid())
  moduleId String
  role     String
  recurso  String

  ver      Boolean @default(true)
  crear    Boolean @default(false)
  editar   Boolean @default(false)
  eliminar Boolean @default(false)
  exportar Boolean @default(false)

  module Module @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@unique([moduleId, role, recurso])
  @@map("module_permissions")
}

// 4. Notificaciones por módulo
model ModuleNotification {
  id        String @id @default(cuid())
  moduleId  String
  evento    String
  role      String
  habilitada Boolean @default(true)
  inApp     Boolean @default(true)
  email     Boolean @default(false)

  module Module @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@unique([moduleId, evento, role])
  @@map("module_notifications")
}
```

### Nueva Estructura de Archivos

```
app/(pages)/configuracion/
├── layout.tsx                    # ✨ NUEVO - SettingsLayout
├── page.tsx                      # ♻️ MODIFICADO
└── components/                   # ✨ NUEVO
    ├── SettingsSidebar.tsx
    ├── sections/
    │   ├── GeneralSettings.tsx
    │   ├── DistributionSettings.tsx
    │   ├── ProvidersSettings.tsx
    │   ├── UsersManagement.tsx   # Solo Superadmin
    │   ├── RolesPermissions.tsx  # Solo Superadmin
    │   ├── NotificationSettings.tsx # Solo Superadmin
    │   └── AccountSettings.tsx
    └── shared/
        ├── PermissionGuard.tsx
        └── ReadOnlyBadge.tsx

lib/hooks/
└── usePermissions.ts             # ✨ NUEVO

packages/settings/                # ✨ NUEVO (para monorepo)
├── package.json
├── src/
│   ├── types.ts
│   ├── modules/
│   │   ├── importaciones.ts
│   │   ├── inventario.ts
│   │   └── index.ts
│   └── index.ts
└── tsconfig.json
```

---

## 🚀 Fases de Implementación

### **FASE 1: Backend - Modelos y APIs** ⏱️ 4-6 horas

**Objetivo:** Crear base de datos y APIs sin afectar frontend actual

#### 1.1 Migración de Base de Datos

**Archivo:** `prisma/migrations/xxx_add_module_system.sql`

```bash
# Ejecutar
npx prisma migrate dev --name add_module_system
```

**Tablas a crear:**

- `modules`
- `module_configs`
- `module_permissions`
- `module_notifications`

#### 1.2 Seed Inicial

**Archivo:** `prisma/seed-modules.ts`

```typescript
// Solo módulo "importaciones" activo
await prisma.module.create({
  data: {
    codigo: "importaciones",
    nombre: "Sistema de Importaciones",
    icono: "Package",
    activo: true,
    orden: 1,
  },
})

// Permisos por defecto para cada rol
const permisosPorDefecto = [
  // Superadmin - todo
  {
    moduleId: "importaciones",
    role: "superadmin",
    recurso: "configuracion",
    ver: true,
    crear: true,
    editar: true,
    eliminar: true,
  },

  // Admin - operaciones completas
  {
    moduleId: "importaciones",
    role: "admin",
    recurso: "configuracion",
    ver: true,
    crear: true,
    editar: true,
    eliminar: false,
  },

  // Limitado - solo lectura
  {
    moduleId: "importaciones",
    role: "limitado",
    recurso: "configuracion",
    ver: true,
    crear: false,
    editar: false,
    eliminar: false,
  },
]
```

#### 1.3 APIs Nuevas

**Crear archivos:**

```bash
app/api/modules/route.ts                     # GET /api/modules
app/api/modules/[id]/config/route.ts         # GET/PUT
app/api/modules/[id]/permissions/route.ts    # GET/PUT
app/api/modules/[id]/notifications/route.ts  # GET/PUT
```

**Ejemplo:** `app/api/modules/route.ts`

```typescript
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const modulos = await prisma.module.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
    include: {
      _count: {
        select: {
          configuraciones: true,
          permisos: true,
        },
      },
    },
  })

  return NextResponse.json({ success: true, data: modulos })
}
```

#### 1.4 Hook de Permisos

**Archivo:** `lib/hooks/usePermissions.ts`

```typescript
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"

const PERMISOS_POR_ROL = {
  superadmin: {
    configuracion: { ver: true, editar: true, eliminar: true },
    usuarios: { ver: true, crear: true, editar: true, eliminar: true },
    notificaciones: { ver: true, editar: true },
  },
  admin: {
    configuracion: { ver: true, editar: true, eliminar: false },
    usuarios: { ver: false },
    notificaciones: { ver: false },
  },
  limitado: {
    configuracion: { ver: true, editar: false },
    usuarios: { ver: false },
    notificaciones: { ver: false },
  },
}

export function usePermissions() {
  const { data: session } = useSession()
  const role = session?.user?.role || "limitado"

  return {
    can: (accion: string, recurso: string) => {
      const permisos = PERMISOS_POR_ROL[role]?.[recurso]
      return permisos?.[accion] || false
    },
    role,
    isSuperAdmin: role === "superadmin",
    isAdmin: role === "admin",
    isLimitado: role === "limitado",
  }
}
```

**✅ Criterios de Éxito Fase 1:**

- [ ] Migración aplicada sin errores
- [ ] Seed ejecutado correctamente
- [ ] APIs responden correctamente
- [ ] Hook usePermissions funciona
- [ ] App actual funciona SIN CAMBIOS

---

### **FASE 2: Paquete Compartido (Monorepo)** ⏱️ 2-3 horas

**Objetivo:** Crear paquete `@curet/settings` con configuraciones

#### 2.1 Crear Estructura

```bash
cd ~/curet-monorepo/packages
mkdir -p settings/src/modules
cd settings
pnpm init
```

#### 2.2 Archivos del Paquete

**`packages/settings/package.json`**

```json
{
  "name": "@curet/settings",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "private": true
}
```

**`packages/settings/src/types.ts`**

```typescript
export interface ModuloConfig {
  id: string
  codigo: string
  nombre: string
  icono: string
  activo: boolean
  categorias: CategoriaConfig[]
}

export interface CategoriaConfig {
  id: string
  nombre: string
  items: string[]
  tipo: "select" | "multiselect" | "text" | "number"
}
```

**`packages/settings/src/modules/importaciones.ts`**

```typescript
import { ModuloConfig } from "../types"

export const importacionesConfig: ModuloConfig = {
  id: "importaciones",
  codigo: "importaciones",
  nombre: "Sistema de Importaciones",
  icono: "Package",
  activo: true,
  categorias: [
    {
      id: "categorias",
      nombre: "Categorías de Productos",
      items: ["Zapatos", "Carteras", "Cinturones", "Accesorios"],
      tipo: "multiselect",
    },
    // ... más categorías
  ],
}
```

#### 2.3 Integrar en App

**`apps/importaciones/package.json`**

```json
{
  "dependencies": {
    "@curet/settings": "workspace:*"
  }
}
```

```bash
cd ~/curet-monorepo
pnpm install
```

**✅ Criterios de Éxito Fase 2:**

- [ ] Paquete `@curet/settings` creado
- [ ] App puede importar: `import { MODULOS } from "@curet/settings"`
- [ ] No hay errores de compilación

---

### **FASE 3: Nuevo Layout de Configuración** ⏱️ 6-8 horas

**Objetivo:** Crear layout especial con sidebar de navegación

#### 3.1 Crear SettingsLayout

**Archivo:** `app/(pages)/configuracion/layout.tsx`

```typescript
import { ReactNode } from "react"
import Navbar from "@/components/layout/Navbar"
import { SettingsSidebar } from "./components/SettingsSidebar"

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen bg-shopify-navbar overflow-hidden">
      <Navbar />
      <SettingsSidebar />

      <main className="ml-64 mt-16 h-[calc(100vh-4rem)] flex flex-col">
        <div className="bg-[#F5F6F7] rounded-tr-3xl shadow-sm flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-10 py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
```

#### 3.2 Crear SettingsSidebar

**Archivo:** `app/(pages)/configuracion/components/SettingsSidebar.tsx`

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePermissions } from "@/lib/hooks/usePermissions"
import {
  Settings, Calculator, Users, Bell,
  Shield, Mail, Activity, FileText,
  UserCircle, ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: any
  rolesPermitidos: string[]
}

const NAV_SECTIONS = [
  {
    titulo: "General",
    items: [
      { href: "/configuracion#general", label: "Configuraciones", icon: Settings, rolesPermitidos: ["all"] },
      { href: "/configuracion#distribucion", label: "Distribución", icon: Calculator, rolesPermitidos: ["all"] },
      { href: "/configuracion#proveedores", label: "Proveedores", icon: Users, rolesPermitidos: ["all"] },
    ]
  },
  {
    titulo: "Usuarios y Permisos",
    items: [
      { href: "/configuracion#usuarios", label: "Gestión", icon: UserCircle, rolesPermitidos: ["superadmin"] },
      { href: "/configuracion#roles", label: "Roles", icon: Shield, rolesPermitidos: ["superadmin"] },
      { href: "/configuracion#invitaciones", label: "Invitaciones", icon: Mail, rolesPermitidos: ["superadmin"] },
    ]
  },
  {
    titulo: "Notificaciones",
    items: [
      { href: "/configuracion#notif-general", label: "General", icon: Bell, rolesPermitidos: ["superadmin"] },
      { href: "/configuracion#notif-eventos", label: "Por Evento", icon: Bell, rolesPermitidos: ["superadmin"] },
      { href: "/configuracion#notif-roles", label: "Por Rol", icon: Bell, rolesPermitidos: ["superadmin"] },
    ]
  },
  {
    titulo: "Sistema",
    items: [
      { href: "/configuracion#cuenta", label: "Mi Cuenta", icon: UserCircle, rolesPermitidos: ["all"] },
      { href: "/configuracion#actividad", label: "Actividad", icon: Activity, rolesPermitidos: ["all"] },
    ]
  }
]

export function SettingsSidebar() {
  const pathname = usePathname()
  const { role, isSuperAdmin } = usePermissions()

  // Filtrar secciones según permisos
  const seccionesFiltradas = NAV_SECTIONS.map(seccion => ({
    ...seccion,
    items: seccion.items.filter(item =>
      item.rolesPermitidos.includes("all") ||
      item.rolesPermitidos.includes(role)
    )
  })).filter(seccion => seccion.items.length > 0)

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-[#E8E9EA] border-r overflow-y-auto z-40 rounded-tl-3xl">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-gray-700" />
          <h2 className="font-semibold text-gray-900">Configuración</h2>
        </div>
        {isSuperAdmin && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
            Super Admin
          </span>
        )}
      </div>

      {/* Navegación */}
      <nav className="p-3 space-y-6">
        {seccionesFiltradas.map((seccion, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              {seccion.titulo}
            </h3>
            <div className="space-y-1">
              {seccion.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname + window.location.hash === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-shopify-surface-selected text-shopify-primary font-semibold"
                        : "text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 mt-auto">
        <Link href="/panel">
          <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-200">
            <ArrowLeft className="w-4 h-4" />
            Volver al Panel
          </button>
        </Link>
      </div>
    </aside>
  )
}
```

#### 3.3 Actualizar Página Principal

**Archivo:** `app/(pages)/configuracion/page.tsx`

```typescript
"use client"

import { useEffect, useState } from "react"
import { usePermissions } from "@/lib/hooks/usePermissions"
import GeneralSettings from "./components/sections/GeneralSettings"
import DistributionSettings from "./components/sections/DistributionSettings"
import ProvidersSettings from "./components/sections/ProvidersSettings"
import UsersManagement from "./components/sections/UsersManagement"
import RolesPermissions from "./components/sections/RolesPermissions"
import NotificationSettings from "./components/sections/NotificationSettings"
import AccountSettings from "./components/sections/AccountSettings"
import ActivityLog from "./components/sections/ActivityLog"

export default function ConfiguracionPage() {
  const [activeSection, setActiveSection] = useState("general")
  const { can } = usePermissions()

  // Detectar hash de URL
  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash) setActiveSection(hash)

    const handleHashChange = () => {
      const newHash = window.location.hash.replace("#", "")
      setActiveSection(newHash || "general")
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  // Renderizar sección según hash
  const renderSection = () => {
    switch(activeSection) {
      case "general":
        return <GeneralSettings />
      case "distribucion":
        return <DistributionSettings />
      case "proveedores":
        return <ProvidersSettings />
      case "usuarios":
        return can('ver', 'usuarios') ? <UsersManagement /> : <NoPermission />
      case "roles":
        return can('ver', 'usuarios') ? <RolesPermissions /> : <NoPermission />
      case "invitaciones":
        return can('ver', 'usuarios') ? <InvitationsList /> : <NoPermission />
      case "notif-general":
      case "notif-eventos":
      case "notif-roles":
        return can('ver', 'notificaciones') ? <NotificationSettings section={activeSection} /> : <NoPermission />
      case "cuenta":
        return <AccountSettings />
      case "actividad":
        return <ActivityLog />
      default:
        return <GeneralSettings />
    }
  }

  return (
    <div className="space-y-6">
      {renderSection()}
    </div>
  )
}

function NoPermission() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">No tienes permisos para ver esta sección</p>
    </div>
  )
}
```

**✅ Criterios de Éxito Fase 3:**

- [ ] Layout especial funciona
- [ ] Sidebar muestra secciones según rol
- [ ] Navegación por hash funciona
- [ ] No rompe app actual

---

### **FASE 4: Componentes de Secciones** ⏱️ 8-10 horas

**Objetivo:** Crear componentes para cada sección

#### 4.1 General Settings (con permisos)

**Archivo:** `app/(pages)/configuracion/components/sections/GeneralSettings.tsx`

```typescript
"use client"

import { usePermissions } from "@/lib/hooks/usePermissions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"

export default function GeneralSettings() {
  const { can } = usePermissions()
  const puedeEditar = can('editar', 'configuracion')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuraciones del Sistema</h1>
        <p className="text-gray-500 mt-1">
          Gestiona las configuraciones dinámicas del módulo de importaciones
        </p>
        {!puedeEditar && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-600">
            👁️ Solo lectura - No tienes permisos para editar
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categorías */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Categorías Principales</CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Categorías disponibles para las órdenes de compra
                </p>
              </div>
              {puedeEditar && (
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["Zapatos", "Carteras", "Cinturones"].map(cat => (
                <div key={cat} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded border">
                  <span className="text-sm">{cat}</span>
                  {puedeEditar && (
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Edit className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-red-100 rounded">
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Más categorías... */}
      </div>
    </div>
  )
}
```

#### 4.2 Otros Componentes

Crear de forma similar:

- `DistributionSettings.tsx` (reutilizar existente)
- `ProvidersSettings.tsx` (reutilizar existente)
- `UsersManagement.tsx` (mover de page.tsx)
- `RolesPermissions.tsx` (NUEVO)
- `NotificationSettings.tsx` (NUEVO)
- `AccountSettings.tsx` (mover de page.tsx)
- `ActivityLog.tsx` (mover de page.tsx)

**✅ Criterios de Éxito Fase 4:**

- [ ] Todos los componentes creados
- [ ] Permisos funcionan correctamente
- [ ] Limitado ve solo lectura
- [ ] Admin puede editar
- [ ] Superadmin ve todo

---

### **FASE 5: Notificaciones Configurables** ⏱️ 4-6 horas

**Objetivo:** Sistema de configuración de notificaciones

#### 5.1 Componente de Configuración

**Archivo:** `app/(pages)/configuracion/components/sections/NotificationSettings.tsx`

```typescript
"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

const EVENTOS = [
  { id: "oc_creada", nombre: "OC Creada", icono: "📦", prioridad: "normal" },
  { id: "pago_creado", nombre: "Pago Registrado", icono: "💰", prioridad: "high" },
  { id: "inventario_recibido", nombre: "Inventario Recibido", icono: "📥", prioridad: "normal" },
]

const ROLES = ["admin", "contador", "almacen", "limitado"]

export default function NotificationSettings({ section }: { section: string }) {
  if (section === "notif-eventos") {
    return <NotifPorEvento />
  } else if (section === "notif-roles") {
    return <NotifPorRol />
  }
  return <NotifGeneral />
}

function NotifPorRol() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones por Rol</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Evento</th>
              {ROLES.map(role => (
                <th key={role} className="text-center py-2 capitalize">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EVENTOS.map(evento => (
              <tr key={evento.id} className="border-b">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span>{evento.icono}</span>
                    <span className="text-sm">{evento.nombre}</span>
                  </div>
                </td>
                {ROLES.map(role => (
                  <td key={role} className="text-center py-3">
                    <Switch />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
```

**✅ Criterios de Éxito Fase 5:**

- [ ] Configuración de notificaciones funciona
- [ ] Se puede activar/desactivar por rol
- [ ] Cambios se guardan en BD
- [ ] Solo superadmin puede acceder

---

### **FASE 6: Testing y Refinamiento** ⏱️ 4-6 horas

**Objetivo:** Probar todo el sistema y refinar detalles

#### 6.1 Checklist de Testing

**Probar con cada rol:**

```
SUPERADMIN
- [ ] Ve 14 secciones en sidebar
- [ ] Puede editar configuraciones
- [ ] Puede gestionar usuarios
- [ ] Puede configurar notificaciones
- [ ] Ve actividad de todos

ADMIN
- [ ] Ve 5 secciones en sidebar
- [ ] Puede editar configuraciones
- [ ] NO ve gestión de usuarios
- [ ] NO ve config de notificaciones
- [ ] Ve solo su actividad

LIMITADO
- [ ] Ve 5 secciones en sidebar
- [ ] Solo puede VER configuraciones (no editar)
- [ ] NO ve gestión de usuarios
- [ ] NO ve config de notificaciones
- [ ] Ve solo su actividad
```

#### 6.2 Casos de Prueba

1. **Navegación:**
   - Sidebar muestra secciones correctas según rol
   - Hash de URL funciona correctamente
   - Botón "Volver al Panel" funciona

2. **Permisos:**
   - Limitado no puede editar nada
   - Admin puede editar pero no eliminar
   - Superadmin puede hacer todo

3. **Responsivo:**
   - Sidebar se adapta en mobile
   - Contenido se ajusta correctamente

**✅ Criterios de Éxito Fase 6:**

- [ ] Todos los tests pasan
- [ ] No hay errores en consola
- [ ] Performance es buena
- [ ] UX es fluida

---

## ✅ Criterios de Éxito Global

### Funcionales

- [ ] Sistema de permisos funciona correctamente
- [ ] Limitado tiene SOLO lectura
- [ ] Admin puede operar sin gestionar usuarios
- [ ] Superadmin tiene acceso total
- [ ] Notificaciones configurables funcionan
- [ ] Preparado para agregar módulos

### Técnicos

- [ ] 0 errores de TypeScript
- [ ] 0 errores en consola
- [ ] Tests unitarios pasan
- [ ] Performance < 2s carga inicial
- [ ] Responsive en mobile/tablet/desktop

### UX

- [ ] Navegación clara e intuitiva
- [ ] Feedback visual de permisos (badges "Solo lectura")
- [ ] Loading states en todas las operaciones
- [ ] Mensajes de error claros

### Documentación

- [ ] README actualizado
- [ ] Comentarios en código complejo
- [ ] Guía de usuario creada
- [ ] Documentación de APIs

---

## ⚠️ Riesgos y Mitigación

### Riesgo 1: Romper funcionalidad actual ⚠️ ALTO

**Mitigación:**

- Implementación incremental
- Fase 1 no toca frontend
- Testing exhaustivo antes de deploy
- Rollback plan preparado

### Riesgo 2: Performance con muchos módulos ⚠️ MEDIO

**Mitigación:**

- Lazy loading de componentes
- Paginación en listas largas
- Caché de queries con React Query
- Índices en base de datos

### Riesgo 3: Complejidad de permisos ⚠️ MEDIO

**Mitigación:**

- Sistema simple de inicio
- Documentación clara
- UI visual para configurar
- Defaults seguros

### Riesgo 4: Curva de aprendizaje ⚠️ BAJO

**Mitigación:**

- UI intuitiva tipo Shopify
- Tooltips y ayuda contextual
- Guía de usuario
- Videos de capacitación

---

## 📅 Timeline

### Escenario Normal (Trabajo parcial - 2-3h/día)

```
Semana 1:
├─ Día 1-2: FASE 1 (Backend) ████████░░
├─ Día 3:   FASE 2 (Paquete) ████░░░░░░
└─ Día 4-5: Review y testing ████░░░░░░

Semana 2:
├─ Día 1-3: FASE 3 (Layout)  ████████████
└─ Día 4-5: FASE 4 (inicio)  ████████░░░░

Semana 3:
├─ Día 1-3: FASE 4 (cont)    ████████████
├─ Día 4:   FASE 5 (Notif)   ████████░░░░
└─ Día 5:   Testing          ████░░░░░░░░

Semana 4:
└─ Día 1-2: FASE 6 (Testing) ████████████

TOTAL: ~25 días (50-60 horas)
```

### Escenario Rápido (Trabajo intensivo - 6-8h/día)

```
Día 1: FASE 1 + FASE 2       ████████████
Día 2: FASE 3                ████████████
Día 3: FASE 4 (parte 1)      ████████████
Día 4: FASE 4 (parte 2)      ████████████
Día 5: FASE 5 + FASE 6       ████████████

TOTAL: 5 días (40 horas)
```

---

## 📝 Notas Adicionales

### Decisiones de Arquitectura

**¿Por qué layout especial en vez de tabs?**

- Más escalable (14+ secciones)
- UX profesional tipo Shopify
- Mejor organización visual
- Preparado para móvil

**¿Por qué hook de permisos en vez de checks directos?**

- Centralizado y mantenible
- Fácil de testear
- Reutilizable en toda la app
- Migración futura a API

**¿Por qué paquete compartido?**

- Preparado para monorepo
- Configuraciones centralizadas
- Fácil agregar módulos
- Single source of truth

### Próximos Pasos (Post-Implementación)

1. **Crear roles adicionales:** Contador, Almacén
2. **Agregar módulo Inventario**
3. **Implementar notificaciones email**
4. **Agregar audit log avanzado**
5. **Crear dashboard de configuración**

---

## 🎯 Estado del Proyecto

**Versión:** 1.0.0
**Estado:** ⏸️ Pendiente de aprobación
**Última actualización:** 2025-11-22
**Autor:** Claude + Ronaldo Paulino

### Checklist de Aprobación

- [x] Documentación completa
- [ ] Plan revisado por equipo
- [ ] Recursos asignados
- [ ] Timeline aprobado
- [ ] Riesgos entendidos
- [ ] Inicio autorizado

---

**Una vez aprobado este plan, procederemos con FASE 1** 🚀
