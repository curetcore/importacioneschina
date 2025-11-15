import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("<1 Iniciando seed data...");

  // Limpiar BD
  console.log("=Ñ  Limpiando base de datos...");
  await prisma.inventarioRecibido.deleteMany();
  await prisma.gastosLogisticos.deleteMany();
  await prisma.pagosChina.deleteMany();
  await prisma.oCChina.deleteMany();

  // Crear 10 OCs de ejemplo
  console.log("=æ Creando órdenes de compra...");
  const proveedores = ["China 1", "China 2", "Fábrica X"];
  const categorias = ["Zapatos", "Carteras", "Cinturones", "Accesorios"];

  const ocs = [];
  for (let i = 1; i <= 10; i++) {
    const cantidad = Math.floor(400 + Math.random() * 800); // 400-1200 unidades
    const costoFOB = new Prisma.Decimal(cantidad * (8 + Math.random() * 12)); // $8-20 por unidad

    const oc = await prisma.oCChina.create({
      data: {
        oc: `OC-2025-${String(i).padStart(3, "0")}`,
        proveedor: proveedores[Math.floor(Math.random() * proveedores.length)],
        fechaOC: new Date(2025, 0, i * 3), // Cada 3 días
        descripcionLote: `Lote de importación #${i} - Mix de productos`,
        categoriaPrincipal: categorias[Math.floor(Math.random() * categorias.length)],
        cantidadOrdenada: cantidad,
        costoFOBTotalUSD: costoFOB,
      },
    });
    ocs.push(oc);
  }
  console.log(` ${ocs.length} órdenes de compra creadas`);

  // Crear pagos para cada OC
  console.log("=° Creando pagos...");
  let pagoCount = 0;
  for (const oc of ocs) {
    const costoFOB = parseFloat(oc.costoFOBTotalUSD.toString());

    // Pago 1: Anticipo 50% en USD
    const montoAnticipo = new Prisma.Decimal(costoFOB * 0.5);
    const tasaUSD = new Prisma.Decimal(58.5);
    const montoRD1 = new Prisma.Decimal(parseFloat(montoAnticipo.toString()) * 58.5);
    const comision1 = new Prisma.Decimal(500);

    await prisma.pagosChina.create({
      data: {
        idPago: `PAG-${oc.oc}-001`,
        ocId: oc.id,
        fechaPago: oc.fechaOC,
        tipoPago: "Anticipo",
        metodoPago: "Transferencia",
        moneda: "USD",
        montoOriginal: montoAnticipo,
        tasaCambio: tasaUSD,
        comisionBancoRD: comision1,
        montoRD: montoRD1,
        montoRDNeto: new Prisma.Decimal(parseFloat(montoRD1.toString()) + 500),
      },
    });
    pagoCount++;

    // Pago 2: Pago final 50% en CNY
    const montoCNY = new Prisma.Decimal((costoFOB * 0.5) * 7.3); // USD a CNY
    const tasaCNY = new Prisma.Decimal(8.2);
    const montoRD2 = new Prisma.Decimal(parseFloat(montoCNY.toString()) * 8.2);
    const comision2 = new Prisma.Decimal(250);

    await prisma.pagosChina.create({
      data: {
        idPago: `PAG-${oc.oc}-002`,
        ocId: oc.id,
        fechaPago: new Date(oc.fechaOC.getTime() + 10 * 24 * 60 * 60 * 1000), // +10 días
        tipoPago: "Pago final",
        metodoPago: "Tarjeta de crédito",
        moneda: "CNY",
        montoOriginal: montoCNY,
        tasaCambio: tasaCNY,
        comisionBancoRD: comision2,
        montoRD: montoRD2,
        montoRDNeto: new Prisma.Decimal(parseFloat(montoRD2.toString()) + 250),
      },
    });
    pagoCount++;
  }
  console.log(` ${pagoCount} pagos creados`);

  // Crear gastos logísticos
  console.log("=Ë Creando gastos logísticos...");
  const tiposGasto = [
    "Flete internacional",
    "Seguro",
    "Aduana / DGA",
    "Impuestos",
    "Broker",
    "Almacenaje",
    "Transporte local",
  ];

  let gastoCount = 0;
  for (const oc of ocs) {
    // 2-3 gastos por OC
    const numGastos = 2 + Math.floor(Math.random() * 2);
    for (let j = 0; j < numGastos; j++) {
      await prisma.gastosLogisticos.create({
        data: {
          idGasto: `GAS-${oc.oc}-${String(j + 1).padStart(3, "0")}`,
          ocId: oc.id,
          fechaGasto: new Date(oc.fechaOC.getTime() + (j + 1) * 5 * 24 * 60 * 60 * 1000),
          tipoGasto: tiposGasto[Math.floor(Math.random() * tiposGasto.length)],
          proveedorServicio: "Proveedor Logístico",
          montoRD: new Prisma.Decimal(3000 + Math.random() * 12000), // RD$ 3,000-15,000
          notas: `Gasto logístico ${j + 1} para ${oc.oc}`,
        },
      });
      gastoCount++;
    }
  }
  console.log(` ${gastoCount} gastos logísticos creados`);

  // Crear recepciones de inventario
  console.log("=å Creando recepciones de inventario...");
  const bodegas = ["Bóveda", "Piantini", "Villa Mella", "Oficina"];

  for (const oc of ocs) {
    // Simular que recibimos 95-98% de lo ordenado
    const cantidadRecibida = Math.floor(oc.cantidadOrdenada * (0.95 + Math.random() * 0.03));

    await prisma.inventarioRecibido.create({
      data: {
        idRecepcion: `REC-${oc.oc}-001`,
        ocId: oc.id,
        fechaLlegada: new Date(oc.fechaOC.getTime() + 25 * 24 * 60 * 60 * 1000), // +25 días
        bodegaInicial: bodegas[Math.floor(Math.random() * bodegas.length)],
        cantidadRecibida: cantidadRecibida,
        notas: `Recepción inicial de ${cantidadRecibida} unidades`,
      },
    });
  }
  console.log(` ${ocs.length} recepciones de inventario creadas`);

  console.log("\n<‰ Seed data completado exitosamente!");
  console.log(`\n=Ê Resumen:`);
  console.log(`   - ${ocs.length} órdenes de compra`);
  console.log(`   - ${pagoCount} pagos`);
  console.log(`   - ${gastoCount} gastos logísticos`);
  console.log(`   - ${ocs.length} recepciones de inventario`);
}

main()
  .catch((e) => {
    console.error("L Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
