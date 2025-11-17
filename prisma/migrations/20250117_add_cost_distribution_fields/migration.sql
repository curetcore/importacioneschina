-- AlterTable: Add peso and volumen fields to oc_china_items
ALTER TABLE "oc_china_items" ADD COLUMN "peso_unitario_kg" DECIMAL(10,4),
ADD COLUMN "volumen_unitario_cbm" DECIMAL(10,6),
ADD COLUMN "peso_total_kg" DECIMAL(12,4),
ADD COLUMN "volumen_total_cbm" DECIMAL(12,6);

-- CreateTable: config_distribucion_costos
CREATE TABLE "config_distribucion_costos" (
    "id" TEXT NOT NULL,
    "tipo_costo" TEXT NOT NULL,
    "metodo_distribucion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_distribucion_costos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "config_distribucion_costos_tipo_costo_key" ON "config_distribucion_costos"("tipo_costo");

-- CreateIndex
CREATE INDEX "config_distribucion_costos_tipo_costo_idx" ON "config_distribucion_costos"("tipo_costo");

-- CreateIndex
CREATE INDEX "config_distribucion_costos_activo_idx" ON "config_distribucion_costos"("activo");

-- Insert default distribution methods (best practices from research)
INSERT INTO "config_distribucion_costos" ("id", "tipo_costo", "metodo_distribucion", "activo", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'pagos', 'valor_fob', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'gastos_flete', 'peso', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'gastos_aduana', 'valor_fob', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'gastos_transporte_local', 'peso', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'comisiones', 'valor_fob', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
