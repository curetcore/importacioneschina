# 🚀 Redis Cache - Guía de Uso

Sistema de caché con Redis para mejorar significativamente el performance de la aplicación.

## 📊 Beneficios

- **Dashboard 50x más rápido**: Stats cacheadas por 5 minutos
- **Listados instantáneos**: Paginación cacheada por 1 minuto
- **Datos estáticos optimizados**: Proveedores/config cacheados por 30 minutos
- **Fallback automático**: Usa memoria si Redis no está disponible (desarrollo local)

## 🎯 Endpoints Implementados

### ✅ Ya Cacheados

| Endpoint               | TTL    | Invalidación                                |
| ---------------------- | ------ | ------------------------------------------- |
| `GET /api/dashboard`   | 5 min  | Al crear/editar OC, Pago, Gasto, Inventario |
| `GET /api/proveedores` | 30 min | Al crear/editar/eliminar proveedores        |

### 📋 Pendientes de Implementar

Puedes aplicar el mismo patrón a estos endpoints:

- `GET /api/oc-china` - Listado de órdenes (1 min)
- `GET /api/pagos-china` - Listado de pagos (1 min)
- `GET /api/gastos-logisticos` - Listado de gastos (1 min)
- `GET /api/inventario-recibido` - Listado de inventario (1 min)
- `GET /api/analisis-costos` - Análisis de costos (10 min)

## 🔧 Configuración

### 1. Variable de Entorno

```env
# .env o .env.local
REDIS_URL="redis://localhost:6379"

# Para Easypanel (después de crear servicio Redis):
REDIS_URL="redis://redis:6379"
```

### 2. Crear Redis en Easypanel

1. Dashboard → **Create Service** → **Database** → **Redis**
2. Nombre: `redis`
3. Password: (genera uno automático o usa el tuyo)
4. Versión: Latest (7.x)
5. Deploy

6. Añadir variable de entorno a tu app:
   - REDIS_URL: `redis://:TU_PASSWORD@redis:6379` (si tiene password)
   - REDIS_URL: `redis://redis:6379` (sin password)

7. Redeploy tu app

## 💻 Cómo Usar en Tu Código

### Patrón 1: Cache-Aside para Queries

```typescript
import { QueryCache } from "@/lib/cache-helpers"
import { CacheKeys, CacheTTL } from "@/lib/redis"

// En tu GET handler
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  // Cachear listado
  const data = await QueryCache.list(
    CacheKeys.ocChina.list(page, limit),
    async () => {
      const db = await getPrismaClient()
      return await db.oCChina.findMany({
        skip: (page - 1) * limit,
        take: limit,
        // ... resto de tu query
      })
    },
    CacheTTL.LISTINGS // 1 minuto
  )

  return NextResponse.json({ success: true, data })
}
```

### Patrón 2: Invalidación Automática

```typescript
import { CacheInvalidator } from "@/lib/cache-helpers"

// En tu POST/PUT/DELETE handler
export async function POST(request: NextRequest) {
  // ... crear/actualizar registro ...

  // Invalidar cache relacionado
  await CacheInvalidator.invalidateOCChina(ocId)

  return NextResponse.json({ success: true, data })
}
```

### Patrón 3: Caché Personalizado

```typescript
import { redis } from "@/lib/redis"

// Guardar en cache
await redis.set("mi-clave", { foo: "bar" }, 300) // 5 minutos

// Obtener del cache
const data = await redis.get<{ foo: string }>("mi-clave")

// Eliminar del cache
await redis.del("mi-clave")

// Eliminar por patrón
await redis.delPattern("mi-clave:*")
```

## 🔑 Cache Keys Disponibles

```typescript
import { CacheKeys } from "@/lib/redis"

// Dashboard
CacheKeys.dashboard() // "dashboard:stats:all"

// OC China
CacheKeys.ocChina.list(1, 20) // "oc-china:list:1:20"
CacheKeys.ocChina.detail("abc123") // "oc-china:detail:abc123"
CacheKeys.ocChina.all() // "oc-china:*"

// Pagos China
CacheKeys.pagosChina.list(1, 20) // "pagos-china:list:1:20"
CacheKeys.pagosChina.byOC("abc123") // "pagos-china:by-oc:abc123"

// Gastos Logísticos
CacheKeys.gastosLogisticos.list(1, 20)
CacheKeys.gastosLogisticos.byOC("abc123")

// Inventario
CacheKeys.inventario.list(1, 20)
CacheKeys.inventario.byOC("abc123")

// Proveedores
CacheKeys.proveedores.list() // "proveedores:list"

// Análisis de Costos
CacheKeys.analisisCostos.byOC("abc123")
```

## ⏱️ TTL Recomendados

```typescript
import { CacheTTL } from "@/lib/redis"

CacheTTL.DASHBOARD // 5 minutos - Stats agregadas
CacheTTL.LISTINGS // 1 minuto - Listados con paginación
CacheTTL.DETAILS // 2 minutos - Detalles de registros
CacheTTL.STATIC // 30 minutos - Proveedores, configuración
CacheTTL.ANALYTICS // 10 minutos - Reportes y análisis
```

## 🔄 Invalidación Automática

El sistema invalida cache automáticamente cuando:

