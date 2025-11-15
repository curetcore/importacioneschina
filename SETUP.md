# 🚀 Setup Rápido del Sistema

## Paso 1: Configurar Base de Datos

### Opción A: Crear archivo .env (Recomendado)
```bash
cp .env.example .env
```

Luego edita `.env` y ajusta la conexión según tu configuración:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/curet-importaciones"
```

### Opción B: Si usas Docker
```bash
docker-compose up -d
```

## Paso 2: Aplicar Migraciones

```bash
npx prisma migrate dev
```

Esto creará todas las tablas incluyendo la nueva tabla `configuracion`.

## Paso 3: Cargar Configuraciones Iniciales

```bash
npm run setup:config
```

O también puedes usar:
```bash
npx tsx prisma/seed-config.ts
```

Esto cargará 39 valores predeterminados:
- ✓ 5 Categorías
- ✓ 6 Tipos de Pago
- ✓ 5 Métodos de Pago
- ✓ 5 Bodegas
- ✓ 8 Tipos de Gasto

## Paso 4: Iniciar el Servidor

```bash
npm run dev
```

## Paso 5: ¡Usar!

Abre tu navegador en: **http://localhost:3000/configuracion**

Ahora puedes agregar, editar o eliminar configuraciones directamente desde la interfaz.

---

## 🆘 Solución de Problemas

### Error: "DATABASE_URL not found"
→ Crea el archivo `.env` copiando `.env.example`

### Error: "Can't reach database server"
→ Verifica que PostgreSQL esté corriendo
→ Si usas Docker: `docker-compose up -d`

### Error: "tsx not found"
→ Instala tsx: `npm install -D tsx`

### Error en migraciones
→ Resetea la base de datos: `npx prisma migrate reset`
→ Luego vuelve a ejecutar: `npx prisma migrate dev`

---

## 📝 Comandos Útiles

```bash
# Ver la base de datos visualmente
npm run prisma:studio

# Regenerar Prisma Client
npm run prisma:generate

# Resetear base de datos (¡CUIDADO! Borra todo)
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status
```
