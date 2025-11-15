-- CreateTable
CREATE TABLE "configuracion" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_categoria_valor_key" ON "configuracion"("categoria", "valor");

-- CreateIndex
CREATE INDEX "configuracion_categoria_idx" ON "configuracion"("categoria");

-- CreateIndex
CREATE INDEX "configuracion_activo_idx" ON "configuracion"("activo");
