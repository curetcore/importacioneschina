# Changelog - Sistema de Importaciones Curet

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [2.1.0] - 2025-01-21

### 🎯 SPRINT: Sistema de Comentarios Avanzado y Gestión de Perfiles

Sprint completo enfocado en funcionalidades colaborativas y personalización de usuario. **19 tareas completadas**, **20+ archivos modificados**, **2 nuevas dependencias**.

---

### ✨ Agregado

#### **🗣️ Sistema de Comentarios Anidados (Threaded Replies)**

Implementación completa de conversaciones jerárquicas en comentarios:

- **Respuestas anidadas** hasta 5 niveles de profundidad
- **Componente recursivo** `CommentThread` con indentación visual automática
- **Botón "Responder"** contextual en cada comentario
- **Indicador visual de nivel** con `border-left` y padding progresivo
- **Límite automático** de anidación para mejor UX (maxNestingLevel = 5)
- **Markdown support** en respuestas
- **Subida de archivos** en respuestas
- **Menciones** de usuarios en threads

**Archivos creados:**

- `components/comments/CommentReplyForm.tsx` - Formulario de respuestas

**Archivos modificados:**

- `prisma/schema.prisma` - Campo `parentId` con relación auto-referencial
- `components/comments/CommentThread.tsx` - Lógica recursiva
- `components/comments/CommentsSection.tsx` - Integración de threads

**Características técnicas:**

```typescript
interface Comment {
  parentId: string | null // null = comentario raíz
  replies?: Comment[] // Array recursivo de respuestas
}

const maxNestingLevel = 5 // Previene threads excesivamente profundos
```

---

#### **🖼️ Sistema Completo de Gestión de Fotos de Perfil**

Sistema profesional de upload y edición de fotos de perfil estilo Instagram:

**1. Editor Interactivo con Crop Avanzado:**

- Recorte circular forzado (`cropShape="round"`)
- Control de zoom: 1x - 3x con slider
- Control de rotación: 0° - 360° con slider
- Preview en tiempo real
- Canvas API para procesamiento de imagen
- Compresión JPEG con calidad 95%

**2. Persistencia y Sincronización:**

- JWT actualización automática con `trigger="update"`
- Session refresh con NextAuth
- Foto visible en toda la aplicación instantáneamente
- No requiere refresh manual de página

**3. Ubicaciones de Visualización:**

- ✅ Navbar (dropdown de usuario)
- ✅ Sidebar (lista de usuarios conectados)
- ✅ Comentarios (avatar del autor)
- ✅ Modal de perfil
- ✅ Página de configuración
- ✅ Usuarios Conectados en tiempo real

**4. UI Mejorada:**

- Botón "Reemplazar" cuando ya hay foto (UX clara)
- Botón "Eliminar" para remover foto
- Preview de foto actual antes de editar
- Solo icono placeholder si no hay foto

**Archivos creados:**

- `components/user/ProfilePhotoEditor.tsx` - Editor principal con Cropper
- `components/ui/slider.tsx` - Control deslizante Radix UI
- `lib/image-crop-helper.ts` - Utilidades de procesamiento Canvas

**Archivos modificados:**

- `lib/auth-options.ts` - JWT callback con trigger update
- `app/providers.tsx` - SessionProvider con refetch
- `components/layout/UserDropdown.tsx` - Avatar en navbar
- `components/layout/UserPresenceItem.tsx` - Avatar en sidebar
- `components/user/UserProfileModal.tsx` - UI mejorada
- `components/comments/CommentThread.tsx` - Avatar en comentarios

**Nuevas dependencias:**

```json
{
  "react-easy-crop": "^5.0.0",
  "@radix-ui/react-slider": "^1.1.2"
}
```

**Código clave:**

```typescript
// Crop con Canvas API
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number
): Promise<Blob> {
  // Canvas processing...
  return blob // JPEG 95% quality
}

// JWT Update Trigger
jwt({ token, user, trigger, session }) {
  if (trigger === "update" && session) {
    // Fetch fresh user data from DB
    const updatedUser = await prisma.user.findUnique(...)
    return { ...token, ...updatedUser }
  }
}
```

---

### 🎨 Cambiado

#### **Página de Documentos - Layout Optimizado**

Reorganización del header para mejor uso del espacio horizontal:

**Antes:**

```
Documentos (15)
[Buscar...........] [Filtrar OC]
```

**Después:**

```
Documentos (15) [Buscar...................] [Filtrar OC]
```

**Beneficios:**

- Título, buscador y filtro en una sola línea
- Mejor aprovechamiento del espacio
- UI más limpia y compacta

**Archivo:** `app/(pages)/documentos/page.tsx`

---

#### **Invitaciones - Filtrado Inteligente**

Lista de invitaciones ahora solo muestra pendientes:

