# Sistema de Importaciones - Curet

Sistema web para gestión de importaciones desde China con Next.js 14, TypeScript, Prisma y PostgreSQL.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar base de datos
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones
npx prisma db push

# Modo desarrollo
npm run dev

# Build producción
npm run build
npm start
```

## 📁 Estructura Principal

```
app/
  ├── (pages)/           # Páginas del sistema
  │   ├── ordenes/      # Órdenes de compra
  │   ├── pagos-china/  # Pagos a proveedores
  │   ├── gastos-logisticos/
  │   ├── inventario-recibido/
  │   └── configuracion/
  ├── api/              # API Routes
  └── providers.tsx     # React Query, Auth

components/
  ├── forms/            # React Hook Form + Zod
  ├── ui/               # Componentes reutilizables
  └── layout/           # Layout principal

lib/
  ├── hooks/            # Custom hooks
  ├── validations.ts    # Schemas Zod
  └── utils.ts          # Utilidades
```

## 🛠 Stack Tecnológico

### Core
- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript 5.5
- **Base de datos:** PostgreSQL + Prisma ORM
- **Autenticación:** NextAuth.js

### UI & Forms
- **Styling:** Tailwind CSS 3.4
- **Forms:** React Hook Form + Zod
- **Tables:** @tanstack/react-table
- **Icons:** Lucide React

### Data Management
- **Queries:** @tanstack/react-query
- **Caching:** React Query DevTools
- **File uploads:** Manejo en /public/uploads

## 📊 Estado del Proyecto

**Ver:** `ESTADO-PROYECTO.md` para progreso detallado

### Fases Completadas ✅
- ✅ **Fase 1:** UI Moderno (100%)
- ✅ **Fase 2:** Forms con Zod (100%)
- ✅ **Fase 3:** React Query (100%)
- ✅ **Fase 4:** Tablas Profesionales (100%)
- ✅ **Fase 5:** Visualización de Datos (100%)
- ✅ **Fase 6:** Optimización & Performance (100%)
- ✅ **Fase 7:** Testing & Quality (100%)

### Pendientes 📋
- Fase 8: Deployment

**Próximos pasos:** Ver `FASE-4-CONTINUACION.md`

---

## 🎯 Mejoras Pendientes de Implementación

> **📌 INSTRUCCIONES PARA CLAUDE:**
> - Cuando implementes una mejora, marca el checkbox cambiando `- [ ]` a `- [x]`
> - Añade la fecha de implementación al lado: `- [x] Mejora implementada (2025-01-15)`
> - Si encuentras issues durante la implementación, documéntalos en la sección correspondiente
> - Actualiza el commit con mensaje: `feat: [nombre de la mejora] - closes #[número]`

### 🔥 PRIORIDAD ALTA (Implementar primero)

#### 1. Performance y Base de Datos

- [x] **Índices de Base de Datos** (2025-01-17)
  - [x] Agregar índice en `PagosChina.fechaPago` (ya exist a)
  - [x] Agregar índice en `PagosChina.tipoPago` (ya existía)
  - [x] Agregar índice en `PagosChina.metodoPago`
  - [x] Agregar índice en `PagosChina.moneda`
  - [x] Agregar índice en `GastosLogisticos.fechaGasto` (ya existía)
  - [x] Agregar índice en `GastosLogisticos.tipoGasto` (ya existía)
  - [x] Agregar índice en `GastosLogisticos.metodoPago`
  - [x] Agregar índice en `InventarioRecibido.fechaLlegada` (ya existía)
  - [x] Agregar índice en `InventarioRecibido.bodegaInicial` (ya existía)
  - [x] Agregar índice en `OCChina.categoriaPrincipal`
  - **Impacto:** Queries 10-100x más rápidas
  - **Esfuerzo:** 30 minutos ✅
  - **Archivo:** `prisma/schema.prisma`
  - **Nota:** Aplicar con `npx prisma db push` cuando BD esté disponible

