-- Script SQL para agregar columnas de archivos adjuntos
-- Ejecutar este script directamente en la base de datos PostgreSQL

-- Agregar columna archivo_factura a la tabla oc_china
ALTER TABLE "oc_china" ADD COLUMN IF NOT EXISTS "archivo_factura" TEXT;

-- Agregar columna archivo_comprobante a la tabla pagos_china
ALTER TABLE "pagos_china" ADD COLUMN IF NOT EXISTS "archivo_comprobante" TEXT;

-- Agregar columna archivo_recibo a la tabla gastos_logisticos
ALTER TABLE "gastos_logisticos" ADD COLUMN IF NOT EXISTS "archivo_recibo" TEXT;

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'oc_china' AND column_name = 'archivo_factura';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pagos_china' AND column_name = 'archivo_comprobante';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'gastos_logisticos' AND column_name = 'archivo_recibo';
