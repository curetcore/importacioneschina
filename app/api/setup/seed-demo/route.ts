import { NextResponse } from "next/server"
import { prismaDemo } from "@/lib/prisma"
import bcrypt from "bcryptjs"

/**
 * Endpoint temporal para poblar la base de datos DEMO
 * Solo ejecutar UNA VEZ para configurar la base de datos demo
 *
 * POST /api/setup/seed-demo
 */
export async function POST() {
  try {
    console.log("🎯 Iniciando seed de configuraciones DEMO...")

    // Crear configuraciones generales
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

    let createdConfigs = 0
    let skippedConfigs = 0

    for (const config of configuraciones) {
      try {
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
        createdConfigs++
      } catch (error) {
        skippedConfigs++
        console.error(`Error con ${config.categoria} - ${config.valor}:`, error)
      }
    }

    console.log("✅ Configuraciones generales creadas:", createdConfigs, "items")
    console.log("⊘ Configuraciones omitidas:", skippedConfigs, "items")

    return NextResponse.json({
      success: true,
      message: "Base de datos DEMO poblada con configuraciones",
      stats: {
        created: createdConfigs,
        skipped: skippedConfigs,
        total: configuraciones.length,
      },
    })
  } catch (error) {
    console.error("❌ Error al poblar base de datos demo:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al poblar configuraciones demo",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
