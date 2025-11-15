-- CreateTable: Nueva tabla para items/productos de OC China
CREATE TABLE "oc_china_items" (
    "id" TEXT NOT NULL,
    "oc_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "material" TEXT,
    "color" TEXT,
    "especificaciones" TEXT,
    "talla_distribucion" JSONB,
    "cantidad_total" INTEGER NOT NULL,
    "precio_unitario_usd" DECIMAL(10,4) NOT NULL,
    "subtotal_usd" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oc_china_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "oc_china_items_oc_id_idx" ON "oc_china_items"("oc_id");
CREATE INDEX "oc_china_items_sku_idx" ON "oc_china_items"("sku");

-- AddForeignKey
ALTER TABLE "oc_china_items" ADD CONSTRAINT "oc_china_items_oc_id_fkey" FOREIGN KEY ("oc_id") REFERENCES "oc_china"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Agregar columna item_id a inventario_recibido
ALTER TABLE "inventario_recibido" ADD COLUMN "item_id" TEXT;

-- CreateIndex
CREATE INDEX "inventario_recibido_item_id_idx" ON "inventario_recibido"("item_id");

-- AddForeignKey
ALTER TABLE "inventario_recibido" ADD CONSTRAINT "inventario_recibido_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "oc_china_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Eliminar columnas antiguas de oc_china (ahora calculadas desde items)
-- NOTA: Esto eliminará datos existentes. Antes de aplicar, migrar datos si es necesario.
ALTER TABLE "oc_china" DROP COLUMN IF EXISTS "cantidad_ordenada";
ALTER TABLE "oc_china" DROP COLUMN IF EXISTS "costo_fob_total_usd";
