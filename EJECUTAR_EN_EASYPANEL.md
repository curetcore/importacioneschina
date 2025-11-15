# 🚀 Ejecutar Seed DENTRO de Easypanel

Como el host `apps_postgres_sistemadechina` es **interno**, debes ejecutar los comandos **dentro de Easypanel**.

## ✅ Opción 1: Usando el Terminal de Easypanel (Más fácil)

### Paso 1: Abrir terminal en Easypanel
1. Ve a tu aplicación en Easypanel
2. Busca la opción "Terminal" o "Console" o "Shell"
3. Abre una terminal/consola dentro del contenedor

### Paso 2: Ejecutar el script
```bash
# Dentro de la terminal de Easypanel:
./seed-en-easypanel.sh
```

**¡Eso es todo!** El script:
- ✅ Genera el cliente Prisma
- ✅ Crea las tablas
- ✅ Inserta 10 OCs + 20 pagos + 20-30 gastos + 10 inventarios

---

## ✅ Opción 2: Comandos manuales

Si prefieres ejecutar comando por comando:

```bash
# Dentro de la terminal de Easypanel:

# 1. Configurar DATABASE_URL
export DATABASE_URL="postgresql://postgres:Pitagora1844@apps_postgres_sistemadechina:5432/apps?sslmode=disable"

# 2. Generar cliente Prisma
npx prisma generate

# 3. Crear tablas
npx prisma db push

# 4. Insertar datos
npm run db:seed
```

---

## ✅ Opción 3: Ejecutar durante el Deploy

Puedes agregar estos comandos al proceso de deploy en Easypanel:

En el Dockerfile o en los comandos post-deploy:
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

---

## 🔍 ¿Cómo acceder al Terminal de Easypanel?

Depende de tu versión de Easypanel, pero generalmente:

1. **Easypanel v2**:
   - Ve a tu aplicación → Pestaña "Console" o "Shell"

2. **Desde CLI local con acceso SSH**:
   ```bash
   # Si tienes acceso SSH al servidor
   ssh tu-servidor
   docker exec -it nombre-contenedor-app sh
   ./seed-en-easypanel.sh
   ```

---

## 📊 ¿Qué datos se crearán?

- **10 Órdenes de Compra** (OC-2025-001 a OC-2025-010)
- **20 Pagos** (USD y CNY con tasas de cambio)
- **20-30 Gastos Logísticos** (Flete, Aduana, Broker, etc.)
- **10 Recepciones de Inventario** (95-98% de lo ordenado)

---

## 🆘 Problemas comunes

### "command not found: npm"
Si npm no está instalado en el contenedor, usa:
```bash
npx tsx prisma/seed.ts
```

### "Prisma Client not found"
Ejecuta primero:
```bash
npx prisma generate
```

### "Can't reach database"
Verifica que:
- PostgreSQL esté corriendo en Easypanel
- El nombre del servicio sea correcto: `apps_postgres_sistemadechina`

---

## ✨ Alternativa: Host Externo

Si encuentras el **host externo** de PostgreSQL en Easypanel, puedes ejecutar desde tu máquina local:

```bash
# Actualiza .env con el host externo
# DATABASE_URL="postgresql://postgres:Pitagora1844@HOST_EXTERNO:5432/apps"

npm run prisma:generate
npm run db:push
npm run db:seed
```

Busca en Easypanel → PostgreSQL → "External Host" o "Public URL"
