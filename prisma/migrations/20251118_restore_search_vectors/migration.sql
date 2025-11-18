-- Migration: Restore search_vector columns and full-text search functionality
-- Date: 2025-11-18
-- Objective: Restore PostgreSQL full-text search columns that were accidentally deleted

-- ============================================================================
-- PASO 1: AGREGAR COLUMNAS search_vector
-- ============================================================================

-- Agregar columna search_vector a oc_china
ALTER TABLE oc_china
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Agregar columna search_vector a pagos_china
ALTER TABLE pagos_china
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Agregar columna search_vector a gastos_logisticos
ALTER TABLE gastos_logisticos
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Agregar columna search_vector a inventario_recibido
ALTER TABLE inventario_recibido
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Agregar columna search_vector a proveedores
ALTER TABLE proveedores
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- ============================================================================
-- PASO 2: CREAR ÍNDICES GIN PARA BÚSQUEDA RÁPIDA
-- ============================================================================

-- Índice GIN para oc_china
CREATE INDEX IF NOT EXISTS oc_china_search_idx
ON oc_china USING GIN(search_vector);

-- Índice GIN para pagos_china
CREATE INDEX IF NOT EXISTS pagos_china_search_idx
ON pagos_china USING GIN(search_vector);

-- Índice GIN para gastos_logisticos
CREATE INDEX IF NOT EXISTS gastos_logisticos_search_idx
ON gastos_logisticos USING GIN(search_vector);

-- Índice GIN para inventario_recibido
CREATE INDEX IF NOT EXISTS inventario_recibido_search_idx
ON inventario_recibido USING GIN(search_vector);

-- Índice GIN para proveedores
CREATE INDEX IF NOT EXISTS proveedores_search_idx
ON proveedores USING GIN(search_vector);

-- ============================================================================
-- PASO 3: CREAR TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ============================================================================