- [x] **Paginación en APIs** (2025-01-17) ⚠️ BACKEND COMPLETO
  - [x] Implementar paginación en `/api/oc-china` (ya existía)
  - [x] Implementar paginación en `/api/pagos-china` (ya existía)
  - [x] Implementar paginación en `/api/gastos-logisticos` (ya existía)
  - [x] Implementar paginación en `/api/inventario-recibido` (ya existía)
  - [ ] Actualizar componentes frontend para usar paginación (OPCIONAL)
  - **Impacto:** Carga inicial 90% más rápida
  - **Esfuerzo:** Backend ✅ | Frontend pendiente (opcional)
  - **Archivos:** `app/api/*/route.ts`
  - **Nota:** APIs retornan max 20 registros por defecto. Frontend puede agregar UI de paginación si necesario.

- [x] **Soft Deletes** (2025-01-17) ⚠️ SCHEMA LISTO
  - [x] Agregar campo `deletedAt` a todos los modelos principales
  - [x] Agregar índices en `deletedAt` para performance
  - [x] Crear helper `softDelete()` en `lib/db-helpers.ts`
  - [x] Crear helper `restoreSoftDelete()` para restaurar
  - [x] Crear filtros `notDeletedFilter` y `onlyDeletedFilter`
  - [ ] Actualizar todos los endpoints DELETE para usar soft delete
  - [ ] Agregar filtro global `where: { deletedAt: null }` en queries
  - **Impacto:** Previene pérdida accidental de datos
  - **Esfuerzo:** Schema y helpers ✅ | Endpoints pendiente (1h)
  - **Archivos:** `prisma/schema.prisma`, `lib/db-helpers.ts`, `app/api/*/route.ts`
  - **Nota:** Schema listo. Falta actualizar DELETE endpoints y agregar filtro en GET queries.

#### 2. Seguridad y Validación

- [ ] **Manejo de Errores Global**
  - [ ] Crear `lib/api-error-handler.ts` con clase `ApiError`
  - [ ] Implementar helper `handleApiError()`
  - [ ] Actualizar todos los API routes para usar el handler global
  - **Impacto:** Errores consistentes y mejor debugging
  - **Esfuerzo:** 1 hora
  - **Archivos:** `lib/api-error-handler.ts`, `app/api/*/route.ts`

- [ ] **Validación Consistente**
  - [ ] Crear helper `validateRequest()` en `lib/validate-request.ts`
  - [ ] Aplicar validación en todos los POST/PUT endpoints
  - [ ] Documentar schemas de validación
  - **Impacto:** Datos más confiables y menos bugs
  - **Esfuerzo:** 1 hora
  - **Archivos:** `lib/validate-request.ts`, `app/api/*/route.ts`

- [ ] **Rate Limiting**
  - [ ] Instalar `@upstash/ratelimit` y `@upstash/redis`
  - [ ] Configurar Redis (Upstash o local)
  - [ ] Implementar rate limiting en `middleware.ts`
  - [ ] Configurar límites por endpoint (10 req/10s general, 3 req/min para uploads)
  - **Impacto:** Protección contra abuso y DDoS
  - **Esfuerzo:** 1 hora
  - **Archivos:** `middleware.ts`, `.env`

---

### ⚡ PRIORIDAD MEDIA (Próximas 2 semanas)

#### 3. Auditoría y Logging

- [ ] **Audit Log (Registro de Cambios)**
  - [ ] Crear modelo `AuditLog` en Prisma
  - [ ] Implementar `lib/audit-logger.ts`
  - [ ] Integrar en CREATE/UPDATE/DELETE de todos los módulos
  - [ ] Crear página de visualización de audit logs
  - **Impacto:** Trazabilidad completa de cambios
  - **Esfuerzo:** 3 horas
  - **Archivos:** `prisma/schema.prisma`, `lib/audit-logger.ts`

