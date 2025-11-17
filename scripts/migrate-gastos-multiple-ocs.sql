-- Migración: Permitir que un gasto esté asociado a múltiples OCs
-- Fecha: 2025-01-17
-- Descripción: Convierte la relación gastos-OCs de 1:N a M:N usando tabla intermedia

BEGIN;

-- 1. Crear tabla intermedia para relación many-to-many
CREATE TABLE IF NOT EXISTS gastos_logisticos_oc (
    id TEXT PRIMARY KEY,
    gasto_id TEXT NOT NULL,
    oc_id TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Foreign keys
    CONSTRAINT fk_gasto FOREIGN KEY (gasto_id) REFERENCES gastos_logisticos(id) ON DELETE CASCADE,
    CONSTRAINT fk_oc FOREIGN KEY (oc_id) REFERENCES oc_china(id) ON DELETE CASCADE,

    -- Prevenir duplicados
    CONSTRAINT unique_gasto_oc UNIQUE (gasto_id, oc_id)
);

-- Crear índices para performance
CREATE INDEX idx_gastos_logisticos_oc_gasto_id ON gastos_logisticos_oc(gasto_id);
CREATE INDEX idx_gastos_logisticos_oc_oc_id ON gastos_logisticos_oc(oc_id);

-- 2. Migrar datos existentes: crear relación en tabla intermedia para cada gasto existente
INSERT INTO gastos_logisticos_oc (id, gasto_id, oc_id, created_at)
SELECT
    gen_random_uuid()::TEXT as id,
    id as gasto_id,
    oc_id,
    created_at
FROM gastos_logisticos
WHERE oc_id IS NOT NULL
  AND deleted_at IS NULL;  -- Solo migrar gastos activos

-- 3. Eliminar el índice de la columna oc_id antes de eliminarla
DROP INDEX IF EXISTS gastos_logisticos_oc_id_idx;

-- 4. Eliminar la foreign key constraint
ALTER TABLE gastos_logisticos DROP CONSTRAINT IF EXISTS gastos_logisticos_oc_id_fkey;

-- 5. Eliminar la columna oc_id de gastos_logisticos (ya no se necesita)
ALTER TABLE gastos_logisticos DROP COLUMN IF EXISTS oc_id;

COMMIT;
