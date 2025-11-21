-- AlterTable: Add actor_id to track who triggered the notification
ALTER TABLE "notificaciones" ADD COLUMN IF NOT EXISTS "actor_id" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notificaciones_actor_id_idx" ON "notificaciones"("actor_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notificaciones_actor_id_fkey'
    ) THEN
        ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_actor_id_fkey" 
        FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