- [ ] **Logging Estructurado**
  - [ ] Instalar `winston`
  - [ ] Configurar `lib/logger.ts` con transports (consola, archivo)
  - [ ] Reemplazar `console.log/error` por logger en todo el código
  - [ ] Configurar rotación de logs
  - **Impacto:** Debugging profesional en producción
  - **Esfuerzo:** 1 hora
  - **Archivos:** `lib/logger.ts`, todos los API routes

#### 4. Backup y Recuperación

- [ ] **Backup Automático de Archivos**
  - [ ] Configurar S3/Cloudflare R2/Backblaze B2
  - [ ] Crear `lib/file-storage.ts` con upload a cloud
  - [ ] Actualizar `/api/upload` para subir a cloud + local
  - [ ] Implementar cleanup de archivos locales antiguos (30 días)
  - **Impacto:** No perder PDFs/imágenes si falla el servidor
  - **Esfuerzo:** 2 horas
  - **Archivos:** `lib/file-storage.ts`, `app/api/upload/route.ts`

- [ ] **Backup Automático de Base de Datos**
  - [ ] Script de backup diario con `pg_dump`
  - [ ] Configurar cron job o GitHub Actions
  - [ ] Subir backups a S3/R2
  - [ ] Retener últimos 30 días
  - **Impacto:** Recuperación ante desastres
  - **Esfuerzo:** 1 hora
  - **Archivos:** `scripts/backup-db.sh`

#### 5. Búsqueda Avanzada

- [ ] **PostgreSQL Full-Text Search**
  - [ ] Agregar columna `search_vector` a tablas principales
  - [ ] Crear índices GIN para búsqueda full-text
  - [ ] Implementar triggers para actualización automática
  - [ ] Actualizar endpoints de búsqueda para usar FTS
  - **Impacto:** Búsqueda 10x más rápida y relevante
  - **Esfuerzo:** 2 horas
  - **Archivos:** Migraciones SQL, `app/api/*/route.ts`

---

### 🎨 PRIORIDAD BAJA (Nice to Have)

#### 6. Performance Avanzada

- [ ] **Caché con Redis**
  - [ ] Instalar `ioredis`
  - [ ] Configurar conexión Redis
  - [ ] Cachear dashboard stats (5 min TTL)
  - [ ] Cachear listados frecuentes (1 min TTL)
  - [ ] Invalidación de caché en cambios
  - **Impacto:** Dashboard 50x más rápido
  - **Esfuerzo:** 2 horas
  - **Archivos:** `lib/redis.ts`, `app/api/dashboard/route.ts`

- [ ] **Virtualización de Tablas Largas**
  - [ ] Instalar `@tanstack/react-virtual`
  - [ ] Implementar en componente `DataTable`
  - [ ] Testear con 10,000+ registros
  - **Impacto:** Renderizado fluido con miles de registros
  - **Esfuerzo:** 2 horas
  - **Archivos:** `components/ui/data-table.tsx`

#### 7. Exportación y Reportes

- [x] **Export a PDF Profesional** (2025-01-17) ⚠️ PARCIAL
  - [x] Instalar `jspdf` y `jspdf-autotable`
  - [x] Crear funciones de exportación PDF en `lib/export-utils.ts`
  - [ ] Implementar reporte de órdenes con logo y totales
  - [ ] Implementar reporte financiero mensual
  - [x] Agregar botón "Exportar PDF" en cada módulo (dropdown Excel/PDF)
  - **Impacto:** Reportes profesionales para clientes
  - **Esfuerzo:** 3 horas (1.5h completado, 1.5h pendiente)
  - **Archivos:** `lib/export-utils.ts`, componentes de páginas
  - **Completado:** Exportación básica a PDF con tablas en 4 módulos
  - **Pendiente:** Logo, headers personalizados, reportes financieros mensuales

- [ ] **Reportes Programados**
  - [ ] Instalar `node-cron`
  - [ ] Crear script de reporte semanal/mensual
  - [ ] Enviar por email automáticamente
  - **Impacto:** Insights automáticos
  - **Esfuerzo:** 2 horas
  - **Archivos:** `lib/scheduled-reports.ts`

#### 8. UX Mejorado

