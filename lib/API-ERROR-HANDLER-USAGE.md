# Guía de Uso - API Error Handler

## 📚 Cómo usar el Error Handler Global

### Opción 1: Usar `handleApiError()` en try/catch

**Antes:**

```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await prisma.oCChina.findMany()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ success: false, error: "Error al obtener datos" }, { status: 500 })
  }
}
```

**Después:**

```typescript
import { handleApiError } from "@/lib/api-error-handler"

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.oCChina.findMany()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleApiError(error) // ← Manejo automático
  }
}
```

---

### Opción 2: Usar `withErrorHandler()` wrapper

**Más limpio y DRY:**

```typescript
import { withErrorHandler } from "@/lib/api-error-handler"

export const GET = withErrorHandler(async (request: NextRequest) => {
  const data = await prisma.oCChina.findMany()
  return NextResponse.json({ success: true, data })
})

// No más try/catch manual! 🎉
```

---

### Opción 3: Lanzar errores personalizados con `Errors`

```typescript
import { handleApiError, Errors } from "@/lib/api-error-handler"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Verificar que existe
    const existing = await prisma.oCChina.findUnique({ where: { id } })

    if (!existing) {
      throw Errors.notFound("Orden de compra", id) // ← Error personalizado
    }

    // Verificar permisos
    if (!hasPermission(request)) {
      throw Errors.forbidden("No tienes permiso para eliminar esta orden")
    }

    // Soft delete
    await softDelete("oCChina", id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
```

---

## 🎯 Errores Disponibles

### Errores de Cliente (4xx)

```typescript
// 400 Bad Request
throw Errors.badRequest("Parámetros inválidos", { field: "ocId" })

// 401 Unauthorized
throw Errors.unauthorized() // "No autorizado"

// 403 Forbidden
throw Errors.forbidden("No tienes acceso a este recurso")

// 404 Not Found
throw Errors.notFound("Orden de compra", "oc-123")

// 422 Validation Error
throw Errors.validation("Email inválido", { field: "email", value: "abc" })

// 409 Conflict
throw Errors.conflict("Ya existe una OC con ese número")
```

### Errores de Servidor (5xx)

```typescript
// 500 Internal Error
throw Errors.internal("Algo salió mal")

// 500 Database Error
throw Errors.database("Error al conectar con la BD")
```

---

## 📦 Respuestas JSON Automáticas

### En Producción:

```json
{
  "success": false,
  "error": "Orden de compra con ID oc-123 no encontrada",
  "code": "NOT_FOUND"
}
```

### En Desarrollo (incluye stack trace):

```json
{
  "success": false,
  "error": "Orden de compra con ID oc-123 no encontrada",
  "code": "NOT_FOUND",
  "stack": "ApiError: ...\n    at GET (/app/api/oc-china/route.ts:45:15)"
}
```

---

## 🔄 Migración de Endpoints Existentes

### Patrón a buscar:

```typescript
catch (error) {
  console.error("Error en ...", error);
  return NextResponse.json(
    { success: false, error: "..." },
    { status: 500 }
  );
}
```

### Reemplazar por:

```typescript
catch (error) {
  return handleApiError(error);
}
```

---

## ✅ Beneficios

1. **Consistencia**: Todos los errores siguen el mismo formato
2. **Menos código**: No más bloques catch repetitivos
3. **Debugging**: Stack traces automáticos en desarrollo
4. **Prisma errors**: Manejo automático de errores de BD
5. **Tipado**: TypeScript infiere tipos correctamente
6. **Logs**: Console.error automático con contexto

---

## 📝 TODO: Endpoints a Migrar

- [ ] `app/api/oc-china/route.ts`
- [ ] `app/api/oc-china/[id]/route.ts`
- [ ] `app/api/pagos-china/route.ts`
- [ ] `app/api/pagos-china/[id]/route.ts`
- [ ] `app/api/gastos-logisticos/route.ts`
- [ ] `app/api/gastos-logisticos/[id]/route.ts`
- [ ] `app/api/inventario-recibido/route.ts`
- [ ] `app/api/inventario-recibido/[id]/route.ts`
- [ ] `app/api/upload/route.ts`
- [ ] Todos los demás endpoints...

**Esfuerzo estimado:** ~30-60 min para migrar todos los endpoints