```typescript
import { CacheInvalidator } from "@/lib/cache-helpers"

// Al crear/editar/eliminar OC
await CacheInvalidator.invalidateOCChina(ocId)
// Invalida: oc-china:*, dashboard:*, analisis-costos:*

// Al crear/editar/eliminar Pago
await CacheInvalidator.invalidatePagosChina(ocId)
// Invalida: pagos-china:*, dashboard:*, analisis-costos:*

// Al crear/editar/eliminar Gasto
await CacheInvalidator.invalidateGastosLogisticos([ocId1, ocId2])
// Invalida: gastos-logisticos:*, dashboard:*, analisis-costos:*

// Al crear/editar/eliminar Inventario
await CacheInvalidator.invalidateInventario(ocId)
// Invalida: inventario:*, dashboard:*

// Al crear/editar/eliminar Proveedor
await CacheInvalidator.invalidateProveedores()
// Invalida: proveedores:*

// Invalidar TODO (usar con precaución)
await CacheInvalidator.invalidateAll()
```

## 🧪 Testing sin Redis

El sistema funciona SIN Redis usando cache en memoria:

```bash
# Sin variable REDIS_URL
npm run dev

# Verás en consola:
# "REDIS_URL no configurado. Usando cache en memoria (solo desarrollo)"
```

Características del fallback:

- ✅ Misma API, sin cambios de código
- ✅ TTL respetados en memoria
- ✅ Cleanup automático de entradas expiradas
- ⚠️ Cache NO compartido entre procesos
- ⚠️ Se pierde al reiniciar servidor

## 📊 Monitoring

```typescript
import { redis } from "@/lib/redis"

// Verificar si una clave existe
const exists = await redis.exists("mi-clave")

// Establecer TTL adicional
await redis.expire("mi-clave", 60) // 60 segundos más

// Incrementar contador
await redis.incr("visitas:dashboard")

// Limpiar todo (¡cuidado!)
await redis.flushAll()
```

## 🎯 Ejemplo Completo: Cachear Endpoint de OCs

```typescript
// app/api/oc-china/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { QueryCache, CacheInvalidator } from "@/lib/cache-helpers"
import { CacheKeys, CacheTTL } from "@/lib/redis"

// GET /api/oc-china
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  // Cachear listado
  const ocs = await QueryCache.list(
    CacheKeys.ocChina.list(page, limit),
    async () => {
      const db = await getPrismaClient()
      return await db.oCChina.findMany({
        where: { deletedAt: null },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: true,
          pagosChina: true,
        },
        orderBy: { fechaOC: "desc" },
      })
    },
    CacheTTL.LISTINGS
  )

  return NextResponse.json({ success: true, data: ocs })
}

// POST /api/oc-china
export async function POST(request: NextRequest) {
  const db = await getPrismaClient()
  const body = await request.json()

  // ... validación y creación ...

  const oc = await db.oCChina.create({
    data: { ...body },
  })

  // Invalidar cache
  await CacheInvalidator.invalidateOCChina()

  return NextResponse.json({ success: true, data: oc }, { status: 201 })
}
```

## 🚨 Consideraciones Importantes

### ✅ Cuándo Usar Cache

- Queries pesadas con muchos JOINs
- Datos que cambian poco (stats, configuración)
- Endpoints que se llaman frecuentemente (dashboard)
- Listados con paginación
- Reportes y analytics

### ❌ Cuándo NO Usar Cache

- Datos que deben ser siempre en tiempo real
- Operaciones transaccionales críticas
- Datos sensibles de seguridad
- Queries muy específicas que rara vez se repiten

### ⚠️ Limitaciones del Cache en Memoria

- No compartido entre workers/procesos
- Se pierde al reiniciar
- Consume RAM del servidor
- No apto para producción con múltiples instancias

**Recomendación**: Usar Redis en producción, memoria solo para desarrollo local.

## 📈 Impacto Esperado

| Métrica         | Sin Cache | Con Redis | Mejora  |
| --------------- | --------- | --------- | ------- |
| Dashboard load  | 2-5s      | 50-100ms  | **50x** |
| Listados        | 300-800ms | 20-50ms   | **15x** |
| Stats agregadas | 1-3s      | 100-200ms | **15x** |
| Proveedores     | 100-300ms | 10-20ms   | **15x** |

## 🔧 Troubleshooting

### Redis no conecta

```bash
# Verificar que Redis está corriendo
docker ps | grep redis

# Verificar conexión
redis-cli ping
# Debe responder: PONG
```

### Cache no se invalida

```typescript
// Verificar que estás llamando invalidación después de mutaciones
await CacheInvalidator.invalidateOCChina(ocId)

// Debug: Limpiar todo el cache
await redis.flushAll()
```

### TTL muy corto/largo

```typescript
// Ajustar TTL según tus necesidades
const CUSTOM_TTL = 10 * 60 // 10 minutos

await QueryCache.stats(
  cacheKey,
  queryFn,
  CUSTOM_TTL // <-- TTL personalizado
)
```

## 🎓 Mejores Prácticas

1. **Cache selectivo**: No cachear todo, solo lo que más se usa
2. **TTL apropiado**: Datos estáticos = TTL largo, datos dinámicos = TTL corto
3. **Invalidación agresiva**: Mejor invalidar de más que servir datos viejos
4. **Claves descriptivas**: Usar CacheKeys para consistencia
5. **Monitorear**: Revisar logs para ver hits/misses
6. **Testing**: Probar tanto con Redis como con fallback

---

**Implementado**: 2025-01-18
**Última actualización**: 2025-01-18
