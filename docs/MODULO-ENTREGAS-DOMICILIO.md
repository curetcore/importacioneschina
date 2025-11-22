# 🚚 Módulo de Entregas a Domicilio - CuretCore

**Estado:** 📋 Planificación (Futuro módulo del monorepo)
**Prioridad:** Media
**Tipo:** Módulo independiente para monorepo CuretCore
**Fecha:** 2025-11-22

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura Multi-Plataforma](#arquitectura-multi-plataforma)
3. [Flujo de Trabajo Real](#flujo-de-trabajo-real)
4. [Roles y Permisos](#roles-y-permisos)
5. [Stack Tecnológico](#stack-tecnológico)
6. [Esquema de Base de Datos](#esquema-de-base-de-datos)
7. [Interfaces por Rol](#interfaces-por-rol)
8. [APIs y Endpoints](#apis-y-endpoints)
9. [Integración con Monorepo](#integración-con-monorepo)
10. [Estimación y Roadmap](#estimación-y-roadmap)
11. [Costos Operacionales](#costos-operacionales)

---

## 🎯 Visión General

### Objetivo

Sistema completo de gestión de entregas a domicilio con tracking en tiempo real, optimización de rutas, y multi-rol (Admin, Driver, Cliente).

### Problema que Resuelve

**Situación actual:**

- Entregas se coordinan manualmente por WhatsApp
- No hay visibilidad de dónde están los drivers
- Clientes preguntan constantemente "¿dónde está mi pedido?"
- Rutas no optimizadas = más gasolina y tiempo
- Pruebas de entrega en papel = se pierden

**Con este módulo:**

- ✅ Tracking en tiempo real (GPS)
- ✅ Rutas optimizadas automáticamente
- ✅ Clientes ven su pedido en vivo (menos llamadas)
- ✅ Prueba de entrega digital (foto + firma)
- ✅ Reportes de eficiencia

### Casos de Uso

1. **E-commerce / Retail** - Entregas de productos vendidos online
2. **Distribución** - Entregas B2B a tiendas/negocios
3. **Logística** - Last-mile delivery
4. **Restaurantes/Food delivery** - Entregas de comida (con adaptaciones)

---

## 🏗️ Arquitectura Multi-Plataforma

### Diseño de 3 Capas

```
┌─────────────────────────────────────────────────────────┐
│                   CURETCORE MONOREPO                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   ADMIN      │  │   DRIVER     │  │  CLIENTE    │  │
│  │   Web App    │  │   PWA App    │  │  Web Track  │  │
│  │  (Desktop)   │  │  (Mobile)    │  │  (Mobile)   │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
│         │                  │                 │         │
│         └──────────────────┴─────────────────┘         │
│                            │                            │
│                  ┌─────────▼─────────┐                 │
│                  │   Backend APIs    │                 │
│                  │   (Next.js 14)    │                 │
│                  └─────────┬─────────┘                 │
│                            │                            │
│         ┌──────────────────┼──────────────────┐        │
│         │                  │                  │        │
│  ┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼─────┐ │
│  │ PostgreSQL  │  │ Pusher          │  │ Google    │ │
│  │ (Prisma)    │  │ (Real-time)     │  │ Maps API  │ │
│  └─────────────┘  └─────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Responsabilidades por Capa

| Plataforma        | Dispositivo | Tecnología          | Funcionalidad Principal            |
| ----------------- | ----------- | ------------------- | ---------------------------------- |
| **Admin**         | Desktop/PC  | Next.js Web         | Gestión, asignación, reportes      |
| **Driver**        | Smartphone  | Next.js PWA         | GPS tracking, entregas, navegación |
| **Cliente**       | Smartphone  | Next.js Web Pública | Tracking en vivo (sin login)       |
| **Backend**       | Servidor    | Next.js API Routes  | Lógica de negocio, optimización    |
| **Base de Datos** | PostgreSQL  | Prisma ORM          | Persistencia                       |
| **Real-time**     | Pusher      | WebSockets          | Ubicación GPS, notificaciones      |
| **Mapas**         | Google/OSM  | API Externa         | Geocoding, routing, visualización  |

---

## 📱 Flujo de Trabajo Real

### Workflow Completo (Basado en WhatsApp)

```
1. CLIENTE SOLICITA ENTREGA
   ↓
   WhatsApp: "Hola, necesito una entrega"
   Comparte ubicación: 📍 https://maps.app.goo.gl/XYZ123

2. ADMIN CREA ENTREGA EN SISTEMA
   ↓
   • Abre curetcore.com/entregas
   • Click "Nueva Entrega"
   • Pega link de Google Maps
   • Sistema extrae coordenadas automáticamente
   • Agrega datos: nombre, teléfono, notas
   • Guarda

3. ADMIN ASIGNA A DRIVER
   ↓
   • Opción A: Asignación manual (selecciona driver del dropdown)
   • Opción B: Asignación automática (sistema elige driver más cercano)
   • Opción C: Optimización de rutas (agrupa por zona y crea rutas)

4. DRIVER RECIBE NOTIFICACIÓN
   ↓
   Push notification en celular:
   "🚚 Nueva entrega asignada - María Pérez (Los Mina)"

5. DRIVER VE RUTA EN APP
   ↓
   • Abre app CuretCore Driver (PWA instalada)
   • Ve lista de entregas del día (ordenadas por ruta óptima)
   • Click "Navegar" → Abre Waze/Google Maps
   • GPS se envía automáticamente al servidor cada 30 seg

6. ADMIN VE DRIVER EN TIEMPO REAL
   ↓
   • Dashboard muestra mapa grande
   • Marcadores 🚚 de todos los drivers
   • Se mueven en tiempo real (Pusher)
   • Ve cuántas entregas completó cada uno

7. CLIENTE RASTREA (OPCIONAL)
   ↓
   Admin envía por WhatsApp:
   "Tu pedido está en camino 🚚
   Rastréalo: https://curetcore.com/tracking/DEL-045"

   Cliente abre link:
   • Ve mapa con ubicación del driver en vivo
   • Ve tiempo estimado de llegada
   • Recibe notificación cuando driver está cerca

8. DRIVER LLEGA Y ENTREGA
   ↓
   • Click "Marcar como entregada"
   • Toma foto del paquete (cámara del celular)
   • Cliente firma en pantalla o da código de confirmación
   • Agrega nombre de quien recibió: "María Pérez"
   • Confirma

9. SISTEMA ACTUALIZA TODO
   ↓
   • Estado cambia a "ENTREGADA"
   • Foto sube al servidor
   • Admin ve notificación en tiempo real
   • Cliente recibe confirmación (opcional)
   • Se registra en audit log

10. FIN - DATOS QUEDAN GUARDADOS
    ↓
    • Historial completo de la entrega
    • Fotos de prueba
    • Ruta GPS completa
    • Tiempos exactos
    • Disponible para reportes
```

---

## 👥 Roles y Permisos

### Estructura de Roles

```typescript
enum UserRole {
  superadmin  // Acceso total (ya existe en sistema)
  admin       // Gestión de entregas (ya existe)
  driver      // Solo sus entregas asignadas (NUEVO)
  cliente     // Solo sus propias entregas (NUEVO)
  user        // Usuario básico (ya existe)
}
```

### Matriz de Permisos

| Funcionalidad                     | SuperAdmin | Admin | Driver | Cliente |
| --------------------------------- | ---------- | ----- | ------ | ------- |
| Ver todas las entregas            | ✅         | ✅    | ❌     | ❌      |
| Crear entregas                    | ✅         | ✅    | ❌     | ❌      |
| Asignar drivers                   | ✅         | ✅    | ❌     | ❌      |
| Optimizar rutas                   | ✅         | ✅    | ❌     | ❌      |
| Ver mapa completo (todos drivers) | ✅         | ✅    | ❌     | ❌      |
| Generar reportes                  | ✅         | ✅    | ❌     | ❌      |
| Ver entregas asignadas propias    | ✅         | ✅    | ✅     | ❌      |
| Marcar como entregada             | ✅         | ✅    | ✅     | ❌      |
| Subir foto de prueba              | ✅         | ✅    | ✅     | ❌      |
| Enviar ubicación GPS              | N/A        | N/A   | ✅     | ❌      |
| Ver tracking de su pedido         | ✅         | ✅    | N/A    | ✅      |
| Recibir notificaciones            | ✅         | ✅    | ✅     | ✅      |

---

## 🔧 Stack Tecnológico

### Frontend

```typescript
// Admin Dashboard (Desktop)
- Framework: Next.js 14 App Router
- UI: Tailwind CSS + Shadcn/ui (componentes que ya existen)
- Mapas: react-leaflet + OpenStreetMap (gratis)
- Charts: recharts (ya instalado)
- Forms: react-hook-form + zod (ya instalado)

// Driver App (Mobile PWA)
- Framework: Next.js 14 (misma base)
- UI: Tailwind CSS (optimizado móvil)
- GPS: navigator.geolocation API (nativo navegador)
- Cámara: <input type="file" capture="camera">
- Notificaciones: Push API + Pusher
- Offline: Service Worker + IndexedDB
- Instalación: PWA manifest.json

// Cliente Tracking (Mobile Web)
- Framework: Next.js 14 (página pública)
- UI: Tailwind CSS (responsive)
- Mapas: Leaflet simplificado
- Real-time: Pusher
```

### Backend

```typescript
// APIs
- Framework: Next.js 14 API Routes
- ORM: Prisma (ya configurado)
- Database: PostgreSQL 17 (ya existe)
- Auth: NextAuth.js (ya configurado)
- File Upload: Sistema actual de uploads
- Real-time: Pusher (ya configurado)

// Servicios Externos
- Geocoding: Google Maps Geocoding API ($5/1000 requests)
- Routing: Google Routes API o OSRM (self-hosted gratis)
- Mapas: OpenStreetMap (gratis) o Google Maps ($200 crédito/mes)
- Notificaciones: Pusher (200 conexiones gratis)
```

### DevOps

```
- Hosting: EasyPanel (ya configurado)
- Deploy: Git push to main → auto-deploy (ya funciona)
- Database: PostgreSQL en Contabo (ya existe)
- Backups: pg_dump automático (ya existe)
- Monitoring: Logs de Docker (ya existe)
```

---

## 💾 Esquema de Base de Datos

### Nuevas Tablas (Agregar a Prisma)

```prisma
// =====================================================
// MÓDULO: ENTREGAS A DOMICILIO
// =====================================================

// Enum para estados de entrega
enum DeliveryStatus {
  PENDING           // Creada, esperando asignación
  ASSIGNED          // Asignada a driver
  PICKED_UP         // Driver recogió del warehouse
  EN_ROUTE          // En camino al destino
  ARRIVED           // Driver llegó a la dirección
  DELIVERED         // Entregada exitosamente
  FAILED            // Falló (cliente ausente, dirección incorrecta, etc.)
  RETURNED          // Devuelta al warehouse
  CANCELLED         // Cancelada por admin/cliente
}

// Enum para prioridad
enum DeliveryPriority {
  LOW               // Baja prioridad (entrega en 2-3 días)
  NORMAL            // Normal (entrega al día siguiente)
  HIGH              // Alta (entrega mismo día)
  URGENT            // Urgente (entrega inmediata)
}

// Tabla principal de entregas
model Delivery {
  id              String            @id @default(cuid())
  numeroGuia      String            @unique // "DEL-001", "DEL-002", etc.

  // Relación con otros módulos (opcional)
  ordenId         String?           // Si viene de OC del módulo de importaciones
  orden           OCChina?          @relation(fields: [ordenId], references: [id])
  ventaShopifyId  String?           // Si viene de venta en Shopify

  // Información del cliente
  clienteId       String?           // Usuario cliente (si existe en sistema)
  cliente         User?             @relation("ClienteDeliveries", fields: [clienteId], references: [id])
  clienteNombre   String            // Nombre completo
  clienteTelefono String            // Para llamar
  clienteEmail    String?           // Opcional

  // Dirección de entrega
  direccion       String            // Dirección completa
  ciudad          String            // "Santo Domingo Este"
  provincia       String            // "Santo Domingo"
  sector          String?           // "Los Mina", "Villa Mella", etc.
  referencia      String?           @db.Text // "Casa azul al lado de Farmacia Carol"
  codigoPostal    String?

  // Coordenadas GPS (extraídas de Google Maps)
  lat             Float?
  lng             Float?
  googleMapsLink  String?           // Link original compartido por WhatsApp

  // Notas especiales
  notasEntrega    String?           @db.Text // "Tocar timbre 2 veces", "Portón negro"
  notasInternas   String?           @db.Text // Notas del admin (no visibles para cliente/driver)

  // Driver asignado
  driverId        String?
  driver          User?             @relation("DriverDeliveries", fields: [driverId], references: [id])
  vehiculoAsignado String?          // "Moto Honda #123", "Camión Toyota"

  // Estado y prioridad
  status          DeliveryStatus    @default(PENDING)
  prioridad       DeliveryPriority  @default(NORMAL)

  // Descripción del paquete
  descripcion     String?           // "2 cajas de ropa"
  peso            Float?            // En kg
  dimensiones     String?           // "50x30x20 cm"
  valorDeclarado  Float?            // Valor del contenido (para seguro)

  // Prueba de entrega
  fotoEntrega     String?           // URL de la foto subida
  firmaDigital    String?           // Base64 de firma en canvas
  codigoConfirm   String?           // "ABCD1234" - código de 4 dígitos
  entregadoA      String?           // "María Pérez (hija del cliente)"
  observaciones   String?           @db.Text // "Cliente no estaba, entregado a vecina"

  // Intentos de entrega
  intentos        Int               @default(0) // Contador de intentos fallidos
  motivoFalla     String?           // "Cliente ausente", "Dirección incorrecta"

  // Timestamps importantes
  fechaCreacion   DateTime          @default(now())
  fechaAsignacion DateTime?         // Cuando se asignó a driver
  fechaRecogida   DateTime?         // Cuando driver recogió del warehouse
  fechaSalida     DateTime?         // Cuando driver salió a ruta
  fechaLlegada    DateTime?         // Cuando driver llegó a dirección
  fechaEntrega    DateTime?         // Cuando se entregó exitosamente

  // Métricas calculadas
  tiempoTotal     Int?              // Minutos desde creación hasta entrega
  distanciaKm     Float?            // Distancia recorrida por GPS

  // Relaciones
  ubicaciones     DriverLocation[]  // Historial de ubicaciones GPS
  historial       DeliveryHistory[] // Log de cambios de estado

  // Auditoría
  creadoPor       String?           // ID del usuario que creó la entrega
  modificadoPor   String?           // ID del último usuario que modificó

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  deletedAt       DateTime?         // Soft delete

  @@index([status])
  @@index([driverId])
  @@index([clienteId])
  @@index([fechaCreacion])
  @@index([ciudad, sector])
  @@index([numeroGuia])
  @@map("deliveries")
}

// Ubicaciones GPS del driver durante la entrega
model DriverLocation {
  id          String    @id @default(cuid())

  deliveryId  String
  delivery    Delivery  @relation(fields: [deliveryId], references: [id], onDelete: Cascade)

  driverId    String
  driver      User      @relation(fields: [driverId], references: [id])

  // Datos GPS
  lat         Float
  lng         Float
  accuracy    Float?    // Precisión en metros
  speed       Float?    // Velocidad en km/h
  heading     Float?    // Dirección en grados (0-360)
  altitude    Float?    // Altitud en metros

  // Metadata
  timestamp   DateTime  @default(now())
  batteryLevel Float?   // Nivel de batería del celular (0-100)

  @@index([deliveryId, timestamp])
  @@index([driverId])
  @@map("driver_locations")
}

// Historial de cambios de estado
model DeliveryHistory {
  id          String         @id @default(cuid())

  deliveryId  String
  delivery    Delivery       @relation(fields: [deliveryId], references: [id], onDelete: Cascade)

  // Cambio de estado
  statusAntes DeliveryStatus?
  statusDespues DeliveryStatus

  // Metadata
  comentario  String?        @db.Text // "Cliente no estaba en casa"
  lat         Float?         // Ubicación donde se hizo el cambio
  lng         Float?

  // Usuario que hizo el cambio
  usuarioId   String?
  usuario     User?          @relation(fields: [usuarioId], references: [id])

  timestamp   DateTime       @default(now())

  @@index([deliveryId])
  @@map("delivery_history")
}

// Rutas optimizadas para drivers
model Route {
  id              String   @id @default(cuid())

  nombre          String   // "Ruta 1 - Zona Este (22 Nov)"
  descripcion     String?  @db.Text

  driverId        String
  driver          User     @relation(fields: [driverId], references: [id])

  // Entregas en esta ruta (array de IDs en orden optimizado)
  deliveryIds     Json     // ["delivery-1", "delivery-2", "delivery-3"]

  // Coordenadas de la ruta optimizada
  rutaCoords      Json?    // Array de {lat, lng} para polyline en mapa

  // Estadísticas
  fecha           DateTime @default(now())
  totalEntregas   Int
  completadas     Int      @default(0)
  distanciaKm     Float?
  tiempoEstMin    Int?     // Tiempo estimado total en minutos
  tiempoRealMin   Int?     // Tiempo real que tomó

  // Estado
  status          String   @default("PENDING") // PENDING, EN_PROGRESO, COMPLETADA

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([driverId])
  @@index([fecha])
  @@map("routes")
}

// Extensión del modelo User para drivers
model User {
  // ... campos existentes ...

  // Campos específicos para drivers
  vehiculoTipo    String?           // "Moto", "Camión", "Auto"
  vehiculoModelo  String?           // "Honda CRV 2020"
  vehiculoPlaca   String?           // "A123456"
  licenciaConducir String?          // Número de licencia

  // Configuración de driver
  zonaAsignada    String?           // "Santo Domingo Este", null = todas
  disponible      Boolean           @default(true)
  maxEntregasDia  Int?              @default(15)

  // Relaciones de entregas
  deliveriesAsDriver   Delivery[]   @relation("DriverDeliveries")
  deliveriesAsCliente  Delivery[]   @relation("ClienteDeliveries")
  ubicaciones          DriverLocation[]
  historialDelivery    DeliveryHistory[]
  rutas                Route[]
}
```

---

## 🖥️ Interfaces por Rol

### 1. ADMIN - Dashboard Principal

**Ruta:** `app/(pages)/entregas/page.tsx`

```typescript
┌─────────────────────────────────────────────────────────────┐
│  📦 Panel de Entregas - Hoy 22 Nov 2025                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 KPIs                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ 45       │ │ 12       │ │ 3        │ │ 8        │     │
│  │ Total    │ │ En Ruta  │ │ Drivers  │ │ Pendiente│     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                             │
│  🗺️ MAPA (Real-time)               📋 PANEL DE CONTROL    │
│  ┌────────────────────────────┐    ┌──────────────────┐   │
│  │                            │    │ ⚪ Sin Asignar (8)│   │
│  │  🚚 José Pérez             │    │                  │   │
│  │     3/5 entregas ✅        │    │ DEL-045          │   │
│  │     En ruta a Los Mina     │    │ María Pérez      │   │
│  │                            │    │ Los Mina         │   │
│  │  📍📍📍 (entregas)         │    │ [Asignar ▼]     │   │
│  │                            │    │                  │   │
│  │  🚚 Juan Rodríguez         │    │ DEL-046          │   │
│  │     2/8 entregas ✅        │    │ Pedro Gómez      │   │
│  │     En ruta a Villa Mella  │    │ Villa Mella      │   │
│  │                            │    │ [Asignar ▼]     │   │
│  │  📍📍📍📍📍📍📍           │    └──────────────────┘   │
│  │                            │                          │
│  └────────────────────────────┘    🚚 Driver Activos    │
│                                    ┌──────────────────┐   │
│  [+ Nueva Entrega]                 │ José Pérez       │   │
│  [Optimizar Rutas]                 │ 🟢 3/5 (60%)    │   │
│  [📊 Reportes]                     │                  │   │
│                                    │ Juan Rodríguez   │   │
│                                    │ 🟢 2/8 (25%)    │   │
│                                    └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**

- `DeliveryMap` - Mapa con drivers y entregas en tiempo real
- `DeliveryKPIs` - Cards con métricas del día
- `PendingDeliveriesList` - Lista de entregas sin asignar
- `ActiveDriversList` - Drivers activos con progreso
- `CreateDeliveryButton` - Modal para crear entrega
- `RouteOptimizerButton` - Optimizador automático de rutas

---

### 2. DRIVER - App Móvil (PWA)

**Ruta:** `app/driver/page.tsx`

```typescript
┌──────────────────────────┐
│ 🚚 CuretCore Driver      │
├──────────────────────────┤
│ GPS: ✅ Activo           │
│ Batería: 78% 🔋          │
├──────────────────────────┤
│                          │
│ 📊 Hoy: 5 entregas       │
│ [████████░░] 3/5 (60%)   │
│                          │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│                          │
│ 1️⃣ PRÓXIMA ENTREGA      │
│ ┌────────────────────┐  │
│ │ #DEL-045           │  │
│ │                    │  │
│ │ 👤 María Pérez     │  │
│ │ ☎️ 809-123-4567    │  │
│ │                    │  │
│ │ 📍 Calle Proyecto  │  │
│ │    4, Casa #25     │  │
│ │    Los Mina, SDE   │  │
│ │                    │  │
│ │ 📝 Tocar timbre 2x │  │
│ │    Casa azul       │  │
│ │                    │  │
│ │ 📦 2 cajas - ropa  │  │
│ │ 🚨 Prioridad: ALTA │  │
│ │                    │  │
│ │ 📏 1.2 km - 8 min  │  │
│ │                    │  │
│ │ ┌────────────────┐ │  │
│ │ │🗺️ Navegar      │ │  │
│ │ └────────────────┘ │  │
│ │ ┌────────────────┐ │  │
│ │ │📞 Llamar       │ │  │
│ │ └────────────────┘ │  │
│ └────────────────────┘  │
│                          │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│                          │
│ 2️⃣ Siguiente (1.2 km)   │
│ Juan Rodríguez - Villa M │
│                          │
│ 3️⃣ Siguiente (2.8 km)   │
│ Pedro Santos - Los Alcar │
│                          │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│                          │
│ [Ver Ruta Completa 🗺️]  │
│ [Reportar Problema ⚠️]   │
│                          │
└──────────────────────────┘
```

**Al entregar - Modal:**

```typescript
┌──────────────────────────┐
│ ✅ Confirmar Entrega     │
├──────────────────────────┤
│                          │
│ #DEL-045 - María Pérez   │
│                          │
│ 📸 Foto de prueba:       │
│ ┌────────────────────┐  │
│ │                    │  │
│ │  [Vista previa]    │  │
│ │                    │  │
│ └────────────────────┘  │
│ [📷 Tomar/Cambiar Foto] │
│                          │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│                          │
│ ✍️ Firma digital:        │
│ ┌────────────────────┐  │
│ │                    │  │
│ │ [Canvas táctil]    │  │
│ │                    │  │
│ └────────────────────┘  │
│ [🔄 Limpiar]            │
│                          │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│                          │
│ Recibido por:           │
│ [María Pérez____]       │
│                          │
│ Observaciones:          │
│ [Todo en orden__]       │
│                          │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│                          │
│ ❌ ¿Hubo problema?       │
│ ☐ Cliente ausente       │
│ ☐ Dirección incorrecta  │
│ ☐ Cliente rechazó       │
│                          │
│ ┌────────────────────┐  │
│ │ ✅ Confirmar       │  │
│ └────────────────────┘  │
│ [Cancelar]              │
│                          │
└──────────────────────────┘
```

---

### 3. CLIENTE - Tracking Público

**Ruta:** `app/tracking/[guia]/page.tsx`

```typescript
┌─────────────────────────────┐
│ 📦 Rastrear Pedido          │
├─────────────────────────────┤
│                             │
│ Guía: #DEL-045              │
│                             │
│ Estado: 🚚 En camino        │
│                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━  │
│                             │
│ 🗺️ Ubicación en vivo       │
│ ┌─────────────────────┐     │
│ │                     │     │
│ │                     │     │
│ │   🚚 Tu pedido      │     │
│ │      ↓ 1.2 km       │     │
│ │                     │     │
│ │   🏠 Tu dirección   │     │
│ │                     │     │
│ └─────────────────────┘     │
│                             │
│ ⏱️ Llegada estimada:        │
│    8 minutos aprox          │
│                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━  │
│                             │
│ 🚚 Tu Driver:               │
│ José Pérez                  │
│ Moto Honda #123             │
│ ☎️ 809-XXX-XXXX             │
│                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━  │
│                             │
│ 📋 Historial:               │
│ ✅ Pedido recibido          │
│    Hoy 10:00 AM             │
│                             │
│ ✅ Asignado a driver        │
│    Hoy 10:30 AM             │
│                             │
│ ✅ Recogido del almacén     │
│    Hoy 11:00 AM             │
│                             │
│ 🔵 En camino a tu dirección │
│    Hoy 11:30 AM             │
│                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━  │
│                             │
│ 📍 Dirección de entrega:    │
│ Calle Proyecto 4, Casa #25  │
│ Los Mina, Santo Domingo E.  │
│                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━  │
│                             │
│ 🔄 Se actualiza solo        │
│    Última actualización:    │
│    Hace 3 segundos          │
│                             │
└─────────────────────────────┘
```

---

## 🔌 APIs y Endpoints

### Endpoints CRUD Principales

```typescript
// ===================================
// DELIVERIES
// ===================================

// Crear nueva entrega
POST   /api/deliveries
Body: {
  clienteNombre: string
  clienteTelefono: string
  googleMapsLink?: string  // Link de WhatsApp
  direccion: string
  lat?: number
  lng?: number
  ciudad: string
  provincia: string
  notasEntrega?: string
  descripcion?: string
  prioridad?: "LOW" | "NORMAL" | "HIGH" | "URGENT"
}

// Listar entregas (con filtros)
GET    /api/deliveries
Query: {
  status?: DeliveryStatus[]
  driverId?: string
  clienteId?: string
  fecha?: string
  ciudad?: string
  limit?: number
  offset?: number
}

// Obtener una entrega
GET    /api/deliveries/[id]

// Actualizar entrega
PATCH  /api/deliveries/[id]
Body: {
  status?: DeliveryStatus
  driverId?: string
  notasEntrega?: string
  // ... otros campos editables
}

// Eliminar entrega (soft delete)
DELETE /api/deliveries/[id]

// ===================================
// ASIGNACIÓN Y RUTAS
// ===================================

// Asignar entrega a driver
POST   /api/deliveries/assign
Body: {
  deliveryId: string
  driverId: string
}

// Asignación masiva (múltiples entregas)
POST   /api/deliveries/assign-batch
Body: {
  deliveryIds: string[]
  driverId: string
}

// Optimizar rutas automáticamente
POST   /api/routes/optimize
Body: {
  deliveryIds: string[]
  driverId?: string  // Si no se especifica, asigna automáticamente
}

// ===================================
// GPS TRACKING
// ===================================

// Driver envía su ubicación (cada 30 seg)
POST   /api/driver/location
Body: {
  deliveryId: string
  lat: number
  lng: number
  accuracy?: number
  speed?: number
  heading?: number
}

// Obtener ubicaciones de un driver/entrega
GET    /api/driver/location
Query: {
  driverId?: string
  deliveryId?: string
  desde?: DateTime
  hasta?: DateTime
}

// ===================================
// PRUEBA DE ENTREGA
// ===================================

// Marcar como entregada con foto
POST   /api/deliveries/[id]/complete
Body: {
  fotoEntrega: File | string  // Base64 o File upload
  firmaDigital?: string       // Base64 de canvas
  codigoConfirm?: string      // Código de 4 dígitos
  entregadoA: string
  observaciones?: string
}

// Reportar problema
POST   /api/deliveries/[id]/report-issue
Body: {
  motivoFalla: string  // "Cliente ausente", "Dirección incorrecta"
  observaciones?: string
  lat?: number
  lng?: number
}

// ===================================
// TRACKING PÚBLICO
// ===================================

// Cliente rastrea su pedido (sin auth)
GET    /api/tracking/[numeroGuia]
Response: {
  delivery: Delivery
  currentLocation?: { lat, lng, timestamp }
  eta?: number  // Minutos estimados
  historial: DeliveryHistory[]
}

// ===================================
// REPORTES
// ===================================

// Reporte de entregas por período
GET    /api/reports/deliveries
Query: {
  desde: DateTime
  hasta: DateTime
  driverId?: string
  status?: DeliveryStatus[]
}

// Eficiencia de drivers
GET    /api/reports/driver-performance
Query: {
  driverId?: string
  mes: number
  año: number
}

// ===================================
// UTILIDADES
// ===================================

// Parsear link de Google Maps
POST   /api/utils/parse-google-maps
Body: {
  url: string  // https://maps.app.goo.gl/XYZ123
}
Response: {
  lat: number
  lng: number
  direccion: string
}

// Calcular ETA (tiempo estimado)
POST   /api/utils/calculate-eta
Body: {
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
}
Response: {
  distanciaKm: number
  tiempoMinutos: number
  ruta: { lat, lng }[]  // Polyline coordinates
}
```

---

## 🧩 Integración con Monorepo

### Estructura en Monorepo

```
curetcore/
├── packages/
│   ├── ui/                    # Componentes compartidos
│   │   ├── Map.tsx
│   │   ├── DeliveryCard.tsx
│   │   └── ...
│   │
│   ├── auth/                  # Autenticación compartida
│   │   ├── middleware.ts
│   │   └── hooks.ts
│   │
│   └── database/              # Prisma schema compartido
│       └── schema.prisma
│
├── apps/
│   ├── importaciones/         # Módulo existente
│   │   └── ...
│   │
│   ├── entregas/              # NUEVO - Módulo de entregas
│   │   ├── app/
│   │   │   ├── (pages)/
│   │   │   │   └── dashboard/     # Admin dashboard
│   │   │   ├── driver/            # PWA para drivers
│   │   │   └── tracking/          # Tracking público
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   │
│   └── inventario/            # Futuro módulo
│       └── ...
│
└── turbo.json
```

### Dependencias Compartidas

```json
// apps/entregas/package.json
{
  "name": "@curetcore/entregas",
  "dependencies": {
    "@curetcore/ui": "workspace:*",
    "@curetcore/auth": "workspace:*",
    "@curetcore/database": "workspace:*",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4"
  }
}
```

### Deploy Independiente

```yaml
# EasyPanel config para módulo entregas
services:
  entregas:
    image: curetcore-entregas:latest
    domains:
      - entregas.curetcore.com
    env:
      DATABASE_URL: ${DATABASE_URL}
      NEXTAUTH_URL: https://entregas.curetcore.com
      PUSHER_*: ${PUSHER_*}
```

---

## ⏱️ Estimación y Roadmap

### MVP (6-8 semanas)

**Semana 1-2: Foundation**

- [ ] Agregar tablas a Prisma schema
- [ ] Crear estructura de carpetas en monorepo
- [ ] Setup PWA config (manifest.json, service worker)
- [ ] Instalar dependencias (react-leaflet, etc.)

**Semana 3-4: Admin Dashboard**

- [ ] Formulario crear entrega (con Google Maps parser)
- [ ] Lista de entregas con filtros
- [ ] Mapa con todas las entregas pendientes
- [ ] Asignación manual a drivers
- [ ] APIs CRUD básicas

**Semana 5-6: Driver App (PWA)**

- [ ] Layout móvil optimizado
- [ ] Lista de entregas asignadas
- [ ] GPS tracking automático (cada 30 seg)
- [ ] Navegación a Google Maps/Waze
- [ ] Marcar como entregada (sin foto)
- [ ] Notificaciones push (Pusher)

**Semana 7: Cliente Tracking**

- [ ] Página pública de tracking
- [ ] Mapa en tiempo real
- [ ] Cálculo de ETA
- [ ] Historial de estados

**Semana 8: Polish & Testing**

- [ ] Subir fotos de prueba de entrega
- [ ] Firma digital en canvas
- [ ] Reportar problemas
- [ ] Optimización de rutas básica
- [ ] Testing E2E

### Post-MVP (Fase 2)

**Features Avanzadas:**

- [ ] Optimización de rutas con algoritmo TSP
- [ ] Reportes de eficiencia de drivers
- [ ] Integración con Google Routes API (rutas óptimas)
- [ ] Notificaciones WhatsApp automáticas
- [ ] App nativa React Native (si PWA no es suficiente)
- [ ] Geofencing (alertas cuando driver llega a zona)
- [ ] Predicción de ETA con machine learning
- [ ] Multi-warehouse (varios puntos de partida)
- [ ] Zonas de cobertura customizables
- [ ] Sistema de rating (clientes califican driver)

---

## 💰 Costos Operacionales

### Opción A: FREE TIER (Uso interno pequeño)

| Servicio      | Plan               | Límite         | Costo  |
| ------------- | ------------------ | -------------- | ------ |
| **Hosting**   | EasyPanel          | Ya pagado      | $0     |
| **Database**  | PostgreSQL         | Ya existe      | $0     |
| **Mapas**     | OpenStreetMap      | Ilimitado      | $0     |
| **Routing**   | OSRM (self-hosted) | Ilimitado      | $0     |
| **Real-time** | Pusher Free        | 200 conexiones | $0     |
| **GPS**       | Nativo navegador   | Ilimitado      | $0     |
| **TOTAL**     |                    |                | **$0** |

**Limitaciones:**

- Máximo 200 usuarios simultáneos (Pusher)
- OpenStreetMap = mapas básicos (no tan bonitos como Google)
- OSRM = rutas decentes pero no optimales

### Opción B: PRODUCCIÓN ESCALADA

| Servicio      | Plan             | Límite           | Costo           |
| ------------- | ---------------- | ---------------- | --------------- |
| **Hosting**   | EasyPanel        | Ya pagado        | $0              |
| **Database**  | PostgreSQL       | Ya existe        | $0              |
| **Mapas**     | Google Maps      | $200 crédito/mes | $0-50/mes       |
| **Routing**   | Google Routes    | $5/1000 requests | $10-30/mes      |
| **Geocoding** | Google Geocoding | $5/1000 requests | $5-15/mes       |
| **Real-time** | Pusher Pro       | 500 conexiones   | $49/mes         |
| **GPS**       | Nativo navegador | Ilimitado        | $0              |
| **TOTAL**     |                  |                  | **$64-144/mes** |

**Ventajas:**

- Mapas hermosos (Google Maps)
- Rutas súper optimizadas
- Soporte para 500+ usuarios simultáneos
- Geocoding preciso

### Recomendación

**Empezar con Opción A (FREE)** y migrar a Opción B cuando:

- Tengas > 200 usuarios simultáneos
- Necesites rutas más precisas
- Quieras mapas más bonitos
- Estés generando ingresos del módulo

---

## 🎯 Conclusión

Este módulo de entregas es **independiente del sistema de importaciones** y será parte del **monorepo CuretCore**.

**Complejidad:** Media (6-8 semanas MVP)
**ROI:** Alto (ahorro en tiempo + mejor experiencia cliente)
**Costo:** $0-144/mes (dependiendo de escala)
**Riesgo:** Bajo (tecnologías probadas)

**Siguiente paso:** Decidir si construirlo ahora o priorizar otros módulos del monorepo.

---

**Documentación creada:** 2025-11-22
**Versión:** 1.0
**Autor:** Claude Code
**Estado:** 📋 Planificación para monorepo
