# Guía de Uso - Rate Limiting

## 📚 Cómo usar el Rate Limiter

### Opción 1: Usar `withRateLimit()` helper (Más fácil)

```typescript
import { NextRequest } from "next/server"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  // Aplicar rate limit para uploads (3 req/min)
  const rateLimitError = await withRateLimit(request, RateLimits.upload)
  if (rateLimitError) return rateLimitError  // 429 Too Many Requests

  // Continuar con lógica normal
  const data = await request.json()
  // ...
}
```

---

### Opción 2: Uso manual con `rateLimit()`

```typescript
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const clientIp = getClientIdentifier(request)

  const result = await rateLimit({
    identifier: clientIp,
    limit: 10,        // 10 requests
    windowSeconds: 60 // en 60 segundos
  })

  if (!result.success) {
    return NextResponse.json(
      {
        error: `Demasiadas peticiones. Intenta en ${result.retryAfter}s`,
        retryAfter: result.retryAfter
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "Retry-After": result.retryAfter!.toString(),
        }
      }
    )
  }

  // Continuar...
}
```

---

## 🎯 Presets Disponibles

### 1. `RateLimits.upload` - Uploads de archivos
```typescript
// 3 requests cada 60 segundos
const result = await withRateLimit(request, RateLimits.upload)
```

**Usar en:**
- `/api/upload`
- `/api/*/attachments`
- Cualquier endpoint de subida de archivos

---

### 2. `RateLimits.mutation` - Operaciones de escritura
```typescript
// 20 requests cada 10 segundos
const result = await withRateLimit(request, RateLimits.mutation)
```

**Usar en:**
- POST `/api/oc-china`
- PUT `/api/oc-china/[id]`
- DELETE `/api/oc-china/[id]`
- Cualquier POST/PUT/DELETE

---

### 3. `RateLimits.query` - Operaciones de lectura
```typescript
// 60 requests cada 60 segundos
const result = await withRateLimit(request, RateLimits.query)
```

**Usar en:**
- GET `/api/oc-china`
- GET `/api/pagos-china`
- Cualquier GET endpoint

---

### 4. `RateLimits.auth` - Autenticación
```typescript
// 5 requests cada 15 minutos
const result = await withRateLimit(request, RateLimits.auth)
```

**Usar en:**
- POST `/api/auth/login`
- POST `/api/auth/register`
- POST `/api/auth/forgot-password`

---

## 🔧 Ejemplo Completo

### Proteger endpoint de upload:

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  // 1. Aplicar rate limiting PRIMERO
  const rateLimitError = await withRateLimit(request, RateLimits.upload)
  if (rateLimitError) return rateLimitError

  // 2. Continuar con lógica normal
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    // ... lógica de upload

    return NextResponse.json({
      success: true,
      url: fileUrl
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al subir archivo" },
      { status: 500 }
    )
  }
}
```

---

## 📊 Respuesta 429 (Too Many Requests)

### Headers incluidos automáticamente:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-01-17T15:30:45.000Z
Retry-After: 45
Content-Type: application/json
```

### Body de respuesta:
```json
{
  "success": false,
  "error": "Demasiadas peticiones. Por favor, intenta más tarde.",
  "retryAfter": 45
}
```

---

## 🚀 Producción con Redis

Para producción con alto tráfico, migrar a Redis:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// lib/rate-limit-redis.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export const rateLimiter = {
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 m"),
  }),

  mutation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "10 s"),
  }),

  query: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
  }),
}
```

---

## 📝 TODO: Endpoints a Proteger

### Alta Prioridad (crítico):
- [x] ~~`/api/upload` - Ya tiene rate limit básico~~
- [x] POST `/api/oc-china` - Mutations ✅ (2025-01-17)
- [x] POST `/api/pagos-china` - Mutations ✅ (2025-01-17)
- [x] POST `/api/gastos-logisticos` - Mutations ✅ (2025-01-17)
- [x] POST `/api/inventario-recibido` - Mutations ✅ (2025-01-17)

### Media Prioridad:
- [ ] DELETE `/api/oc-china/[id]`
- [ ] DELETE `/api/pagos-china/[id]`
- [x] GET `/api/oc-china` - Queries ✅ (2025-01-17)
- [x] GET `/api/pagos-china` - Queries ✅ (2025-01-17)
- [x] GET `/api/gastos-logisticos` - Queries ✅ (2025-01-17)
- [x] GET `/api/inventario-recibido` - Queries ✅ (2025-01-17)

### Baja Prioridad:
- [ ] Todos los demás GET endpoints

**Esfuerzo estimado:** ~20-30 min para proteger endpoints críticos

---

## ⚠️ Limitaciones Actuales

**Implementación en memoria:**
- ✅ Funciona bien para desarrollo
- ✅ Funciona bien para low-medium traffic (<1000 req/min)
- ❌ Se resetea al reiniciar servidor
- ❌ No funciona con múltiples instancias (load balancers)

**Solución para producción:**
Migrar a Redis (@upstash/ratelimit) cuando:
- Tráfico > 1000 req/min
- Deploy con múltiples instancias
- Necesitas persistencia de rate limits

---

## ✅ Beneficios

1. **Protección DDoS**: Previene ataques de denegación de servicio
2. **Protección de recursos**: Evita sobrecarga del servidor/BD
3. **Fair usage**: Todos los usuarios tienen acceso equitativo
4. **Costo**: Reduce costos de BD al limitar queries abusivas
5. **Headers estándar**: Clientes pueden ver límites y esperar
