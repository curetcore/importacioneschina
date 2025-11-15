# Datos de Prueba (Seed Data)

## 📋 Para agregar datos de prueba al sistema

### Opción 1: Con Docker Compose (Recomendado)

Si tienes Docker instalado:

```bash
# 1. Levantar PostgreSQL
docker-compose up -d postgres

# 2. Esperar 5 segundos para que inicie
sleep 5

# 3. Crear las tablas
npm run db:push

# 4. Insertar datos de prueba
npm run db:seed
```

### Opción 2: Con PostgreSQL local

Si tienes PostgreSQL instalado localmente:

```bash
# 1. Crear la base de datos
createdb curet-importaciones

# 2. Configurar .env con tu conexión
# DATABASE_URL="postgresql://tu_usuario:tu_password@localhost:5432/curet-importaciones"

# 3. Crear las tablas
npm run db:push

# 4. Insertar datos de prueba
npm run db:seed
```

### Opción 3: Con base de datos en la nube

Servicios gratuitos recomendados:
- **Supabase**: https://supabase.com (PostgreSQL gratis)
- **Neon**: https://neon.tech (PostgreSQL serverless gratis)
- **Railway**: https://railway.app (PostgreSQL con $5 de crédito)

```bash
# 1. Obtener la DATABASE_URL del servicio
# 2. Actualizar .env con la URL
# 3. Crear las tablas
npm run db:push

# 4. Insertar datos de prueba
npm run db:seed
```

## 🌱 ¿Qué datos se crean?

El script de seed (`prisma/seed.ts`) crea:

- ✅ **10 Órdenes de Compra** (OC-2025-001 a OC-2025-010)
  - Proveedores: China 1, China 2, Fábrica X
  - Categorías: Zapatos, Carteras, Cinturones, Accesorios
  - Cantidades: 400-1200 unidades por OC
  - Costos FOB: $8-20 USD por unidad

- ✅ **20 Pagos** (2 pagos por cada OC)
  - Pago 1: Anticipo 50% en USD (tasa: 58.5)
  - Pago 2: Pago final 50% en CNY (tasa: 8.2)
  - Comisiones bancarias incluidas

- ✅ **20-30 Gastos Logísticos**
  - Tipos: Flete internacional, Seguro, Aduana, Impuestos, Broker, etc.
  - Montos: RD$ 3,000-15,000 por gasto
  - 2-3 gastos por OC

- ✅ **10 Recepciones de Inventario**
  - Cantidades: 95-98% de lo ordenado (simulando pérdidas normales)
  - Bodegas: Bóveda, Piantini, Villa Mella, Oficina

## 🎯 Comandos rápidos

```bash
# Ver datos en la base de datos
npm run prisma:studio

# Limpiar y volver a crear datos
npm run db:push -- --accept-data-loss
npm run db:seed

# Ver schema
npx prisma format
```

## 📊 Ejemplo de datos generados

### Orden de Compra
```
OC: OC-2025-001
Proveedor: China 1
Fecha: 2025-01-03
Categoría: Zapatos
Cantidad: 750 unidades
Costo FOB: $9,375.00 USD
```

### Pagos asociados
```
Pago 1:
  - ID: PAG-OC-2025-001-001
  - Tipo: Anticipo
  - Método: Transferencia
  - Moneda: USD
  - Monto: $4,687.50
  - Tasa: 58.5
  - Monto RD$: $274,218.75
  - Comisión: $500.00
  - Total RD$: $274,718.75

Pago 2:
  - ID: PAG-OC-2025-001-002
  - Tipo: Pago final
  - Método: Tarjeta de crédito
  - Moneda: CNY
  - Monto: ¥34,218.75
  - Tasa: 8.2
  - Monto RD$: $280,593.75
  - Comisión: $250.00
  - Total RD$: $280,843.75
```

### Gastos
```
GAS-OC-2025-001-001: Flete internacional - RD$ 8,543.21
GAS-OC-2025-001-002: Aduana / DGA - RD$ 12,876.43
```

### Inventario
```
REC-OC-2025-001-001
  - Cantidad recibida: 731 unidades (97.5% de 750)
  - Bodega: Bóveda
  - Fecha: 2025-01-28
```

## 💡 Nota importante

Los datos de prueba son **FICTICIOS** y están diseñados para:
- Probar todas las funcionalidades del sistema
- Visualizar el dashboard con datos realistas
- Hacer testing de cálculos financieros
- Demos y presentaciones

**No uses estos datos en producción.**
