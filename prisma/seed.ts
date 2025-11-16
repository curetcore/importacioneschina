import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed data...");

  // Limpiar BD
  console.log("🧹 Limpiando base de datos...");
  await prisma.inventarioRecibido.deleteMany();
  await prisma.gastosLogisticos.deleteMany();
  await prisma.pagosChina.deleteMany();
  await prisma.oCChinaItem.deleteMany();
  await prisma.oCChina.deleteMany();

  // Crear 10 OCs de ejemplo con items
  console.log("📦 Creando órdenes de compra con productos...");
  const proveedores = ["China 1", "China 2", "Fábrica X"];
  const categorias = ["Zapatos", "Carteras", "Cinturones", "Accesorios"];
  const skuPrefixes = ["ZAP", "CAR", "CIN", "ACC"];

  const ocs = [];
  for (let i = 1; i <= 10; i++) {
    const categoria = categorias[Math.floor(Math.random() * categorias.length)];
    const skuPrefix = skuPrefixes[categorias.indexOf(categoria)];

    // Crear entre 2-5 items por OC
    const numItems = 2 + Math.floor(Math.random() * 4);
    const items = [];

    for (let j = 0; j < numItems; j++) {
      const cantidadTotal = Math.floor(100 + Math.random() * 300); // 100-400 unidades
      const precioUnitarioUSD = 8 + Math.random() * 12; // $8-20 por unidad
      const subtotalUSD = cantidadTotal * precioUnitarioUSD;

      const itemData: any = {
        sku: `${skuPrefix}-${String(i).padStart(3, "0")}-${String(j + 1).padStart(2, "0")}`,
        nombre: `${categoria} Modelo ${i}-${j + 1}`,
        material: j % 2 === 0 ? "Cuero sintético" : "Cuero natural",
        color: ["Negro", "Café", "Beige", "Rojo"][Math.floor(Math.random() * 4)],
        especificaciones: `Producto de alta calidad importado de China`,
        cantidadTotal,
        precioUnitarioUSD: new Prisma.Decimal(precioUnitarioUSD.toFixed(4)),
        subtotalUSD: new Prisma.Decimal(subtotalUSD.toFixed(2)),
      };

      // Solo agregar tallaDistribucion si es el primer item (como ejemplo)
      if (j === 0) {
        itemData.tallaDistribucion = { "S": 30, "M": 40, "L": 30 };
      }

      items.push(itemData);
    }

    const oc = await prisma.oCChina.create({
      data: {
        oc: `OC-2025-${String(i).padStart(3, "0")}`,
        proveedor: proveedores[Math.floor(Math.random() * proveedores.length)],
        fechaOC: new Date(2025, 0, i * 3), // Cada 3 días
        descripcionLote: `Lote de importación #${i} - Mix de ${categoria}`,
        categoriaPrincipal: categoria,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });
    ocs.push(oc);
  }
  console.log(`✅ ${ocs.length} órdenes de compra creadas con ${ocs.reduce((sum, oc) => sum + oc.items.length, 0)} productos`);

  // Crear pagos para cada OC
  console.log("💰 Creando pagos...");
  let pagoCount = 0;
  for (const oc of ocs) {
    const costoFOBTotal = oc.items.reduce((sum, item) => sum + parseFloat(item.subtotalUSD.toString()), 0);

    // Pago 1: Anticipo 50% en USD
    const montoAnticipo = new Prisma.Decimal(costoFOBTotal * 0.5);
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
    const montoCNY = new Prisma.Decimal((costoFOBTotal * 0.5) * 7.3); // USD a CNY
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
  console.log(`✅ ${pagoCount} pagos creados`);

  // Crear gastos logísticos
  console.log("🚚 Creando gastos logísticos...");
  const tiposGasto = [
    "Flete internacional",
    "Seguro",
    "Aduana / DGA",
    "Impuestos",
    "Broker",
    "Almacenaje",
    "Transporte local",
  ];

  const metodosPago = [
    "Transferencia",
    "Tarjeta de credito",
    "Tarjeta de debito",
    "Efectivo",
    "Cheque",
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
          metodoPago: metodosPago[Math.floor(Math.random() * metodosPago.length)],
          montoRD: new Prisma.Decimal(3000 + Math.random() * 12000), // RD$ 3,000-15,000
          notas: `Gasto logístico ${j + 1} para ${oc.oc}`,
        },
      });
      gastoCount++;
    }
  }
  console.log(`✅ ${gastoCount} gastos logísticos creados`);

  // Crear recepciones de inventario (vinculadas a items específicos)
  console.log("📥 Creando recepciones de inventario...");
  const bodegas = ["Bóveda", "Piantini", "Villa Mella", "Oficina"];
  let recepcionCount = 0;

  for (const oc of ocs) {
    // Para cada item, recibir entre 90-100% de lo ordenado
    for (let itemIndex = 0; itemIndex < oc.items.length; itemIndex++) {
      const item = oc.items[itemIndex];
      const cantidadRecibida = Math.floor(item.cantidadTotal * (0.90 + Math.random() * 0.10));

      await prisma.inventarioRecibido.create({
        data: {
          idRecepcion: `REC-${oc.oc}-${String(itemIndex + 1).padStart(3, "0")}`,
          ocId: oc.id,
          itemId: item.id,
          fechaLlegada: new Date(oc.fechaOC.getTime() + 25 * 24 * 60 * 60 * 1000), // +25 días
          bodegaInicial: bodegas[Math.floor(Math.random() * bodegas.length)],
          cantidadRecibida: cantidadRecibida,
          costoUnitarioFinalRD: new Prisma.Decimal(0), // Se calculará en tiempo real
          costoTotalRecepcionRD: new Prisma.Decimal(0), // Se calculará en tiempo real
          notas: `Recepción de ${item.nombre} - ${cantidadRecibida} unidades`,
        },
      });
      recepcionCount++;
    }
  }
  console.log(`✅ ${recepcionCount} recepciones de inventario creadas`);

  console.log("\n✨ Seed data completado exitosamente!");
  console.log(`\n📊 Resumen:`);
  console.log(`   - ${ocs.length} órdenes de compra`);
  console.log(`   - ${ocs.reduce((sum, oc) => sum + oc.items.length, 0)} productos`);
  console.log(`   - ${pagoCount} pagos`);
  console.log(`   - ${gastoCount} gastos logísticos`);
  console.log(`   - ${recepcionCount} recepciones de inventario`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
