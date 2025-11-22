-- Seed inicial para configuración de distribución de costos
-- Este script crea la configuración por defecto que replica el comportamiento hardcodeado actual
--
-- IMPORTANTE: Ejecutar ANTES de habilitar USE_CONFIG_DISTRIBUTION=true
--
-- Para ejecutar:
-- psql -h localhost -U postgres -d curetcore < prisma/seed-distribution-config.sql

-- Insertar configuración por defecto (replica comportamiento hardcodeado)
INSERT INTO configuracion_distribucion_costos (tipo_costo, metodo_distribucion, activo, created_at, updated_at)
VALUES
  -- Flete internacional: por cajas (más cajas = más espacio = más costo)
  ('gastos_flete', 'cajas', true, NOW(), NOW()),

  -- Transporte local: por cajas (más cajas = más bultos = más costo)
  ('gastos_transporte_local', 'cajas', true, NOW(), NOW()),

  -- Aduana: por valor FOB (más valor = más impuestos)
  ('gastos_aduana', 'valor_fob', true, NOW(), NOW()),

  -- Comisiones bancarias: por valor FOB (más valor = más comisión)
  ('comisiones', 'valor_fob', true, NOW(), NOW())

-- Si ya existen, no hacer nada (evita sobrescribir configuración personalizada)
ON CONFLICT (tipo_costo) DO NOTHING;

-- Verificar que se insertaron correctamente
SELECT
  tipo_costo,
  metodo_distribucion,
  activo,
  created_at
FROM configuracion_distribucion_costos
ORDER BY tipo_costo;
