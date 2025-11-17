import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed data...")

  // Limpiar BD
  console.log("🧹 Limpiando base de datos...")
  await prisma.inventarioRecibido.deleteMany()
  await prisma.gastosLogisticos.deleteMany()
  await prisma.pagosChina.deleteMany()
  await prisma.oCChinaItem.deleteMany()
  await prisma.oCChina.deleteMany()
  await prisma.configuracion.deleteMany()
  await prisma.user.deleteMany()

  // Crear datos de configuración
  console.log("⚙️ Creando configuraciones del sistema...")

  const configuraciones = [
    // Proveedores
    { categoria: "proveedores", valor: "Nike China", orden: 1 },
    { categoria: "proveedores", valor: "Adidas Factory", orden: 2 },
    { categoria: "proveedores", valor: "Puma Manufacturing", orden: 3 },
    { categoria: "proveedores", valor: "Fábrica Guangzhou", orden: 4 },
    { categoria: "proveedores", valor: "Shenzhen Leather Co.", orden: 5 },

    // Categorías principales
    { categoria: "categorias", valor: "Zapatos", orden: 1 },
    { categoria: "categorias", valor: "Carteras", orden: 2 },
    { categoria: "categorias", valor: "Cinturones", orden: 3 },
    { categoria: "categorias", valor: "Accesorios", orden: 4 },
    { categoria: "categorias", valor: "Ropa", orden: 5 },

    // Tipos de pago
    { categoria: "tiposPago", valor: "Anticipo", orden: 1 },
    { categoria: "tiposPago", valor: "Pago final", orden: 2 },
    { categoria: "tiposPago", valor: "Pago parcial", orden: 3 },
    { categoria: "tiposPago", valor: "Pago completo", orden: 4 },

    // Métodos de pago
    { categoria: "metodosPago", valor: "Transferencia bancaria", orden: 1 },
    { categoria: "metodosPago", valor: "Tarjeta de crédito", orden: 2 },
    { categoria: "metodosPago", valor: "Tarjeta de débito", orden: 3 },
    { categoria: "metodosPago", valor: "Efectivo", orden: 4 },
    { categoria: "metodosPago", valor: "Cheque", orden: 5 },
    { categoria: "metodosPago", valor: "PayPal", orden: 6 },
    { categoria: "metodosPago", valor: "Alipay", orden: 7 },

    // Bodegas
    { categoria: "bodegas", valor: "Bóveda", orden: 1 },
    { categoria: "bodegas", valor: "Piantini", orden: 2 },
    { categoria: "bodegas", valor: "Villa Mella", orden: 3 },
    { categoria: "bodegas", valor: "Oficina Central", orden: 4 },
    { categoria: "bodegas", valor: "Almacén Norte", orden: 5 },

    // Tipos de gasto
    { categoria: "tiposGasto", valor: "Flete internacional", orden: 1 },
    { categoria: "tiposGasto", valor: "Seguro de carga", orden: 2 },
    { categoria: "tiposGasto", valor: "Aduana / DGA", orden: 3 },
    { categoria: "tiposGasto", valor: "Impuestos", orden: 4 },
    { categoria: "tiposGasto", valor: "Broker aduanal", orden: 5 },
    { categoria: "tiposGasto", valor: "Almacenaje", orden: 6 },
    { categoria: "tiposGasto", valor: "Transporte local", orden: 7 },
    { categoria: "tiposGasto", valor: "Inspección", orden: 8 },
    { categoria: "tiposGasto", valor: "Otros gastos", orden: 9 },
  ]

  for (const config of configuraciones) {
    await prisma.configuracion.create({
      data: {
        categoria: config.categoria,
        valor: config.valor,
        orden: config.orden,
        activo: true,
      },
    })
  }
  console.log(`✅ ${configuraciones.length} configuraciones creadas`)

  // Crear usuario administrador
  console.log("👤 Creando usuario administrador...")
  const bcrypt = await import("bcryptjs")
  const hashedPassword = await bcrypt.hash("admin123", 10)

  await prisma.user.create({
    data: {
      email: "admin@curet.com",
      password: hashedPassword,
      name: "Administrador",
      role: "ADMIN",
      activo: true,
    },
  })
  console.log("✅ Usuario admin creado (email: admin@curet.com, password: admin123)")

  // Crear 10 OCs de ejemplo con items
  console.log("📦 Creando órdenes de compra con productos...")

  // Obtener proveedores desde configuración
  const proveedoresConfig = await prisma.configuracion.findMany({
    where: { categoria: "proveedores", activo: true },
    orderBy: { orden: "asc" },
  })
  const proveedores = proveedoresConfig.map(p => p.valor)

  // Obtener categorías desde configuración
  const categoriasConfig = await prisma.configuracion.findMany({
    where: { categoria: "categorias", activo: true },
    orderBy: { orden: "asc" },
  })
  const categorias = categoriasConfig.map(c => c.valor)
  const skuPrefixes = ["ZAP", "CAR", "CIN", "ACC", "ROP"]

  const ocs = []
  for (let i = 1; i <= 10; i++) {
    const categoria = categorias[Math.floor(Math.random() * categorias.length)]
    const skuPrefix = skuPrefixes[categorias.indexOf(categoria)]

    // Crear entre 2-5 items por OC
    const numItems = 2 + Math.floor(Math.random() * 4)
    const items = []

    for (let j = 0; j < numItems; j++) {
      const cantidadTotal = Math.floor(100 + Math.random() * 300) // 100-400 unidades
      const precioUnitarioUSD = 8 + Math.random() * 12 // $8-20 por unidad
      const subtotalUSD = cantidadTotal * precioUnitarioUSD

      const itemData: any = {
        sku: `${skuPrefix}-${String(i).padStart(3, "0")}-${String(j + 1).padStart(2, "0")}`,
        nombre: `${categoria} Modelo ${i}-${j + 1}`,
        material: j % 2 === 0 ? "Cuero sintético" : "Cuero natural",
        color: ["Negro", "Café", "Beige", "Rojo"][Math.floor(Math.random() * 4)],
        especificaciones: `Producto de alta calidad importado de China`,
        cantidadTotal,
        precioUnitarioUSD: new Prisma.Decimal(precioUnitarioUSD.toFixed(4)),
        subtotalUSD: new Prisma.Decimal(subtotalUSD.toFixed(2)),
      }

      // Solo agregar tallaDistribucion si es el primer item (como ejemplo)
      if (j === 0) {
        itemData.tallaDistribucion = { S: 30, M: 40, L: 30 }
      }

      items.push(itemData)
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
    })
    ocs.push(oc)
  }
  console.log(
    `✅ ${ocs.length} órdenes de compra creadas con ${ocs.reduce((sum, oc) => sum + oc.items.length, 0)} productos`
  )

  // Crear pagos para cada OC
  console.log("💰 Creando pagos...")
  let pagoCount = 0
  for (const oc of ocs) {
    const costoFOBTotal = oc.items.reduce(
      (sum, item) => sum + parseFloat(item.subtotalUSD.toString()),
      0
    )

    // Pago 1: Anticipo 50% en USD
    const montoAnticipo = new Prisma.Decimal(costoFOBTotal * 0.5)
    const tasaUSD = new Prisma.Decimal(58.5)
    const montoRD1 = new Prisma.Decimal(parseFloat(montoAnticipo.toString()) * 58.5)
    const comision1 = new Prisma.Decimal(500)

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
    })
    pagoCount++

    // Pago 2: Pago final 50% en CNY
    const montoCNY = new Prisma.Decimal(costoFOBTotal * 0.5 * 7.3) // USD a CNY
    const tasaCNY = new Prisma.Decimal(8.2)
    const montoRD2 = new Prisma.Decimal(parseFloat(montoCNY.toString()) * 8.2)
    const comision2 = new Prisma.Decimal(250)

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
    })
    pagoCount++
  }
  console.log(`✅ ${pagoCount} pagos creados`)

  // Crear gastos logísticos
  console.log("🚚 Creando gastos logísticos...")

  // Obtener tipos de gasto desde configuración
  const tiposGastoConfig = await prisma.configuracion.findMany({
    where: { categoria: "tiposGasto", activo: true },
    orderBy: { orden: "asc" },
  })
  const tiposGasto = tiposGastoConfig.map(t => t.valor)

  // Obtener métodos de pago desde configuración
  const metodosPagoConfig = await prisma.configuracion.findMany({
    where: { categoria: "metodosPago", activo: true },
    orderBy: { orden: "asc" },
  })
  const metodosPago = metodosPagoConfig.map(m => m.valor)

  let gastoCount = 0
  for (const oc of ocs) {
    // 2-3 gastos por OC
    const numGastos = 2 + Math.floor(Math.random() * 2)
    for (let j = 0; j < numGastos; j++) {
      await prisma.gastosLogisticos.create({
        data: {
          idGasto: `GAS-${oc.oc}-${String(j + 1).padStart(3, "0")}`,
          fechaGasto: new Date(oc.fechaOC.getTime() + (j + 1) * 5 * 24 * 60 * 60 * 1000),
          tipoGasto: tiposGasto[Math.floor(Math.random() * tiposGasto.length)],
          proveedorServicio: "Proveedor Logístico",
          metodoPago: metodosPago[Math.floor(Math.random() * metodosPago.length)],
          montoRD: new Prisma.Decimal(3000 + Math.random() * 12000), // RD$ 3,000-15,000
          notas: `Gasto logístico ${j + 1} para ${oc.oc}`,
          ordenesCompra: {
            create: {
              ocId: oc.id,
            },
          },
        },
      })
      gastoCount++
    }
  }
  console.log(`✅ ${gastoCount} gastos logísticos creados`)

  // Crear recepciones de inventario (vinculadas a items específicos)
  console.log("📥 Creando recepciones de inventario...")

  // Obtener bodegas desde configuración
  const bodegasConfig = await prisma.configuracion.findMany({
    where: { categoria: "bodegas", activo: true },
    orderBy: { orden: "asc" },
  })
  const bodegas = bodegasConfig.map(b => b.valor)

  let recepcionCount = 0

  for (const oc of ocs) {
    // Para cada item, recibir entre 90-100% de lo ordenado
    for (let itemIndex = 0; itemIndex < oc.items.length; itemIndex++) {
      const item = oc.items[itemIndex]
      const cantidadRecibida = Math.floor(item.cantidadTotal * (0.9 + Math.random() * 0.1))

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
      })
      recepcionCount++
    }
  }
  console.log(`✅ ${recepcionCount} recepciones de inventario creadas`)

  console.log("\n✨ Seed data completado exitosamente!")
  console.log(`\n📊 Resumen:`)
  console.log(`   - ${configuraciones.length} configuraciones del sistema`)
  console.log(`   - 1 usuario administrador`)
  console.log(`   - ${ocs.length} órdenes de compra`)
  console.log(`   - ${ocs.reduce((sum, oc) => sum + oc.items.length, 0)} productos`)
  console.log(`   - ${pagoCount} pagos`)
  console.log(`   - ${gastoCount} gastos logísticos`)
  console.log(`   - ${recepcionCount} recepciones de inventario`)
  console.log(`\n🔑 Credenciales de acceso:`)
  console.log(`   Email: admin@curet.com`)
  console.log(`   Password: admin123`)
}

main()
  .catch(e => {
    console.error("❌ Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