- Filtro automático: `status === "pending"`
- Invitaciones aceptadas se ocultan automáticamente
- Status badges sin iconos redundantes
- Título actualizado: "Invitaciones Pendientes"

**Código:**

```typescript
const invitations = (data?.data || []).filter(inv => inv.status === "pending")
```

**Archivo:** `components/admin/InvitationsList.tsx`

---

#### **Usuarios Conectados - Sin Duplicados**

Lógica mejorada para evitar que usuarios aparezcan duplicados:

**Problema anterior:** Usuario aparecía en "Conectados" Y "Desconectados recientemente"

**Solución:**

```typescript
// Filtrar usuarios online de la lista de recientes
const filteredRecentUsers = recentUsers.filter(
  recentUser => !onlineUsers.some(onlineUser => onlineUser.id === recentUser.id)
)
```

**Resultado:** Separación clara entre usuarios activos e inactivos

**Archivo:** `hooks/useOnlinePresence.ts`

---

### 🐛 Corregido

#### **1. Error: Module not found '@/components/ui/slider'**

- **Causa:** Falta librería Radix UI Slider
- **Fix:** `npm install @radix-ui/react-slider` + componente creado
- **Archivo:** `components/ui/slider.tsx`

#### **2. TypeScript Error: Status Comparison**

- **Error:** `This comparison appears to be unintentional because the types have no overlap`
- **Causa:** Orden incorrecto en comparación de tipos
- **Fix:** Cambiar a `status === "loading" || !session?.user`
- **Archivo:** `components/layout/UserDropdown.tsx`

#### **3. Foto de Perfil No Persiste Después de Upload**

- **Causa:** JWT no se actualizaba automáticamente después de cambios
- **Fix:** Implementado `trigger === "update"` en JWT callback de NextAuth
- **Impacto:** Ahora las fotos persisten instantáneamente sin refresh
- **Archivo:** `lib/auth-options.ts`

#### **4. Foto de Perfil Rota en Comentarios**

- **Causa:** Next.js Image optimization fallaba con uploads locales
- **Fix:** Agregado prop `unoptimized` a todos los componentes Image
- **Archivos:** Múltiples componentes con Image

#### **5. Emojis Apilados Verticalmente**

- **Problema:** EmojiPicker mostraba emojis en columna única
- **Causa:** Grid sin ancho mínimo + gap insuficiente
- **Fix:** `grid-cols-6 gap-2 min-w-[220px]`
- **Resultado:** Grid 6x2 con espaciado uniforme
- **Archivo:** `components/reactions/EmojiPicker.tsx`

#### **6. Superadmin Sin Acceso a Vista de Perfil**

- **Causa:** Lógica de renderizado excluía rol superadmin
- **Fix:** Reorganización de UI para incluir todos los roles
- **Archivo:** `app/(pages)/configuracion/page.tsx`

#### **7. Límite de Anidación en Comentarios Muy Restrictivo**

- **Antes:** 3 niveles (muy limitado)
- **Después:** 5 niveles (conversaciones más profundas)
- **Archivo:** `components/comments/CommentThread.tsx`

#### **8. Overscroll Bounce Effect en MainContent**

- **Problema:** MainContent se estiraba visualmente (efecto "rubber band") al hacer scroll más allá de límites
- **Impacto visual:** Parecía que el contenido se "despegaba" del navbar y footer
- **Solución implementada:**
  1. **Global CSS:** Cambio de `overscroll-behavior-y: contain` → `none`
  2. **MainLayout:** Agregada clase `overscroll-none` al contenedor principal
- **Resultado:**
  - ✅ Sin bounce/rubber band effect
  - ✅ Mouse wheel funciona normal
  - ✅ Trackpad funciona normal
  - ✅ Swipe horizontal (navegación back/forward) funciona
  - ✅ Comportamiento idéntico a Shopify Admin
- **Archivos:**
  - `app/globals.css`
  - `components/layout/MainLayout.tsx`

---

### 📊 Estadísticas del Sprint

**Archivos Modificados:** 20+

**Por Categoría:**

- Componentes: 12 archivos
- Páginas: 2 archivos
- Hooks: 1 archivo
- Utilidades: 2 archivos
- Configuración: 3 archivos
- Schema: 1 archivo

**Líneas de Código:**

- Agregadas: ~1,500 líneas
- Modificadas: ~300 líneas
- Eliminadas: ~50 líneas

**Commits principales:**

```bash
c7b9d2f - Fix: Prevent overscroll bounce effect on MainContent
69cac9e - Fix: Filter duplicate users in OnlinePresence
[...] - Feature: Threaded replies system (Phase 3C)
[...] - Feature: Profile photo management with Instagram-style crop
[...] - Fix: Various UI/UX improvements
```

---

### 🔧 Configuración Técnica

#### **Next.js Image Config**

```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
}
```

#### **NextAuth JWT Update Callback**

