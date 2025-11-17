# 🚀 Guía de Migración - Distribución Profesional de Costos

## 📋 Resumen de Cambios

Esta migración agrega funcionalidad profesional de distribución de costos al sistema de importaciones.

**Versión anterior:** Distribución ecuánime (igual) entre productos
**Versión nueva:** Distribución profesional por peso, volumen o valor FOB

---

## ⚠️ Pre-requisitos

Antes de ejecutar la migración, asegúrate de tener:

- ✅ Acceso a la base de datos PostgreSQL de producción
- ✅ Backup reciente de la base de datos
- ✅ Acceso SSH al servidor (si aplica)
- ✅ Node.js y npm instalados
- ✅ Variables de entorno configuradas (DATABASE_URL)

---

## 🔄 Pasos de Migración

### **Opción 1: Migración Automática (Recomendada)**

Si tienes Prisma configurado en producción:

```bash
# 1. Navegar al directorio del proyecto
cd /ruta/a/curet-importaciones

# 2. Pull los últimos cambios
git pull origin main

# 3. Instalar dependencias (si hay nuevas)
npm install

# 4. Ejecutar migración
npx prisma db push

# 5. Verificar que todo funcionó
npx prisma studio  # Revisar tablas en UI
```

---

### **Opción 2: Migración Manual (SQL Directo)**

Si prefieres ejecutar el SQL directamente:

```bash
# 1. Conectarse a PostgreSQL
psql $DATABASE_URL

# O si tienes las credenciales separadas:
psql -h host -U usuario -d nombre_db

# 2. Ejecutar el archivo de migración
\i prisma/migrations/20250117_add_cost_distribution_fields/migration.sql

# 3. Verificar que se aplicó correctamente
\dt  # Listar tablas
\d oc_china_items  # Ver estructura de tabla
\d config_distribucion_costos  # Ver nueva tabla
```

---

### **Opción 3: Migración en Servidor Remoto**

Si tu base de datos está en un servidor remoto:

```bash
# 1. Copiar archivo de migración al servidor
scp prisma/migrations/20250117_add_cost_distribution_fields/migration.sql \
    usuario@servidor:/tmp/

# 2. Conectarse al servidor
ssh usuario@servidor

# 3. Ejecutar migración
psql $DATABASE_URL < /tmp/migration.sql

# 4. Limpiar archivo temporal
rm /tmp/migration.sql
```

---

## 📊 Cambios en Base de Datos

### **Tabla: `oc_china_items`**

Se agregan 4 nuevos campos:

| Campo                  | Tipo          | Descripción                                    |
| ---------------------- | ------------- | ---------------------------------------------- |
| `peso_unitario_kg`     | DECIMAL(10,4) | Peso por unidad en kg (opcional)               |
| `volumen_unitario_cbm` | DECIMAL(10,6) | Volumen por unidad en CBM (opcional)           |
| `peso_total_kg`        | DECIMAL(12,4) | Peso total (calculado: peso_unit × cantidad)   |
| `volumen_total_cbm`    | DECIMAL(12,6) | Volumen total (calculado: vol_unit × cantidad) |

**Impacto:** ✅ Sin impacto - Campos opcionales (nullable)

---

### **Nueva Tabla: `config_distribucion_costos`**

Tabla para configurar métodos de distribución:

```sql
CREATE TABLE config_distribucion_costos (
  id TEXT PRIMARY KEY,
  tipo_costo TEXT UNIQUE NOT NULL,
  metodo_distribucion TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Datos iniciales (seed):**

- `pagos` → `valor_fob`
- `gastos_flete` → `peso`
- `gastos_aduana` → `valor_fob`
- `gastos_transporte_local` → `peso`
- `comisiones` → `valor_fob`

**Impacto:** ✅ Sin impacto - Tabla nueva

---

## ✅ Verificación Post-Migración

Ejecuta estos comandos para verificar:

```sql
-- 1. Verificar que columnas existen
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'oc_china_items'
  AND column_name LIKE '%peso%' OR column_name LIKE '%volumen%';

-- 2. Verificar que tabla de configuración existe
SELECT COUNT(*) FROM config_distribucion_costos;
-- Resultado esperado: 5 registros

-- 3. Ver configuración por defecto
SELECT tipo_costo, metodo_distribucion
FROM config_distribucion_costos
WHERE activo = true;

-- 4. Verificar que OCs viejas siguen funcionando (sin peso/volumen)
SELECT COUNT(*) FROM oc_china_items
WHERE peso_unitario_kg IS NULL;
```

---

## 🔧 Problemas Comunes

### **Error: "Can't reach database server"**

**Causa:** DATABASE_URL incorrecta o base de datos apagada
**Solución:**

```bash
# Verificar que PostgreSQL esté corriendo
systemctl status postgresql  # Linux
brew services list  # macOS

# Verificar conexión
psql $DATABASE_URL -c "SELECT 1"
```

---

### **Error: "Column already exists"**

**Causa:** Migración ya aplicada anteriormente
**Solución:**

```bash
# Verificar estado actual
npx prisma db pull

