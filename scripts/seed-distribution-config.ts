/**
 * Script para insertar configuración inicial de distribución de costos
 *
 * EJECUTAR ANTES de habilitar USE_CONFIG_DISTRIBUTION=true
 *
 * Uso:
 *   npx tsx scripts/seed-distribution-config.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 [Seed] Iniciando seed de configuración de distribución...")

  try {
    // Configuración por defecto que replica comportamiento hardcodeado
    const configs = [
      {
        tipoCosto: "gastos_flete",
        metodoDistribucion: "cajas",
        activo: true,
        descripcion: "Flete internacional - por cajas (más cajas = más espacio)",
      },
      {
        tipoCosto: "gastos_transporte_local",
        metodoDistribucion: "cajas",
        activo: true,
        descripcion: "Transporte local - por cajas (más cajas = más bultos)",
      },
      {
        tipoCosto: "gastos_aduana",
        metodoDistribucion: "valor_fob",
        activo: true,
        descripcion: "Aduana/Impuestos - por valor FOB (más valor = más impuestos)",
      },
      {
        tipoCosto: "comisiones",
        metodoDistribucion: "valor_fob",
        activo: true,
        descripcion: "Comisiones bancarias - por valor FOB (más valor = más comisión)",
      },
    ]

    let created = 0
    let skipped = 0

    for (const config of configs) {
      try {
        await prisma.configuracionDistribucionCostos.create({
          data: config,
        })
        console.log(`✅ [Seed] Creado: ${config.tipoCosto} → ${config.metodoDistribucion}`)
        created++
      } catch (error: any) {
        if (error.code === "P2002") {
          // Unique constraint violation - ya existe
          console.log(`⏭️  [Seed] Ya existe: ${config.tipoCosto}`)
          skipped++
        } else {
          throw error
        }
      }
    }

    console.log("\n📊 [Seed] Resumen:")
    console.log(`  ✅ Creados: ${created}`)
    console.log(`  ⏭️  Omitidos (ya existían): ${skipped}`)

    // Mostrar configuración actual
    console.log("\n📋 [Seed] Configuración actual en BD:")
    const allConfigs = await prisma.configuracionDistribucionCostos.findMany({
      orderBy: { tipoCosto: "asc" },
    })

    allConfigs.forEach(c => {
      console.log(
        `  ${c.tipoCosto.padEnd(30)} → ${c.metodoDistribucion} (${c.activo ? "activo" : "inactivo"})`
      )
    })

    console.log("\n✅ [Seed] Seed completado exitosamente")
  } catch (error) {
    console.error("❌ [Seed] Error durante seed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
