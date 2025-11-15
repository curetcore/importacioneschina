# 🔧 Fix Manual: Aplicar Migración de Configuración

## ⚠️ Si la página /configuracion sigue vacía después del deploy

La tabla `configuracion` no existe en la base de datos. Necesitas aplicar la migración manualmente.

---

## 📋 Pasos (desde la Terminal de Easypanel):

### 1. Abre la terminal de tu app en Easypanel
En Easypanel → Tu App → Pestaña "Terminal" o "Console"

### 2. Ejecuta el script de migración
```bash
bash apply-migration.sh
```

O ejecuta los comandos manualmente:
```bash
npx prisma migrate deploy
npx tsx prisma/seed-config.ts
```

### 3. Verifica los resultados
Deberías ver:
```
✅ Migration applied: 20241115000000_add_configuracion_table
🌱 Iniciando migración de configuraciones...
✓ Creado: categorias - Zapatos
✓ Creado: categorias - Carteras
... (39 valores en total)
✨ Migración completada!
```

### 4. Recarga la página
Ve a `/configuracion` y deberías ver las 5 categorías con sus items.

---

## 🐛 Si el script no funciona

Ejecuta cada comando individualmente para ver el error específico:

```bash
# 1. Verificar conexión a BD
npx prisma db execute --stdin <<< "SELECT 1"

# 2. Ver migraciones pendientes
npx prisma migrate status

# 3. Aplicar migración
npx prisma migrate deploy

# 4. Verificar tabla creada
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM configuracion"

# 5. Cargar datos
npx tsx prisma/seed-config.ts
```

---

## ✅ Después de aplicar la migración

La próxima vez que hagas deploy, la migración ya estará aplicada y no volverás a tener este problema.
