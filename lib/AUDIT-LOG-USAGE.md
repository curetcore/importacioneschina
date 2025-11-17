# Gu ía de Uso - Audit Log

## 📚 Cómo usar el Audit Logger

El sistema de audit log registra automáticamente todas las acciones importantes (CREATE, UPDATE, DELETE, RESTORE) con contexto completo.

### Uso Básico

```typescript
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit-logger"

// En POST - Crear registro
export async function POST(request: NextRequest) {
  const data = await request.json()

  const nuevaOC = await prisma.oCChina.create({ data })

  // Auditar creación
  await auditCreate("OCChina", nuevaOC, request)

  return NextResponse.json({ success: true, data: nuevaOC })
}

// En PUT - Actualizar registro
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await request.json()

  // Obtener estado anterior
  const before = await prisma.oCChina.findUnique({ where: { id } })

  // Actualizar
  const updated = await prisma.oCChina.update({
    where: { id },
    data: body,
  })

  // Auditar cambios (solo si hubo cambios reales)
  await auditUpdate("OCChina", before!, updated, request)

  return NextResponse.json({ success: true, data: updated })
}

// En DELETE - Eliminar registro
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  // Obtener datos antes de eliminar
  const existing = await prisma.oCChina.findUnique({ where: { id } })

  // Soft delete
  await softDelete("oCChina", id)

  // Auditar eliminación
  await auditDelete("OCChina", existing!, request)

  return NextResponse.json({ success: true })
}
```

---

## 🔍 Consultar Audit Logs

### API Endpoint para consultar logs

```typescript
// app/api/audit-logs/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const entidad = searchParams.get("entidad")
  const entidadId = searchParams.get("entidadId")
  const accion = searchParams.get("accion")

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entidad && { entidad }),
      ...(entidadId && { entidadId }),
      ...(accion && { accion }),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json({ success: true, data: logs })
}
```

### Ejemplos de queries

```typescript
// Todos los cambios de una OC específica
GET /api/audit-logs?entidad=OCChina&entidadId=clxyz123

// Todas las eliminaciones
GET /api/audit-logs?accion=DELETE

// Todos los cambios en pagos
GET /api/audit-logs?entidad=PagosChina

// Historial completo ordenado por fecha
GET /api/audit-logs
```

---

## 📊 Estructura de un Audit Log

```typescript
{
  "id": "clxyz789",
  "entidad": "OCChina",
  "entidadId": "clxyz123",
  "accion": "UPDATE",
  "cambiosAntes": {
    "proveedor": "Proveedor A",
    "fechaOC": "2025-01-01",
    // ... estado completo anterior
  },
  "cambiosDespues": {
    "proveedor": "Proveedor B",  // ← cambió
    "fechaOC": "2025-01-01",
    // ... estado completo nuevo
  },
  "camposModificados": ["proveedor"],  // ← campos que cambiaron
  "descripcion": "Actualizado OCChina clxyz123",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2025-01-17T10:30:00Z"
}
```

---

## 🎯 Casos de Uso

### 1. Ver historial de una OC específica

```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    entidad: "OCChina",
    entidadId: ocId,
  },
  orderBy: { createdAt: "desc" },
})

// Resultado: Todas las modificaciones de esa OC desde su creación
```

### 2. Ver quién eliminó registros hoy

```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)

const deletions = await prisma.auditLog.findMany({
  where: {
    accion: "DELETE",
    createdAt: { gte: today },
  },
  orderBy: { createdAt: "desc" },
})
```

### 3. Ver cambios de un campo específico

```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    entidad: "PagosChina",
    camposModificados: { has: "montoRDNeto" },
  },
})

// Resultado: Todos los pagos donde cambió el monto neto
```

---

## ⚙️ Helpers Disponibles

### `logAudit(options)` - Crear log manual

```typescript
await logAudit({
  entidad: "OCChina",
  entidadId: "clxyz123",
  accion: AuditAction.UPDATE,
  cambiosAntes: { proveedor: "A" },
  cambiosDespues: { proveedor: "B" },
  camposModificados: ["proveedor"],
  descripcion: "Cambió proveedor de A a B",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
})
```

### `detectChangedFields(before, after)` - Detectar cambios

```typescript
const changed = detectChangedFields(
  { proveedor: "A", fechaOC: "2025-01-01" },
  { proveedor: "B", fechaOC: "2025-01-01" }
)
// Resultado: ["proveedor"]
```

### `getClientIP(request)` - Obtener IP

```typescript
const ip = getClientIP(request)
// Resultado: "192.168.1.1"
```

---

## 🚀 Aplicación a Endpoints

### Prioridad Alta (aplicar primero):

- [x] POST/PUT/DELETE `/api/oc-china` (ejemplo implementado)
- [ ] POST/PUT/DELETE `/api/pagos-china`
- [ ] POST/PUT/DELETE `/api/gastos-logisticos`
- [ ] POST/PUT/DELETE `/api/inventario-recibido`

### Prioridad Media:

- [ ] Proveedores
- [ ] Configuración

**Esfuerzo estimado:** ~10 min por endpoint = 40-60 min total

---

## 📝 Notas

- ✅ Los audit logs NO se eliminan (son permanentes)
- ✅ Errores en audit logging NO rompen la operación principal
- ✅ Campos `updatedAt`, `createdAt`, `deletedAt` se ignoran en comparaciones
- ✅ Si no hay cambios reales en UPDATE, no se crea audit log
- ⚠️ No incluir datos sensibles (contraseñas, tokens) en audit logs

---

## 📚 Recursos

- Modelo en: `prisma/schema.prisma`
- Helper en: `lib/audit-logger.ts`
- Consultar logs: Crear endpoint `/api/audit-logs/route.ts`