# Si es necesario, revertir y volver a aplicar
# (Solo si estás seguro)
```

---

### **Error: Prisma Client desactualizado**

**Causa:** Cliente Prisma no regenerado después de cambios
**Solución:**

```bash
npx prisma generate
npm run build
```

---

## 📦 Despliegue Completo

Para un despliegue completo en producción:

```bash
#!/bin/bash
# deploy-cost-distribution.sh

set -e  # Salir si hay error

echo "🚀 Iniciando despliegue de Distribución de Costos..."

# 1. Backup
echo "📦 Creando backup de base de datos..."
pg_dump $DATABASE_URL > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull cambios
echo "⬇️  Descargando últimos cambios..."
git pull origin main

# 3. Dependencias
echo "📚 Instalando dependencias..."
npm install

# 4. Generar Prisma Client
echo "🔧 Generando Prisma Client..."
npx prisma generate

# 5. Aplicar migración
echo "🗄️  Aplicando migración a base de datos..."
npx prisma db push --accept-data-loss

# 6. Build
echo "🏗️  Compilando aplicación..."
npm run build

# 7. Restart (ajusta según tu setup)
echo "♻️  Reiniciando aplicación..."
pm2 restart curet-importaciones
# O: systemctl restart curet-importaciones
# O: docker-compose restart

echo "✅ Despliegue completado exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ir a Configuración → Distribución de Costos"
echo "2. Verificar métodos de distribución"
echo "3. Agregar peso/volumen a productos nuevos"
echo "4. Revisar Análisis de Costos"
```

**Uso:**

```bash
chmod +x deploy-cost-distribution.sh
./deploy-cost-distribution.sh
```

---

## 🔄 Rollback (Revertir Cambios)

Si necesitas revertir la migración:

⚠️ **ADVERTENCIA:** Solo hazlo si es absolutamente necesario

```sql
-- 1. Eliminar tabla de configuración
DROP TABLE IF EXISTS config_distribucion_costos;

-- 2. Eliminar columnas de oc_china_items
ALTER TABLE oc_china_items
  DROP COLUMN IF EXISTS peso_unitario_kg,
  DROP COLUMN IF EXISTS volumen_unitario_cbm,
  DROP COLUMN IF EXISTS peso_total_kg,
  DROP COLUMN IF EXISTS volumen_total_cbm;

-- 3. Restaurar desde backup
-- psql $DATABASE_URL < backup_pre_migration_YYYYMMDD_HHMMSS.sql
```

---

## 📊 Impacto en Datos Existentes

### **Órdenes de Compra Existentes**

- ✅ Siguen funcionando normalmente
- ⚠️ Productos sin peso/volumen usan distribución por unidades (fallback)
- 💡 Puedes editarlas para agregar peso/volumen

### **Análisis de Costos Existentes**

- ⚠️ Los costos se recalcularán con la nueva distribución
- 💡 Exporta a Excel ANTES de migrar si quieres comparar

### **Configuración**

- ✅ Métodos por defecto se configuran automáticamente
- 💡 Puedes cambiarlos en Configuración → Distribución de Costos

---

## 📈 Monitoreo Post-Migración

Después de migrar, monitorea:

1. **Logs de errores:** Verifica que no haya errores en la aplicación
2. **Análisis de costos:** Comprueba que los cálculos sean razonables
3. **Feedback de usuarios:** Pregunta si notan diferencias
4. **Performance:** La nueva lógica es muy eficiente, pero monitorea

---

## 📞 Soporte

Si encuentras problemas durante la migración:

1. **Revisa los logs:**

   ```bash
   # Logs de aplicación
   pm2 logs curet-importaciones

   # Logs de PostgreSQL
   tail -f /var/log/postgresql/postgresql-*.log
   ```

2. **Verifica la migración:**

   ```sql
   SELECT * FROM config_distribucion_costos;
   ```

3. **Consulta esta guía** para problemas comunes

4. **Restaura desde backup** si es crítico:
   ```bash
   psql $DATABASE_URL < backup_pre_migration_*.sql
   ```

---

## ✅ Checklist de Migración

Marca cada paso al completarlo:

- [ ] Backup de base de datos creado
- [ ] Código actualizado (git pull)
- [ ] Dependencias instaladas (npm install)
- [ ] Migración ejecutada (prisma db push o SQL manual)
- [ ] Verificación SQL ejecutada (5 registros en config tabla)
- [ ] Prisma Client regenerado (prisma generate)
- [ ] Build completado (npm run build)
- [ ] Aplicación reiniciada
- [ ] Configuración verificada en UI
- [ ] Análisis de costos verificado
- [ ] Documentación de usuario compartida con equipo

---

**Fecha de creación:** 2025-01-17
**Versión de migración:** 20250117_add_cost_distribution_fields
**Autor:** Sistema de Importaciones Curet