```typescript
// lib/auth-options.ts
callbacks: {
  async jwt({ token, user, trigger, session }) {
    // Initial sign in
    if (user) {
      token.id = user.id
      token.role = user.role
      token.profilePhoto = user.profilePhoto
    }

    // Handle session updates (cuando se llama update())
    if (trigger === "update" && session) {
      const updatedUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: {
          id: true,
          name: true,
          lastName: true,
          role: true,
          profilePhoto: true,
        },
      })

      if (updatedUser) {
        token.name = updatedUser.name
        token.lastName = updatedUser.lastName
        token.role = updatedUser.role
        token.profilePhoto = updatedUser.profilePhoto
      }
    }

    return token
  }
}
```

#### **SessionProvider Config**

```typescript
// app/providers.tsx
<SessionProvider
  refetchInterval={0}
  refetchOnWindowFocus={true}
  refetchWhenOffline={false}
>
  {children}
</SessionProvider>
```

#### **Overscroll Behavior**

```css
/* app/globals.css */
html,
body {
  overscroll-behavior-y: none; /* Previene bounce vertical */
}
```

```tsx
/* components/layout/MainLayout.tsx */
<div className="overflow-y-auto overscroll-none">{/* Contenido */}</div>
```

---

### 🚀 Testing Realizado

**Funcionalidades testeadas:**

- ✅ Upload de foto de perfil (múltiples formatos)
- ✅ Crop circular con zoom 1x-3x
- ✅ Rotación 0°-360° con visualización en tiempo real
- ✅ Persistencia de foto en sesión JWT
- ✅ Visualización en múltiples ubicaciones simultáneas
- ✅ Comentarios anidados hasta 5 niveles
- ✅ Reacciones con emoji en grid correcto
- ✅ Filtrado de invitaciones pendientes
- ✅ Usuarios conectados sin duplicados
- ✅ Overscroll behavior en todas las páginas
- ✅ Navegación back/forward con swipe horizontal

**Navegadores testeados:**

- ✅ Chrome (Desktop - macOS)
- ✅ Safari (macOS 14+)
- ✅ Safari (iOS - overscroll)
- ✅ Firefox (Desktop)

---

### ⚠️ Breaking Changes

**Ninguno.** Todos los cambios son backward compatible.

---

### 📝 Notas de Migración

#### **Para Desarrolladores:**

1. **Actualizar dependencias:**

   ```bash
   npm install react-easy-crop @radix-ui/react-slider
   ```

2. **JWT Sessions:**
   - Las sesiones ahora soportan `update()` para refrescar datos
   - Usar `update()` después de cambios en perfil de usuario
   - Ejemplo:

     ```typescript
     import { useSession } from "next-auth/react"
     const { update } = useSession()

     // Después de actualizar perfil
     await update()
     ```

3. **Next.js Images con Uploads Locales:**
   - Usar prop `unoptimized` para uploads locales
   - Usar `key={url}` para forzar re-render en cambios
   - Ejemplo:
     ```tsx
     <Image key={profilePhoto} src={profilePhoto} unoptimized />
     ```

4. **Overscroll Behavior:**
   - Usar `overscroll-none` en contenedores con scroll
   - Combinar con CSS global `overscroll-behavior-y: none`

5. **Comentarios Anidados:**
   - Usar campo `parentId` para replies
   - Respetar `maxNestingLevel` de 5
   - Componente recursivo requiere base case

#### **Para Usuarios:**

1. **Fotos de Perfil:**
   - Subir foto desde Configuración → Mi Cuenta
   - Usar editor para ajustar encuadre
   - Foto aparecerá automáticamente en toda la app

2. **Comentarios:**
   - Usar botón "Responder" para crear threads
   - Máximo 5 niveles de profundidad
   - Markdown soportado en respuestas

---

### 🎯 Próximos Pasos

#### **Corto Plazo:**

- [ ] Testing E2E de comentarios anidados
- [ ] Optimización de subida de imágenes grandes (>5MB)
- [ ] Notificaciones push para menciones en threads
- [ ] Búsqueda full-text en comentarios

#### **Mediano Plazo:**

- [ ] Sistema de moderación de comentarios
- [ ] Analytics de engagement (reacciones, replies)
- [ ] Export de threads (PDF/Markdown)
- [ ] Integración Discord/Slack

#### **Largo Plazo:**

- [ ] IA para resumen de conversaciones
- [ ] Traducción automática de comentarios
- [ ] Video comments con timestamps
- [ ] Voice notes en comentarios

---

### 📦 Dependencias Actualizadas

```json
{
  "dependencies": {
    "react-easy-crop": "^5.0.0",
    "@radix-ui/react-slider": "^1.1.2"
  }
}
```

**Instalación:**

```bash
npm install react-easy-crop @radix-ui/react-slider
```

---

### 👥 Contribuidores

- **Ronaldo Paulino** - Product Owner & QA
- **Claude (Anthropic)** - Development Assistant

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
