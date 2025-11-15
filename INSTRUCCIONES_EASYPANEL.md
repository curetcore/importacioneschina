# 🚢 Cargar Datos de Prueba - Easypanel

Ya tienes PostgreSQL en Easypanel, solo necesitas 3 pasos:

## 📝 Paso 1: Configurar .env

1. Ve a tu proyecto en Easypanel
2. Copia la `DATABASE_URL` de PostgreSQL
3. Pega en `.env`:

```env
DATABASE_URL="postgresql://usuario:password@postgres.easypanel.host:5432/curet_importaciones"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
```

## 🚀 Paso 2: Ejecutar comandos

```bash
# Generar cliente Prisma
npm run prisma:generate

# Crear las tablas
npm run db:push

# Insertar datos de prueba (10 OCs, 20 pagos, 20-30 gastos, 10 inventarios)
npm run db:seed
```

## ✅ ¡Listo!

Ahora puedes:

```bash
# Ver los datos en Prisma Studio
npm run prisma:studio

# O iniciar la app
npm run dev
```

---

## 📊 Datos que se crean:

- **10 Órdenes de Compra** (OC-2025-001 a OC-2025-010)
  - Proveedores: China 1, China 2, Fábrica X
  - Categorías: Zapatos, Carteras, Cinturones, Accesorios
  - Cantidades: 400-1200 unidades
  - Costos FOB: $8-20 USD/unidad

- **20 Pagos** (2 por cada OC)
  - Anticipo 50% en USD (tasa 58.5)
  - Pago final 50% en CNY (tasa 8.2)
  - Con comisiones bancarias

- **20-30 Gastos Logísticos**
  - Flete, Aduana, Broker, Seguro, etc.
  - RD$ 3,000-15,000 por gasto

- **10 Recepciones de Inventario**
  - 95-98% de lo ordenado
  - Bodegas: Bóveda, Piantini, Villa Mella, Oficina

---

## 🧹 Para limpiar y volver a crear:

```bash
npm run db:push -- --accept-data-loss
npm run db:seed
```

---

## 🆘 Problemas comunes

### "Can't reach database server"
- Verifica que la `DATABASE_URL` en `.env` sea correcta
- Asegúrate de que la base de datos en Easypanel esté corriendo

### "Invalid username/password"
- Revisa las credenciales en Easypanel
- Copia nuevamente la `DATABASE_URL` completa

### "Database does not exist"
- Asegúrate de haber creado la base de datos en Easypanel
- El nombre debe coincidir con el de la `DATABASE_URL`
