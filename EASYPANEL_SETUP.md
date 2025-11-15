# 🚀 Guía de Deployment en Easypanel

## Paso a Paso Completo

### 📋 Pre-requisitos
- Cuenta en Easypanel
- Acceso al repositorio GitHub `curetcore/importacioneschina`

---

## PARTE 1: Crear PostgreSQL

### 1.1 Crear Base de Datos
1. En Easypanel → **Services** → **Create Service**
2. Selecciona **Database** → **PostgreSQL**
3. Configura:
   ```
   Name: curet-importaciones-db
   Version: 16 (latest)
   Database: curet_importaciones
   Username: curet_admin
   Password: [genera uno seguro o usa auto-generado]
   ```
4. Click **Create**

### 1.2 Obtener Connection String
1. Una vez creado, ve a la base de datos
2. Copia la **Internal Connection String** (algo como):
   ```
   postgresql://curet_admin:PASSWORD@postgres:5432/curet_importaciones
   ```
3. **¡Guarda esta URL!** 📝

---

## PARTE 2: Crear Aplicación

### 2.1 Crear App desde GitHub
1. En Easypanel → **Services** → **Create Service**
2. Selecciona **App** → **GitHub**
3. Configura:
   ```
   Repository: curetcore/importacioneschina
   Branch: claude/analyze-documentation-01TWwoF2nsHBhCgA5q7AGfno
   Build Method: Dockerfile
   Name: curet-importaciones
   ```

### 2.2 Configurar Variables de Entorno
En la sección **Environment**, agrega estas variables:

```env
DATABASE_URL=postgresql://curet_admin:TU_PASSWORD@postgres:5432/curet_importaciones
NEXT_PUBLIC_API_URL=https://curet-importaciones.TUDOMINIO.easypanel.app
NODE_ENV=production
```

**⚠️ Reemplaza:**
- `TU_PASSWORD` → Password de PostgreSQL
- `postgres` → Nombre interno del servicio de PostgreSQL (generalmente es el nombre que pusiste)
- `TUDOMINIO` → Tu dominio de Easypanel

### 2.3 Configurar Networking
1. En **Domains**, agrega tu dominio
2. Puerto interno: `3000`
3. Protocolo: `HTTP`

### 2.4 Deploy
1. Click **Deploy**
2. Espera a que termine el build (2-5 minutos)
3. Verifica que el contenedor esté **Running** (verde)

---

## PARTE 3: Configurar Base de Datos

### 3.1 Acceder al Terminal
1. Ve a tu aplicación en Easypanel
2. Click en **Terminal** o **Console**

### 3.2 Ejecutar Migraciones
Ejecuta estos comandos en orden:

```bash
# 1. Generar cliente Prisma
npx prisma generate

# 2. Crear tablas
npx prisma db push

# 3. Poblar con datos de prueba
npm run db:seed
```

**O usa el script automatizado:**
```bash
bash scripts/setup-db.sh
```

---

## PARTE 4: Verificar

### 4.1 Probar la Aplicación
1. Visita tu dominio: `https://curet-importaciones.TUDOMINIO.easypanel.app`
2. Deberías ver el **Dashboard** directamente
3. Navega por las secciones:
   - ✅ Dashboard → Debe mostrar KPIs y gráficos
   - ✅ OC China → Debe mostrar 10 órdenes de prueba
   - ✅ Pagos → Debe mostrar ~20 pagos
   - ✅ Gastos → Debe mostrar ~20-30 gastos
   - ✅ Inventario → Debe mostrar 10 recepciones

### 4.2 Verificar APIs
Prueba los endpoints:
- `https://tu-dominio/api/oc-china`
- `https://tu-dominio/api/pagos-china`
- `https://tu-dominio/api/gastos-logisticos`
- `https://tu-dominio/api/inventario-recibido`
- `https://tu-dominio/api/dashboard`

Todos deben devolver JSON con datos.

---

## 🔧 Solución de Problemas

### Problema: "Connection refused" o error de base de datos
**Solución:**
1. Verifica que PostgreSQL esté Running
2. Verifica que `DATABASE_URL` sea la **Internal Connection String**
3. El formato correcto es: `postgresql://user:pass@postgres-service-name:5432/dbname`

### Problema: "Prisma Client not generated"
**Solución:**
```bash
npx prisma generate
```

### Problema: Tablas no existen
**Solución:**
```bash
npx prisma db push --accept-data-loss
```

### Problema: No hay datos
**Solución:**
```bash
npm run db:seed
```

### Problema: Build falla en Easypanel
**Solución:**
1. Verifica que el branch sea correcto
2. Asegúrate de que `Dockerfile` esté en la raíz
3. Revisa los logs del build en Easypanel

---

## 📊 Datos de Prueba

Una vez ejecutes `npm run db:seed`, tendrás:
- **10 Órdenes de Compra** (OC-2025-001 a OC-2025-010)
- **20 Pagos** (2 por OC: anticipo + pago final)
- **~25 Gastos Logísticos** (flete, aduana, broker, etc.)
- **10 Recepciones de Inventario** (95-98% de lo ordenado)

---

## 🔄 Actualizar la Aplicación

Cuando hagas cambios en el código:

1. **Haz push a GitHub:**
   ```bash
   git add .
   git commit -m "tu mensaje"
   git push
   ```

2. **En Easypanel:**
   - Ve a tu aplicación
   - Click **Redeploy**
   - Easypanel automáticamente:
     - Hace pull del código
     - Rebuilds la imagen Docker
     - Redeploys el contenedor

---

## 📞 Ayuda

Si tienes problemas:
1. Revisa los **logs** en Easypanel
2. Verifica las **variables de entorno**
3. Asegúrate de que PostgreSQL esté **Running**
4. Prueba las APIs directamente con la URL

---

## ✅ Checklist Final

- [ ] PostgreSQL creado y Running
- [ ] Connection string copiada
- [ ] Aplicación creada desde GitHub
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso (contenedor Running)
- [ ] `npx prisma generate` ejecutado
- [ ] `npx prisma db push` ejecutado
- [ ] `npm run db:seed` ejecutado
- [ ] Dashboard abre correctamente
- [ ] Todas las páginas muestran datos
- [ ] APIs responden correctamente

**¡Listo! 🎉**
