# Configuración Dinámica del Sistema

## 📋 Resumen

Ahora puedes gestionar las configuraciones del sistema (categorías, tipos de pago, bodegas, etc.) directamente desde la interfaz web, sin necesidad de modificar código.

## 🚀 Pasos para Activar

### 1. Aplicar Migración de Base de Datos

Primero, aplica la migración para crear la tabla `configuracion`:

```bash
npx prisma migrate dev --name add_configuracion_table
```

### 2. Migrar Datos Existentes

Ejecuta el script de migración para copiar los valores actuales a la base de datos:

```bash
npx tsx prisma/seed-config.ts
```

Esto creará todos los valores predeterminados:

- ✓ 5 Categorías Principales
- ✓ 6 Tipos de Pago
- ✓ 5 Métodos de Pago
- ✓ 5 Bodegas
- ✓ 8 Tipos de Gasto

### 3. Verificar

Accede a http://localhost:3000/configuracion y verás la nueva interfaz con capacidad de edición.

## ✨ Características

### En la Página de Configuración:

- ➕ **Agregar** nuevos valores a cualquier categoría
- ✏️ **Editar** valores existentes
- 🗑️ **Eliminar** valores que ya no necesites
- 🔢 **Ordenar** cambiando el número de orden

### Ventajas:

- Los cambios se reflejan **inmediatamente** en todos los formularios
- **Validación** automática (no permite duplicados)
- **Soft delete** (los valores eliminados se marcan como inactivos)
- **Historial** con timestamps de creación y actualización

## 🔧 Uso en Formularios

Los formularios ahora cargan las opciones desde la base de datos en tiempo real. Si agregas una nueva categoría "Relojes", automáticamente aparecerá en el formulario de Órdenes de Compra.

## ⚠️ Notas Importantes

1. **Fallback**: Si la base de datos está vacía o hay error, los formularios usarán los valores de `lib/validations.ts` como respaldo.

2. **Monedas**: Las monedas (USD, CNY, RD$) permanecen fijas en el código por ser críticas para cálculos.

3. **No eliminación forzada**: Los valores se marcan como "inactivos" en lugar de eliminarse permanentemente (soft delete).

## 📊 Esquema de Base de Datos

```sql
CREATE TABLE configuracion (
  id         TEXT PRIMARY KEY,
  categoria  TEXT NOT NULL,    -- 'categorias', 'tiposPago', etc.
  valor      TEXT NOT NULL,    -- 'Zapatos', 'Transferencia', etc.
  orden      INTEGER DEFAULT 0,
  activo     BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP,
  UNIQUE(categoria, valor)
);
```

## 🎯 API Endpoints

- `GET /api/configuracion` - Obtener todas las configuraciones
- `GET /api/configuracion?categoria=categorias` - Filtrar por categoría
- `POST /api/configuracion` - Crear nueva configuración
- `PUT /api/configuracion/:id` - Actualizar configuración
- `DELETE /api/configuracion/:id` - Eliminar (soft delete)
