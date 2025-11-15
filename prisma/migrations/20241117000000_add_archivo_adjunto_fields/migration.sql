-- AlterTable
ALTER TABLE "oc_china" ADD COLUMN "archivo_factura" TEXT;

-- AlterTable
ALTER TABLE "pagos_china" ADD COLUMN "archivo_comprobante" TEXT;

-- AlterTable
ALTER TABLE "gastos_logisticos" ADD COLUMN "archivo_recibo" TEXT;