- [ ] **Command Palette (Cmd+K)**
  - [ ] Instalar `cmdk`
  - [ ] Implementar búsqueda global de órdenes
  - [ ] Agregar shortcuts de navegación
  - [ ] Agregar acciones rápidas (Nueva Orden, etc.)
  - **Impacto:** Navegación 10x más rápida para power users
  - **Esfuerzo:** 3 horas
  - **Archivos:** `components/ui/command-palette.tsx`

- [ ] **Notificaciones en Tiempo Real**
  - [ ] Instalar Pusher o configurar WebSockets
  - [ ] Notificar cuando alguien crea/edita una orden
  - [ ] Mostrar toast con link directo
  - **Impacto:** Colaboración en tiempo real
  - **Esfuerzo:** 4 horas
  - **Archivos:** `lib/pusher.ts`, API routes

- [ ] **Drag & Drop para Archivos**
  - [ ] Instalar `react-dropzone`
  - [ ] Actualizar componente de upload
  - [ ] Preview antes de subir
  - **Impacto:** Mejor UX en uploads
  - **Esfuerzo:** 1 hora
  - **Archivos:** `components/ui/file-upload.tsx`

#### 9. Testing y Quality

- [ ] **Tests E2E con Playwright**
  - [ ] Instalar `@playwright/test`
  - [ ] Crear tests para flujo crítico: Crear Orden → Pagar → Recibir
  - [ ] Configurar CI para ejecutar tests
  - **Impacto:** Prevenir regresiones
  - **Esfuerzo:** 4 horas
  - **Archivos:** `tests/e2e/*.spec.ts`

- [ ] **Prettier + ESLint Estricto**
  - [ ] Configurar Prettier
  - [ ] Agregar reglas ESLint adicionales
  - [ ] Pre-commit hook con Husky
  - **Impacto:** Código más limpio y consistente
  - **Esfuerzo:** 30 minutos
  - **Archivos:** `.prettierrc`, `.eslintrc`

---

## 📈 Progreso de Mejoras

```
Prioridad Alta:    [███████░░] 3/5  (60%) - Índices, Paginación, Soft Deletes
Prioridad Media:   [ ] 0/5  (0%)
Prioridad Baja:    [▓] 0.5/9  (6%) - PDF Export parcial
─────────────────────────────────
TOTAL:             [██░░░░░░░] 3.5/19 (18%)
```

**Última revisión:** 2025-01-17
**Última implementación:** Índices BD + Paginación + Soft Deletes (2025-01-17)

---

## 🔑 Variables de Entorno

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Inicia dev server

# Base de datos
npx prisma studio       # UI para ver datos
npx prisma db push      # Aplicar schema
npx prisma generate     # Generar cliente

# Testing
npm test                # Ejecutar tests
npm run test:watch      # Tests en modo watch
npm run test:coverage   # Tests con coverage

# Build
npm run build           # Build producción
npm run lint            # Linter
```

## 🔗 Enlaces

- [Plan de Modernización](./PLAN-MODERNIZACION.md)
- [Estado del Proyecto](./ESTADO-PROYECTO.md)
- [Fase 4 - Continuación](./FASE-4-CONTINUACION.md)
- [Fase 7 - Testing](./FASE-7-TESTING.md)
- [Prisma Schema](./prisma/schema.prisma)

## 📦 Dependencias Principales

```json
{
  "next": "14.2.33",
  "react": "18.3.1",
  "typescript": "5.5.4",
  "@prisma/client": "6.19.0",
  "@tanstack/react-query": "^5.x",
  "@tanstack/react-table": "^8.21.3",
  "react-hook-form": "^7.x",
  "zod": "^3.x",
  "tailwindcss": "3.4.1",
  "jest": "^30.2.0",
  "@testing-library/react": "^16.3.0"
}
```

## 👥 Desarrollo

Sistema desarrollado con Claude Code para modernizar la gestión de importaciones.

---

**Última actualización:** Noviembre 2025
**Versión:** 1.0.0
