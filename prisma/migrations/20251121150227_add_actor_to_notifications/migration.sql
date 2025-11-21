-- AlterTable
ALTER TABLE "notificaciones" ADD COLUMN "actor_id" TEXT;

-- CreateIndex
CREATE INDEX "notificaciones_actor_id_idx" ON "notificaciones"("actor_id");

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