-- Función trigger genérica para actualizar search_vector en oc_china
CREATE OR REPLACE FUNCTION oc_china_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.oc, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.proveedor, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.descripcion_lote, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(NEW.categoria_principal, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger para oc_china
DROP TRIGGER IF EXISTS oc_china_search_vector_update ON oc_china;
CREATE TRIGGER oc_china_search_vector_update
BEFORE INSERT OR UPDATE ON oc_china
FOR EACH ROW EXECUTE FUNCTION oc_china_search_vector_trigger();

-- Función trigger para pagos_china
CREATE OR REPLACE FUNCTION pagos_china_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.id_pago, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.tipo_pago, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.metodo_pago, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.moneda, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger para pagos_china
DROP TRIGGER IF EXISTS pagos_china_search_vector_update ON pagos_china;
CREATE TRIGGER pagos_china_search_vector_update
BEFORE INSERT OR UPDATE ON pagos_china
FOR EACH ROW EXECUTE FUNCTION pagos_china_search_vector_trigger();

-- Función trigger para gastos_logisticos
CREATE OR REPLACE FUNCTION gastos_logisticos_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.id_gasto, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.tipo_gasto, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.proveedor_servicio, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.notas, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger para gastos_logisticos
DROP TRIGGER IF EXISTS gastos_logisticos_search_vector_update ON gastos_logisticos;
CREATE TRIGGER gastos_logisticos_search_vector_update
BEFORE INSERT OR UPDATE ON gastos_logisticos
FOR EACH ROW EXECUTE FUNCTION gastos_logisticos_search_vector_trigger();

-- Función trigger para inventario_recibido
CREATE OR REPLACE FUNCTION inventario_recibido_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.id_recepcion, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.bodega_inicial, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.notas, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger para inventario_recibido
DROP TRIGGER IF EXISTS inventario_recibido_search_vector_update ON inventario_recibido;
CREATE TRIGGER inventario_recibido_search_vector_update
BEFORE INSERT OR UPDATE ON inventario_recibido
FOR EACH ROW EXECUTE FUNCTION inventario_recibido_search_vector_trigger();

-- Función trigger para proveedores
CREATE OR REPLACE FUNCTION proveedores_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.codigo, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.nombre, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.contacto_principal, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.email, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.ciudad, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(NEW.categoria_productos, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.notas, '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger para proveedores
DROP TRIGGER IF EXISTS proveedores_search_vector_update ON proveedores;
CREATE TRIGGER proveedores_search_vector_update
BEFORE INSERT OR UPDATE ON proveedores
FOR EACH ROW EXECUTE FUNCTION proveedores_search_vector_trigger();

-- ============================================================================
-- PASO 4: REPOBLAR DATOS EXISTENTES
-- ============================================================================

-- Repoblar search_vector en oc_china (11 registros)
UPDATE oc_china SET search_vector =
  setweight(to_tsvector('spanish', coalesce(oc, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(proveedor, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(descripcion_lote, '')), 'C') ||
  setweight(to_tsvector('spanish', coalesce(categoria_principal, '')), 'B')
WHERE search_vector IS NULL OR search_vector = '';

-- Repoblar search_vector en pagos_china (20 registros)
UPDATE pagos_china SET search_vector =
  setweight(to_tsvector('spanish', coalesce(id_pago, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(tipo_pago, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(metodo_pago, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(moneda, '')), 'C')
WHERE search_vector IS NULL OR search_vector = '';

-- Repoblar search_vector en gastos_logisticos (23 registros)
UPDATE gastos_logisticos SET search_vector =
  setweight(to_tsvector('spanish', coalesce(id_gasto, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(tipo_gasto, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(proveedor_servicio, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(notas, '')), 'C')
WHERE search_vector IS NULL OR search_vector = '';

-- Repoblar search_vector en inventario_recibido (34 registros)
UPDATE inventario_recibido SET search_vector =
  setweight(to_tsvector('spanish', coalesce(id_recepcion, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(bodega_inicial, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(notas, '')), 'C')
WHERE search_vector IS NULL OR search_vector = '';

-- Repoblar search_vector en proveedores (6 registros)
UPDATE proveedores SET search_vector =
  setweight(to_tsvector('spanish', coalesce(codigo, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(nombre, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(contacto_principal, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(email, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(ciudad, '')), 'C') ||
  setweight(to_tsvector('spanish', coalesce(categoria_productos, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(notas, '')), 'D')
WHERE search_vector IS NULL OR search_vector = '';

-- ============================================================================
-- PASO 5: VERIFICACIÓN
-- ============================================================================

-- Verificar que las columnas existen
DO $$
BEGIN
  -- Verificar columnas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oc_china' AND column_name = 'search_vector') THEN
    RAISE EXCEPTION 'Columna search_vector NO existe en oc_china';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagos_china' AND column_name = 'search_vector') THEN
    RAISE EXCEPTION 'Columna search_vector NO existe en pagos_china';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gastos_logisticos' AND column_name = 'search_vector') THEN
    RAISE EXCEPTION 'Columna search_vector NO existe en gastos_logisticos';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventario_recibido' AND column_name = 'search_vector') THEN
    RAISE EXCEPTION 'Columna search_vector NO existe en inventario_recibido';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proveedores' AND column_name = 'search_vector') THEN
    RAISE EXCEPTION 'Columna search_vector NO existe en proveedores';
  END IF;

  RAISE NOTICE '✅ Todas las columnas search_vector creadas exitosamente';
END $$;

-- ============================================================================
-- RESUMEN DE MIGRACIÓN
-- ============================================================================

-- Total de columnas restauradas: 5
-- Total de índices GIN creados: 5
-- Total de triggers creados: 5
-- Total de registros repoblados: ~94

-- Tablas afectadas:
-- 1. oc_china (11 registros)
-- 2. pagos_china (20 registros)
-- 3. gastos_logisticos (23 registros)
-- 4. inventario_recibido (34 registros)
-- 5. proveedores (6 registros)

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. Los triggers actualizarán automáticamente search_vector en cada INSERT/UPDATE
-- 2. Los índices GIN permiten búsqueda full-text ultra-rápida
-- 3. Configurado con diccionario 'spanish' para mejor precisión
-- 4. Setweight: A=mayor relevancia, B=media, C=baja, D=muy baja
-- 5. Para buscar: WHERE search_vector @@ to_tsquery('spanish', 'término')

-- Ejemplo de uso:
-- SELECT * FROM oc_china WHERE search_vector @@ to_tsquery('spanish', 'zapatos');
-- SELECT * FROM proveedores WHERE search_vector @@ plainto_tsquery('spanish', 'china leather');

-- ============================================================================
