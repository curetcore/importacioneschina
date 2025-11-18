-- CreateTable: notificaciones
CREATE TABLE IF NOT EXISTS "notificaciones" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "icono" TEXT,
    "entidad" TEXT,
    "entidad_id" TEXT,
    "url" TEXT,
    "audit_log_id" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "leida_at" TIMESTAMP(3),
    "usuario_id" TEXT,
    "prioridad" TEXT NOT NULL DEFAULT 'normal',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable: gastos_logisticos_oc (many-to-many relationship)
CREATE TABLE IF NOT EXISTS "gastos_logisticos_oc" (
    "id" TEXT NOT NULL,
    "gasto_id" TEXT NOT NULL,
    "oc_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_logisticos_oc_pkey" PRIMARY KEY ("id")
);

-- AlterTable: users - Add last_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'last_name'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "last_name" TEXT;
    END IF;
END $$;

-- CreateIndex: notificaciones indexes
CREATE INDEX IF NOT EXISTS "notificaciones_tipo_idx" ON "notificaciones"("tipo");
CREATE INDEX IF NOT EXISTS "notificaciones_leida_idx" ON "notificaciones"("leida");
CREATE INDEX IF NOT EXISTS "notificaciones_usuario_id_idx" ON "notificaciones"("usuario_id");
CREATE INDEX IF NOT EXISTS "notificaciones_created_at_idx" ON "notificaciones"("created_at");
CREATE INDEX IF NOT EXISTS "notificaciones_expires_at_idx" ON "notificaciones"("expires_at");
CREATE INDEX IF NOT EXISTS "notificaciones_entidad_entidad_id_idx" ON "notificaciones"("entidad", "entidad_id");

-- CreateIndex: gastos_logisticos_oc indexes and unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "gastos_logisticos_oc_gasto_id_oc_id_key" ON "gastos_logisticos_oc"("gasto_id", "oc_id");
CREATE INDEX IF NOT EXISTS "gastos_logisticos_oc_gasto_id_idx" ON "gastos_logisticos_oc"("gasto_id");
CREATE INDEX IF NOT EXISTS "gastos_logisticos_oc_oc_id_idx" ON "gastos_logisticos_oc"("oc_id");

-- AddForeignKey: notificaciones -> audit_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notificaciones_audit_log_id_fkey'
    ) THEN
        ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_audit_log_id_fkey"
        FOREIGN KEY ("audit_log_id") REFERENCES "audit_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: gastos_logisticos_oc -> gastos_logisticos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'gastos_logisticos_oc_gasto_id_fkey'
    ) THEN
        ALTER TABLE "gastos_logisticos_oc" ADD CONSTRAINT "gastos_logisticos_oc_gasto_id_fkey"
        FOREIGN KEY ("gasto_id") REFERENCES "gastos_logisticos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: gastos_logisticos_oc -> oc_china
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'gastos_logisticos_oc_oc_id_fkey'
    ) THEN
        ALTER TABLE "gastos_logisticos_oc" ADD CONSTRAINT "gastos_logisticos_oc_oc_id_fkey"
        FOREIGN KEY ("oc_id") REFERENCES "oc_china"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
