# 🚀 Deploy Automático en Easypanel

## ✨ Todo está configurado para ser AUTOMÁTICO

Cuando hagas **push a tu rama** y Easypanel haga el deploy, esto pasará automáticamente:

### 1️⃣ Build (`npm run build`)
```bash
prisma generate    # Genera el cliente de Prisma
next build        # Construye la app Next.js
```

### 2️⃣ Start (`npm start`) - Ejecuta automáticamente al arrancar el contenedor
```bash
prisma migrate deploy          # Aplica las migraciones (crea la tabla configuracion)
tsx prisma/seed-config.ts     # Carga los 39 valores iniciales (solo si tabla vacía)
next start                     # Inicia el servidor Next.js
```

**IMPORTANTE:** Las migraciones se ejecutan al **inicio del contenedor**, no durante el build. Esto es porque la base de datos solo está disponible cuando el contenedor está corriendo.

---

## ✅ **Qué significa esto:**

**NO necesitas hacer NADA manual.** Solo:

1. Haz `git push`
2. Easypanel detecta el cambio
3. Ejecuta build automáticamente
4. Aplica migraciones automáticamente
5. Carga configuraciones automáticamente (solo la primera vez)
6. Inicia la app

**¡Y listo!** 🎉

---

## 🔒 **Protección contra duplicados:**

El script `seed-config.ts` está diseñado para ser **idempotente**:
- Si la tabla `configuracion` está vacía → Carga los 39 valores
- Si ya tiene datos → No hace nada (evita duplicados)

Esto significa que puedes hacer deploy **infinitas veces** sin preocuparte.

---

## 🎯 **Primera vez después de este commit:**

Cuando hagas el próximo deploy, verás en los logs algo así:

```
✓ Running build...
✓ prisma generate
✓ next build
✓ Running postbuild...
✓ prisma migrate deploy
  Applying migration `20241115_add_configuracion_table`
✓ tsx prisma/seed-config.ts
  🌱 Iniciando migración de configuraciones...
  ✓ Creado: categorias - Zapatos
  ✓ Creado: categorias - Carteras
  ... (39 valores en total)
  ✨ Migración completada!
```

---

## 🔧 **Si necesitas ejecutar manualmente:**

Desde la terminal de Easypanel:
```bash
npm run setup:config
```

Pero **NO es necesario** porque se ejecuta automáticamente.

---

## 📍 **Después del deploy:**

Ve a: `https://tu-app.easypanel.host/configuracion`

Deberías ver la página de configuración con todos los valores listos para editar.

---

**¡Todo automático, cero configuración manual!** 🚀
