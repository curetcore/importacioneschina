-- Add composite indexes for better query performance

-- OCChina: Composite index for filtering active records and sorting by date
CREATE INDEX IF NOT EXISTS "oc_china_deleted_at_fecha_oc_idx" ON "oc_china"("deleted_at", "fecha_oc");

-- OCChina: Composite index for searching by provider excluding deleted
CREATE INDEX IF NOT EXISTS "oc_china_proveedor_deleted_at_idx" ON "oc_china"("proveedor", "deleted_at");

-- AuditLog: Index for searching logs by user email
CREATE INDEX IF NOT EXISTS "audit_logs_usuario_email_idx" ON "audit_logs"("usuario_email");

-- AuditLog: Composite index for searching logs by entity ordered by date
CREATE INDEX IF NOT EXISTS "audit_logs_entidad_created_at_idx" ON "audit_logs"("entidad", "created_at");

-- Notificacion: Index for cleaning expired notifications
CREATE INDEX IF NOT EXISTS "notificaciones_expires_at_idx" ON "notificaciones"("expires_at");

-- Notificacion: Composite index for common user notification queries
CREATE INDEX IF NOT EXISTS "notificaciones_usuario_id_leida_created_at_idx" ON "notificaciones"("usuario_id", "leida", "created_at");
