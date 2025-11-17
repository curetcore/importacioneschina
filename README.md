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

### Pendientes 📋
- Fase 5: Visualización de Datos
- Fase 6: Optimización & Performance
- Fase 7: Testing
- Fase 8: Deployment

**Próximos pasos:** Ver `FASE-4-CONTINUACION.md`

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

# Build
npm run build           # Build producción
npm run lint            # Linter
```

## 🔗 Enlaces

- [Plan de Modernización](./PLAN-MODERNIZACION.md)
- [Estado del Proyecto](./ESTADO-PROYECTO.md)
- [Fase 4 - Continuación](./FASE-4-CONTINUACION.md)
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
  "tailwindcss": "3.4.1"
}
```

## 👥 Desarrollo

Sistema desarrollado con Claude Code para modernizar la gestión de importaciones.

---

**Última actualización:** Noviembre 2025
**Versión:** 1.0.0
