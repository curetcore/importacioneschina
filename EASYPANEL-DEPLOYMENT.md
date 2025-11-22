# 🚀 Guía Completa de Deployment en Easypanel

**Sistema de Importaciones - Curet**
**Última actualización:** Noviembre 2025

---

## 📋 Tabla de Contenidos

1. [Pre-requisitos](#pre-requisitos)
2. [Parte 1: Crear PostgreSQL](#parte-1-crear-postgresql)
3. [Parte 2: Crear Aplicación](#parte-2-crear-aplicación)
4. [Parte 3: Configurar Base de Datos](#parte-3-configurar-base-de-datos)
5. [Parte 4: Verificar Funcionamiento](#parte-4-verificar-funcionamiento)
6. [Deployment Automático](#deployment-automático)
7. [Actualizar la Aplicación](#actualizar-la-aplicación)
8. [Troubleshooting](#troubleshooting)
9. [Checklist Final](#checklist-final)

---

## Pre-requisitos

- ✅ Cuenta en Easypanel
- ✅ Acceso al repositorio GitHub `curetcore/importacioneschina`
- ✅ Servidor configurado (actualmente: 147.93.177.156)

---

## Parte 1: Crear PostgreSQL

### 1.1 Opción A: PostgreSQL Ya Configurado

Si ya tienes PostgreSQL configurado (caso actual):

**Credenciales existentes:**

```
Usuario: postgres
Contraseña: Pitagora1844
Base de datos: apps
Host interno: apps_postgres_sistemadechina
Puerto: 5432
```

**URL de Conexión:**

```
postgresql://postgres:Pitagora1844@apps_postgres_sistemadechina:5432/apps?sslmode=disable
```

### 1.2 Opción B: Crear Nueva Base de Datos

Si necesitas crear una nueva base de datos:

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
5. Una vez creado, copia la **Internal Connection String**
6. **¡Guarda esta URL!** 📝

---

## Parte 2: Crear Aplicación

### 2.1 Crear App desde GitHub

1. En Easypanel → **Services** → **Create Service**
2. Selecciona **App** → **GitHub**
3. Configura:
   ```
   Repository: curetcore/importacioneschina
   Branch: main (o la rama que uses)
   Build Method: Dockerfile
   Name: sistema-importacion
   ```

### 2.2 Configurar Variables de Entorno

En la sección **Environment Variables**, agrega estas 3 variables:

```env
DATABASE_URL=postgresql://postgres:Pitagora1844@apps_postgres_sistemadechina:5432/apps?sslmode=disable
NEXT_PUBLIC_API_URL=https://TU-DOMINIO.easypanel.app
NODE_ENV=production
```

**⚠️ IMPORTANTE:**

- Reemplaza `TU-DOMINIO` con el dominio real que Easypanel te asigne
- Si usaste Opción B (nueva BD), usa tu Connection String
- No cambies el `DATABASE_URL` si usas la configuración existente

### 2.3 Configurar Networking

1. En **Domains**, Easypanel te asignará un dominio automáticamente
2. Cópialo y actualiza `NEXT_PUBLIC_API_URL` con ese dominio
3. **Puerto interno:** `3000`
4. **Protocolo:** `HTTP`

### 2.4 Deploy Inicial

1. Click **Deploy**
2. Espera a que termine el build (2-5 minutos)
3. Verifica que el contenedor esté **Running** (verde)

---

## Parte 3: Configurar Base de Datos

### 3.1 Acceder al Terminal

1. Ve a tu aplicación en Easypanel
2. Click en **Terminal** o **Console**

### 3.2 Ejecutar Migraciones

Ejecuta estos comandos **en orden**:

```bash
# 1. Generar cliente Prisma
npx prisma generate

# 2. Crear todas las tablas en la base de datos
npx prisma db push

# 3. Poblar con datos de prueba (10 OCs, 20 pagos, etc.)
npm run db:seed
```

**O usa el script automatizado:**

```bash
bash scripts/setup-db.sh
```

### 3.3 Datos de Prueba Incluidos

Después de ejecutar `npm run db:seed`:

- **10 Órdenes de Compra** (OC-2025-001 a OC-2025-010)
  - Proveedores: China 1, China 2, Fábrica X
  - Categorías: Zapatos, Carteras, Cinturones, Accesorios
  - 400-1200 unidades por OC
  - $8-20 USD por unidad

- **20 Pagos** (2 por cada OC)
  - Anticipo 50% en USD (tasa 58.5 RD$)
  - Pago final 50% en CNY (tasa 8.2 RD$)
  - Comisiones bancarias incluidas

- **~25 Gastos Logísticos**
  - Flete internacional, Seguro, Aduana, Broker, etc.
  - 3,000-15,000 RD$ por gasto

- **10 Recepciones de Inventario**
  - 95-98% de lo ordenado
  - Costo unitario final calculado automáticamente
  - Bodegas: Bóveda, Piantini, Villa Mella, Oficina

---

## Parte 4: Verificar Funcionamiento

### 4.1 Probar la Aplicación

1. Visita tu dominio: `https://tu-dominio.easypanel.app`
2. Deberías ver el **Dashboard** automáticamente
3. Navega por cada sección:
   - ✅ **Dashboard** → Debe mostrar KPIs con números reales
   - ✅ **OC China** → Debe mostrar 10 órdenes de compra
   - ✅ **Pagos** → Debe mostrar ~20 pagos
   - ✅ **Gastos** → Debe mostrar ~25 gastos logísticos
   - ✅ **Inventario** → Debe mostrar 10 recepciones

### 4.2 Verificar APIs

Prueba estos endpoints en tu navegador o Postman:

```
https://tu-dominio.easypanel.app/api/health
https://tu-dominio.easypanel.app/api/oc-china
https://tu-dominio.easypanel.app/api/pagos-china
https://tu-dominio.easypanel.app/api/gastos-logisticos
https://tu-dominio.easypanel.app/api/inventario-recibido
https://tu-dominio.easypanel.app/api/dashboard
```

Todos deben devolver JSON con datos.

---

## Deployment Automático

### ✨ Cómo Funciona

El sistema está configurado para deployment automático. Cuando hagas **push a tu rama**, esto pasará automáticamente:

#### Durante Build (`npm run build`)

```bash
prisma generate    # Genera el cliente de Prisma
next build        # Construye la app Next.js
```

#### Al Iniciar (`npm start`)

```bash
prisma migrate deploy          # Aplica las migraciones (crea tablas)
tsx prisma/seed-config.ts     # Carga valores iniciales (solo si tabla vacía)
next start                     # Inicia el servidor Next.js
```

**IMPORTANTE:** Las migraciones se ejecutan al **inicio del contenedor**, no durante el build. Esto es porque la base de datos solo está disponible cuando el contenedor está corriendo.

### Protección contra Duplicados

El script `seed-config.ts` es **idempotente**:

- Si la tabla `configuracion` está vacía → Carga los 39 valores
- Si ya tiene datos → No hace nada (evita duplicados)

Puedes hacer deploy **infinitas veces** sin preocuparte.

---

## Actualizar la Aplicación

Cuando hagas cambios en el código:

### Opción 1: Push Automático

1. **Haz push a GitHub:**

   ```bash
   git add .
   git commit -m "tu mensaje"
   git push
   ```

2. **Easypanel automáticamente:**
   - Detecta el cambio
   - Hace pull del código
   - Rebuilds la imagen Docker
   - Redeploys el contenedor

### Opción 2: Redeploy Manual

1. Ve a tu aplicación en Easypanel
2. Click **Redeploy**
3. Espera a que complete

---

## Troubleshooting

### Error: "Prisma Client not found"

**Solución:**

```bash
npx prisma generate
```

### Error: "Table X doesn't exist"

**Solución:**

```bash
npx prisma db push
```

### No aparecen datos en las tablas

**Solución:**

```bash
npm run db:seed
```

### Build falla en Easypanel

**Soluciones:**

1. Verifica que la rama sea correcta
2. Verifica que `Dockerfile` esté en la raíz
3. Revisa los logs de build en Easypanel
4. Asegúrate de que `package.json` tenga todos los scripts necesarios

### Página muestra error 500

**Soluciones:**

1. Revisa logs de la aplicación en Easypanel
2. Verifica que `DATABASE_URL` sea correctamente:
   ```
   postgresql://postgres:Pitagora1844@apps_postgres_sistemadechina:5432/apps?sslmode=disable
   ```
3. Verifica que hayas ejecutado `npx prisma generate` y `npx prisma db push`
4. Verifica las variables de entorno en Easypanel

### Error: "Connection refused" o error de base de datos

**Soluciones:**

1. Verifica que PostgreSQL esté Running en Easypanel
2. Verifica que `DATABASE_URL` sea la **Internal Connection String**
3. El formato correcto es: `postgresql://user:pass@postgres-service-name:5432/dbname`
4. Prueba la conexión desde la terminal del contenedor

### Deployment se queda en "Building..."

**Soluciones:**

1. Revisa los logs en tiempo real
2. Puede ser que esté descargando dependencias (tarda 2-5 min la primera vez)
3. Verifica que el Dockerfile no tenga errores de sintaxis
4. Si tarda más de 10 minutos, cancela y vuelve a intentar

---

## Checklist Final

Usa este checklist para verificar que todo está funcionando:

### Base de Datos

- [ ] PostgreSQL creado y Running
- [ ] Connection string copiada
- [ ] `npx prisma generate` ejecutado
- [ ] `npx prisma db push` ejecutado
- [ ] `npm run db:seed` ejecutado

### Aplicación

- [ ] Aplicación creada desde GitHub
- [ ] Variables de entorno configuradas correctamente
- [ ] Deploy exitoso (contenedor Running - verde)
- [ ] Dominio asignado por Easypanel

### Verificación Funcional

- [ ] Dashboard abre correctamente
- [ ] Todas las páginas muestran datos
- [ ] APIs responden con JSON
- [ ] No hay errores en logs
- [ ] Navegación entre páginas funciona

### Datos de Prueba

- [ ] 10 Órdenes de Compra visibles
- [ ] ~20 Pagos visibles
- [ ] ~25 Gastos Logísticos visibles
- [ ] 10 Recepciones de Inventario visibles
- [ ] KPIs del Dashboard muestran números

---

## 🎯 Próximos Pasos

Una vez que todo funcione correctamente:

1. **Crear usuarios reales** (reemplazar datos de prueba)
2. **Configurar backup automático** de base de datos
3. **Implementar monitoreo** con health checks
4. **Configurar dominio personalizado** (opcional)
5. **Setup de CI/CD** para tests automáticos
6. **Documentar procesos** de negocio específicos

---

## 📞 Ayuda Adicional

Si tienes problemas:

1. **Revisa los logs** en Easypanel (sección Logs de tu aplicación)
2. **Verifica las variables de entorno** (sección Environment)
3. **Asegúrate de que PostgreSQL esté Running** (debe estar verde)
4. **Prueba las APIs directamente** con la URL completa
5. **Consulta la documentación** en `/docs` del repositorio

---

## 📚 Referencias

- **Documentación de Easypanel:** https://easypanel.io/docs
- **Documentación de Prisma:** https://www.prisma.io/docs
- **Documentación de Next.js:** https://nextjs.org/docs
- **Repositorio del Proyecto:** https://github.com/curetcore/importacioneschina

---

**¡Deployment completado! 🎉**

**URL de Producción Actual:** https://importacion.curetcore.com
**Servidor:** 147.93.177.156 (Contabo VPS + EasyPanel)
