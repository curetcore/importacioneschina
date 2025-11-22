-- Migration: Add cantidadCajas field to oc_china table
-- Date: 2025-01-22
-- Description: Agregar campo opcional cantidad_cajas para distribución de gastos por volumen/espacio

-- Add cantidad_cajas column (nullable for backward compatibility)
ALTER TABLE oc_china
ADD COLUMN IF NOT EXISTS cantidad_cajas INTEGER;

-- Add index for distribution queries
CREATE INDEX IF NOT EXISTS idx_oc_china_cantidad_cajas
ON oc_china(cantidad_cajas);

-- Add comment for documentation
COMMENT ON COLUMN oc_china.cantidad_cajas IS 'Número total de cajas/bultos de esta orden (usado para distribución proporcional de gastos de flete y logística)';
