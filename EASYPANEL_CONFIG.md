# 🔐 Configuración de Easypanel - Sistema de Importaciones

## ✅ PostgreSQL - YA CONFIGURADO

**Credenciales:**
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

---

## 🚀 SIGUIENTE PASO: Crear Aplicación en Easypanel

### 1. Crear Nueva Aplicación

1. **En Easypanel → Services → Create Service**
2. **Selecciona "App" → "GitHub"**
3. **Configura:**
   - **Repository:** `curetcore/importacioneschina`
   - **Branch:** `claude/analyze-documentation-01TWwoF2nsHBhCgA5q7AGfno`
   - **Build Method:** `Dockerfile`
   - **App Name:** `sistema-importacion` (o el nombre que prefieras)

---

### 2. Configurar Variables de Entorno

En la sección **Environment Variables**, agrega EXACTAMENTE estas 3 variables:

```env
DATABASE_URL=postgresql://postgres:Pitagora1844@apps_postgres_sistemadechina:5432/apps?sslmode=disable
NEXT_PUBLIC_API_URL=https://TU-DOMINIO.easypanel.app
NODE_ENV=production
```

**⚠️ IMPORTANTE:**
- Reemplaza `TU-DOMINIO` con el dominio real que Easypanel te asigne
- No cambies nada en `DATABASE_URL`, usa exactamente como está arriba

---

### 3. Configurar Dominio y Puerto

1. **En la sección Domains:**
   - Easypanel te asignará un dominio automáticamente
   - Cópialo y actualiza `NEXT_PUBLIC_API_URL` con ese dominio

2. **Puerto:**
   - Puerto interno: `3000`
   - Protocolo: `HTTP`

---

### 4. Deploy

1. **Click en "Deploy"**
2. **Espera 2-5 minutos** mientras se construye la imagen Docker
3. **Verifica que el status sea "Running" (verde)**

---

### 5. Configurar Base de Datos (IMPORTANTE)

Una vez que la aplicación esté desplegada y corriendo:

1. **Ve a tu aplicación en Easypanel**
2. **Click en "Terminal" o "Console"**
3. **Ejecuta estos comandos en orden:**

```bash
# Generar cliente Prisma
npx prisma generate

# Crear todas las tablas en la base de datos
npx prisma db push

# Poblar con datos de prueba (10 OCs, 20 pagos, etc.)
npm run db:seed
```

**O ejecuta el script automatizado:**
```bash
bash scripts/setup-db.sh
```

---

### 6. Verificar que Todo Funcione

1. **Visita tu dominio:** `https://tu-dominio.easypanel.app`
2. **Deberías ver el Dashboard automáticamente**
3. **Navega por cada sección:**
   - ✅ **Dashboard** → Debe mostrar KPIs con números reales
   - ✅ **OC China** → Debe mostrar 10 órdenes de compra
   - ✅ **Pagos** → Debe mostrar ~20 pagos
   - ✅ **Gastos** → Debe mostrar ~25 gastos logísticos
   - ✅ **Inventario** → Debe mostrar 10 recepciones

---

## 🔍 Probar APIs Directamente

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

## 🆘 Si Algo No Funciona

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
**Solución:**
1. Verifica que el branch sea: `claude/analyze-documentation-01TWwoF2nsHBhCgA5q7AGfno`
2. Verifica que Build Method sea: `Dockerfile`
3. Revisa los logs de build en Easypanel

### Página muestra error 500
**Solución:**
1. Revisa logs de la aplicación en Easypanel
2. Verifica que `DATABASE_URL` sea exactamente:
   ```
   postgresql://postgres:Pitagora1844@apps_postgres_sistemadechina:5432/apps?sslmode=disable
   ```
3. Verifica que hayas ejecutado `npx prisma generate` y `npx prisma db push`

---

## 📊 Datos de Prueba Incluidos

Después de ejecutar `npm run db:seed`:

- **10 Órdenes de Compra (OC-2025-001 a OC-2025-010)**
  - Proveedores: China 1, China 2, Fábrica X
  - Categorías: Zapatos, Carteras, Cinturones, Accesorios
  - 400-1200 unidades por OC
  - $8-20 USD por unidad

- **20 Pagos (2 por cada OC)**
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

## ✅ Checklist Final

- [ ] PostgreSQL creado (✅ YA HECHO)
- [ ] Aplicación creada desde GitHub
- [ ] Variables de entorno configuradas
- [ ] Deploy completado (contenedor Running)
- [ ] `npx prisma generate` ejecutado
- [ ] `npx prisma db push` ejecutado
- [ ] `npm run db:seed` ejecutado
- [ ] Dashboard carga correctamente
- [ ] Todas las páginas muestran datos
- [ ] APIs responden con JSON

---

## 🎯 Próximos Pasos (Después de Verificar)

Una vez que todo funcione:
1. Implementar formularios de creación
2. Agregar endpoints PATCH/DELETE
3. Implementar filtros y búsqueda
4. Agregar paginación
5. Crear vistas de detalle

---

**¿Necesitas ayuda con algún paso? ¡Avísame!** 🚀
