-- =====================================================
-- Full-Text Search Migration
-- Sistema de Importaciones - Curet
-- =====================================================
-- Agrega búsqueda full-text a tablas principales
-- Índices GIN para búsqueda rápida
-- Triggers automáticos para mantener sincronizado
-- =====================================================

-- =====================================================
-- 1. TABLA: OCChina
-- =====================================================

-- Agregar columna search_vector
ALTER TABLE "oc_china"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Crear función para actualizar search_vector
CREATE OR REPLACE FUNCTION oc_china_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.oc, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.proveedor, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.descripcion_lote, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.categoria_principal, '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS oc_china_search_update_trigger ON "oc_china";
CREATE TRIGGER oc_china_search_update_trigger
  BEFORE INSERT OR UPDATE ON "oc_china"
  FOR EACH ROW
  EXECUTE FUNCTION oc_china_search_update();

-- Actualizar registros existentes
UPDATE "oc_china"
SET search_vector =
  setweight(to_tsvector('spanish', COALESCE(oc, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(proveedor, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE(descripcion_lote, '')), 'C') ||
  setweight(to_tsvector('spanish', COALESCE(categoria_principal, '')), 'D');

-- Crear índice GIN para búsqueda rápida
CREATE INDEX IF NOT EXISTS "oc_china_search_idx" ON "oc_china" USING GIN (search_vector);


-- =====================================================
-- 2. TABLA: PagosChina
-- =====================================================

ALTER TABLE "pagos_china"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

CREATE OR REPLACE FUNCTION pagos_china_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.id_pago, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.metodo_pago, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.observaciones, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.moneda, '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pagos_china_search_update_trigger ON "pagos_china";
CREATE TRIGGER pagos_china_search_update_trigger
  BEFORE INSERT OR UPDATE ON "pagos_china"
  FOR EACH ROW
  EXECUTE FUNCTION pagos_china_search_update();

UPDATE "pagos_china"
SET search_vector =
  setweight(to_tsvector('spanish', COALESCE(id_pago, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(metodo_pago, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE(observaciones, '')), 'C') ||
  setweight(to_tsvector('spanish', COALESCE(moneda, '')), 'D');

CREATE INDEX IF NOT EXISTS "pagos_china_search_idx" ON "pagos_china" USING GIN (search_vector);


-- =====================================================
-- 3. TABLA: GastosLogisticos
-- =====================================================

ALTER TABLE "gastos_logisticos"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

CREATE OR REPLACE FUNCTION gastos_logisticos_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.id_gasto, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.tipo_gasto, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.proveedor_servicio, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.concepto, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gastos_logisticos_search_update_trigger ON "gastos_logisticos";
CREATE TRIGGER gastos_logisticos_search_update_trigger
  BEFORE INSERT OR UPDATE ON "gastos_logisticos"
  FOR EACH ROW
  EXECUTE FUNCTION gastos_logisticos_search_update();

UPDATE "gastos_logisticos"
SET search_vector =
  setweight(to_tsvector('spanish', COALESCE(id_gasto, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(tipo_gasto, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE(proveedor_servicio, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE(concepto, '')), 'C');

CREATE INDEX IF NOT EXISTS "gastos_logisticos_search_idx" ON "gastos_logisticos" USING GIN (search_vector);


-- =====================================================
-- 4. TABLA: InventarioRecibido
-- =====================================================

ALTER TABLE "inventario_recibido"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

CREATE OR REPLACE FUNCTION inventario_recibido_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.id_recepcion, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.bodega_inicial, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.estado_producto, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.observaciones, '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventario_recibido_search_update_trigger ON "inventario_recibido";
CREATE TRIGGER inventario_recibido_search_update_trigger
  BEFORE INSERT OR UPDATE ON "inventario_recibido"
  FOR EACH ROW
  EXECUTE FUNCTION inventario_recibido_search_update();

UPDATE "inventario_recibido"
SET search_vector =
  setweight(to_tsvector('spanish', COALESCE(id_recepcion, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(bodega_inicial, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE(estado_producto, '')), 'C') ||
  setweight(to_tsvector('spanish', COALESCE(observaciones, '')), 'D');

CREATE INDEX IF NOT EXISTS "inventario_recibido_search_idx" ON "inventario_recibido" USING GIN (search_vector);


-- =====================================================
-- 5. TABLA: Proveedores
-- =====================================================

ALTER TABLE "proveedores"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

CREATE OR REPLACE FUNCTION proveedor_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.codigo, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.nombre, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.contacto_principal, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.telefono, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.ciudad, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.pais, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.direccion, '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS proveedor_search_update_trigger ON "proveedores";
CREATE TRIGGER proveedor_search_update_trigger
  BEFORE INSERT OR UPDATE ON "proveedores"
  FOR EACH ROW
  EXECUTE FUNCTION proveedor_search_update();

UPDATE "proveedores"
SET search_vector =
  setweight(to_tsvector('spanish', COALESCE(codigo, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(nombre, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(contacto_principal, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE(email, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE(telefono, '')), 'C') ||
  setweight(to_tsvector('spanish', COALESCE(ciudad, '')), 'C') ||
  setweight(to_tsvector('spanish', COALESCE(pais, '')), 'C') ||
  setweight(to_tsvector('spanish', COALESCE(direccion, '')), 'D');

CREATE INDEX IF NOT EXISTS "proveedores_search_idx" ON "proveedores" USING GIN (search_vector);


-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las columnas se agregaron correctamente
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE
  column_name = 'search_vector'
  AND table_schema = 'public'
ORDER BY table_name;

-- Verificar que los índices se crearon
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE
  indexname LIKE '%search_idx'
  AND schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/*
Para buscar en las tablas usando Full-Text Search:

-- Búsqueda básica en OCChina
SELECT * FROM oc_china
WHERE search_vector @@ to_tsquery('spanish', 'proveedor');

-- Búsqueda con ranking (más relevante primero)
SELECT
  *,
  ts_rank(search_vector, to_tsquery('spanish', 'proveedor')) AS rank
FROM oc_china
WHERE search_vector @@ to_tsquery('spanish', 'proveedor')
ORDER BY rank DESC;

-- Búsqueda fuzzy (acepta variaciones)
SELECT * FROM oc_china
WHERE search_vector @@ plainto_tsquery('spanish', 'zapato deportivo');

-- Búsqueda con operadores
SELECT * FROM oc_china
WHERE search_vector @@ to_tsquery('spanish', 'proveedor & china');

SELECT * FROM oc_china
WHERE search_vector @@ to_tsquery('spanish', 'proveedor | proveedor');
*/
