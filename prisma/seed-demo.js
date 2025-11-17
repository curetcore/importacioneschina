const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

// Cliente Prisma para base de datos DEMO
const prismaDemo = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DEMO_DATABASE_URL,
    },
  },
})

async function seedDemoDatabase() {
  console.log("🎯 Iniciando seed de base de datos DEMO...")

  try {
    // 1. Crear usuario demo
    const hashedPassword = await bcrypt.hash("Demo123!", 10)
    const demoUser = await prismaDemo.user.upsert({
      where: { email: "demo@sistema.com" },
      update: {},
      create: {
        name: "Usuario Demo",
        email: "demo@sistema.com",
        password: hashedPassword,
        role: "admin",
      },
    })
    console.log("✅ Usuario demo creado:", demoUser.email)

    // 2. Crear órdenes de compra de ejemplo
    const oc1 = await prismaDemo.oCChina.create({
      data: {
        oc: "OC-00001",
        proveedor: "Guangzhou Fashion Co.",
        fechaOC: new Date("2024-01-15"),
        descripcionLote: "Lote de ropa deportiva - Primavera 2024",
        categoriaPrincipal: "Ropa Deportiva",
        items: {
          create: [
            {
              sku: "SPORT-001",
              nombre: "Camiseta Deportiva Hombre",
              material: "Poliéster 100%",
              color: "Azul/Negro/Blanco",
              cantidadTotal: 500,
              precioUnitarioUSD: 8.5,
              subtotalUSD: 4250,
              tallaDistribucion: {
                S: 100,
                M: 150,
                L: 150,
                XL: 100,
              },
            },
            {
              sku: "SPORT-002",
              nombre: "Pantalón Deportivo Mujer",
              material: "Spandex 15% + Algodón 85%",
              color: "Negro/Gris",
              cantidadTotal: 300,
              precioUnitarioUSD: 12.0,
              subtotalUSD: 3600,
              tallaDistribucion: {
                XS: 50,
                S: 75,
                M: 100,
                L: 75,
              },
            },
          ],
        },
      },
      include: {
        items: true,
      },
    })
    console.log("✅ OC creada:", oc1.oc, "con", oc1.items.length, "items")

    const oc2 = await prismaDemo.oCChina.create({
      data: {
        oc: "OC-00002",
        proveedor: "Shenzhen Electronics Ltd.",
        fechaOC: new Date("2024-02-01"),
        descripcionLote: "Accesorios electrónicos variados",
        categoriaPrincipal: "Electrónicos",
        items: {
          create: [
            {
              sku: "ELEC-001",
              nombre: "Audífonos Bluetooth",
              material: "Plástico ABS",
              color: "Negro/Blanco/Rojo",
              cantidadTotal: 200,
              precioUnitarioUSD: 15.5,
              subtotalUSD: 3100,
            },
            {
              sku: "ELEC-002",
              nombre: "Cargador USB-C 20W",
              material: "Plástico + Componentes electrónicos",
              color: "Blanco",
              cantidadTotal: 400,
              precioUnitarioUSD: 5.2,
              subtotalUSD: 2080,
            },
          ],
        },
      },
      include: {
        items: true,
      },
    })
    console.log("✅ OC creada:", oc2.oc, "con", oc2.items.length, "items")

    // 3. Crear pagos de ejemplo
    const pago1 = await prismaDemo.pagosChina.create({
      data: {
        idPago: "PAG-00001",
        ocId: oc1.id,
        fechaPago: new Date("2024-01-20"),
        tipoPago: "Anticipo",
        metodoPago: "Transferencia",
        moneda: "USD",
        montoOriginal: 3000,
        tasaCambio: 58.5,
        comisionBancoRD: 850,
        montoRD: 175500,
        montoRDNeto: 174650,
      },
    })
    console.log("✅ Pago creado:", pago1.idPago)

    const pago2 = await prismaDemo.pagosChina.create({
      data: {
        idPago: "PAG-00002",
        ocId: oc2.id,
        fechaPago: new Date("2024-02-05"),
        tipoPago: "Saldo",
        metodoPago: "Transferencia",
        moneda: "USD",
        montoOriginal: 5180,
        tasaCambio: 59.0,
        comisionBancoRD: 1200,
        montoRD: 305620,
        montoRDNeto: 304420,
      },
    })
    console.log("✅ Pago creado:", pago2.idPago)

    // 4. Crear gastos logísticos
    const gasto1 = await prismaDemo.gastosLogisticos.create({
      data: {
        idGasto: "GASTO-00001",
        ocId: oc1.id,
        fechaGasto: new Date("2024-02-01"),
        tipoGasto: "Flete Marítimo",
        proveedorServicio: "Ocean Freight International",
        metodoPago: "Transferencia",
        montoRD: 45000,
        notas: "Contenedor 20 pies - Puerto de Guangzhou a Santo Domingo",
      },
    })
    console.log("✅ Gasto creado:", gasto1.idGasto)

    const gasto2 = await prismaDemo.gastosLogisticos.create({
      data: {
        idGasto: "GASTO-00002",
        ocId: oc1.id,
        fechaGasto: new Date("2024-02-15"),
        tipoGasto: "Aduana",
        proveedorServicio: "Agente Aduanal RD",
        metodoPago: "Efectivo",
        montoRD: 12500,
        notas: "Despacho aduanal + ITBIS",
      },
    })
    console.log("✅ Gasto creado:", gasto2.idGasto)

    // 5. Crear recepción de inventario
    const recepcion1 = await prismaDemo.inventarioRecibido.create({
      data: {
        idRecepcion: "REC-00001",
        ocId: oc1.id,
        itemId: oc1.items[0].id,
        fechaLlegada: new Date("2024-02-20"),
        bodegaInicial: "Almacén Central",
        cantidadRecibida: 500,
        costoUnitarioFinalRD: 725.5,
        costoTotalRecepcionRD: 362750,
        notas: "Primera recepción - lote completo",
      },
    })
    console.log("✅ Recepción creada:", recepcion1.idRecepcion)

    console.log("\n🎉 Base de datos DEMO poblada exitosamente!")
    console.log("\n📊 Resumen:")
    console.log("  - 1 Usuario demo")
    console.log("  - 2 Órdenes de compra")
    console.log("  - 4 Items de productos")
    console.log("  - 2 Pagos")
    console.log("  - 2 Gastos logísticos")
    console.log("  - 1 Recepción de inventario")
    console.log("\n🔐 Credenciales demo:")
    console.log("  Email: demo@sistema.com")
    console.log("  Password: Demo123!")
  } catch (error) {
    console.error("❌ Error al poblar base de datos demo:", error)
    throw error
  } finally {
    await prismaDemo.$disconnect()
  }
}

// Ejecutar seed
seedDemoDatabase()
  .then(() => {
    console.log("✅ Seed completado")
    process.exit(0)
  })
  .catch(error => {
    console.error("❌ Error en seed:", error)
    process.exit(1)
  })
