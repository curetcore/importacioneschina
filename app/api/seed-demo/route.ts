import { NextResponse } from "next/server"
import { prismaDemo } from "@/lib/prisma"
import bcrypt from "bcryptjs"

/**
 * API endpoint para inicializar la base de datos DEMO
 * Solo se ejecuta una vez para crear el usuario demo y datos de ejemplo
 */
export async function POST(req: Request) {
  try {
    // Verificar si ya existe el usuario demo
    const existingUser = await prismaDemo.user.findUnique({
      where: { email: "demo@sistema.com" },
    })

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "La base de datos demo ya está inicializada",
        userExists: true,
      })
    }

    // 1. Crear usuario demo
    const hashedPassword = await bcrypt.hash("Demo123!", 10)
    const demoUser = await prismaDemo.user.create({
      data: {
        name: "Usuario Demo",
        email: "demo@sistema.com",
        password: hashedPassword,
        role: "admin",
      },
    })

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

    // 3. Crear pagos de ejemplo
    await prismaDemo.pagosChina.create({
      data: {
        idPago: "PAG-00001",
        ocId: oc1.id,
        fechaPago: new Date("2024-01-20"),
        tipoPago: "Anticipo",
        metodoPago: "Transferencia",
        moneda: "USD",
        montoOriginal: 3000,
        tasaCambio: 58.5,
        comisionBancoUSD: 15,
        montoRD: 175500,
        montoRDNeto: 176377.5,
      },
    })

    await prismaDemo.pagosChina.create({
      data: {
        idPago: "PAG-00002",
        ocId: oc2.id,
        fechaPago: new Date("2024-02-05"),
        tipoPago: "Saldo",
        metodoPago: "Transferencia",
        moneda: "USD",
        montoOriginal: 5180,
        tasaCambio: 59.0,
        comisionBancoUSD: 20,
        montoRD: 305620,
        montoRDNeto: 306800,
      },
    })

    // 4. Crear gastos logísticos
    await prismaDemo.gastosLogisticos.create({
      data: {
        idGasto: "GASTO-00001",
        fechaGasto: new Date("2024-02-01"),
        tipoGasto: "Flete Marítimo",
        proveedorServicio: "Ocean Freight International",
        metodoPago: "Transferencia",
        montoRD: 45000,
        notas: "Contenedor 20 pies - Puerto de Guangzhou a Santo Domingo",
        ordenesCompra: {
          create: {
            ocId: oc1.id,
          },
        },
      },
    })

    await prismaDemo.gastosLogisticos.create({
      data: {
        idGasto: "GASTO-00002",
        fechaGasto: new Date("2024-02-15"),
        tipoGasto: "Aduana",
        proveedorServicio: "Agente Aduanal RD",
        metodoPago: "Efectivo",
        montoRD: 12500,
        notas: "Despacho aduanal + ITBIS",
        ordenesCompra: {
          create: {
            ocId: oc1.id,
          },
        },
      },
    })

    // 5. Crear recepción de inventario
    await prismaDemo.inventarioRecibido.create({
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

    // 6. Crear configuraciones
    const configs = [
      { tipoCosto: "Flete Marítimo", metodoDistribucion: "peso" },
      { tipoCosto: "Aduana", metodoDistribucion: "valor_fob" },
      { tipoCosto: "Flete Interno", metodoDistribucion: "unidades" },
      { tipoCosto: "Almacenaje", metodoDistribucion: "volumen" },
    ]

    for (const config of configs) {
      await prismaDemo.configuracionDistribucionCostos.upsert({
        where: { tipoCosto: config.tipoCosto },
        create: {
          tipoCosto: config.tipoCosto,
          metodoDistribucion: config.metodoDistribucion,
          activo: true,
        },
        update: {
          metodoDistribucion: config.metodoDistribucion,
          activo: true,
        },
      })
    }

    // 7. Crear configuraciones generales
    const configuraciones = [
      // Categorías
      { categoria: "categorias", valor: "Zapatos", orden: 1 },
      { categoria: "categorias", valor: "Carteras", orden: 2 },
      { categoria: "categorias", valor: "Cinturones", orden: 3 },
      { categoria: "categorias", valor: "Accesorios", orden: 4 },
      { categoria: "categorias", valor: "Ropa Deportiva", orden: 5 },
      { categoria: "categorias", valor: "Electrónicos", orden: 6 },
      { categoria: "categorias", valor: "Mix", orden: 7 },

      // Tipos de Pago
      { categoria: "tiposPago", valor: "Anticipo", orden: 1 },
      { categoria: "tiposPago", valor: "Pago final", orden: 2 },
      { categoria: "tiposPago", valor: "Flete", orden: 3 },
      { categoria: "tiposPago", valor: "Impuestos", orden: 4 },
      { categoria: "tiposPago", valor: "Broker", orden: 5 },
      { categoria: "tiposPago", valor: "Otros", orden: 6 },

      // Métodos de Pago
      { categoria: "metodosPago", valor: "Transferencia", orden: 1 },
      { categoria: "metodosPago", valor: "Tarjeta de credito", orden: 2 },
      { categoria: "metodosPago", valor: "Tarjeta de debito", orden: 3 },
      { categoria: "metodosPago", valor: "Efectivo", orden: 4 },
      { categoria: "metodosPago", valor: "Cheque", orden: 5 },

      // Bodegas
      { categoria: "bodegas", valor: "Boveda", orden: 1 },
      { categoria: "bodegas", valor: "Piantini", orden: 2 },
      { categoria: "bodegas", valor: "Villa Mella", orden: 3 },
      { categoria: "bodegas", valor: "Oficina", orden: 4 },
      { categoria: "bodegas", valor: "Otra", orden: 5 },

      // Tipos de Gasto
      { categoria: "tiposGasto", valor: "Flete internacional", orden: 1 },
      { categoria: "tiposGasto", valor: "Seguro", orden: 2 },
      { categoria: "tiposGasto", valor: "Aduana / DGA", orden: 3 },
      { categoria: "tiposGasto", valor: "Impuestos", orden: 4 },
      { categoria: "tiposGasto", valor: "Broker", orden: 5 },
      { categoria: "tiposGasto", valor: "Almacenaje", orden: 6 },
      { categoria: "tiposGasto", valor: "Transporte local", orden: 7 },
      { categoria: "tiposGasto", valor: "Otros", orden: 8 },
    ]

    for (const config of configuraciones) {
      await prismaDemo.configuracion.upsert({
        where: {
          categoria_valor: {
            categoria: config.categoria,
            valor: config.valor,
          },
        },
        create: {
          categoria: config.categoria,
          valor: config.valor,
          orden: config.orden,
          activo: true,
        },
        update: {
          orden: config.orden,
          activo: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Base de datos demo inicializada exitosamente",
      data: {
        user: demoUser.email,
        ordenes: 2,
        items: 4,
        pagos: 2,
        gastos: 2,
        inventario: 1,
      },
    })
  } catch (error: any) {
    console.error("Error seeding demo database:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al inicializar base de datos demo",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
