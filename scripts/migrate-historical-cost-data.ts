#!/usr/bin/env tsx
/**
 * Migration Script: Fill missing peso/volumen data for historical products
 *
 * This script updates OCChinaItem records that are missing pesoUnitarioKg
 * or volumenUnitarioCBM with reasonable default values based on:
 * - Product category
 * - Product price (higher price usually means heavier/bigger items)
 * - Average values from similar products
 *
 * Run: npx tsx scripts/migrate-historical-cost-data.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Default peso/volumen values by category (in kg and CBM)
// These are typical values for common product categories
const CATEGORY_DEFAULTS = {
  // Calzado / Zapatos
  zapatos: { peso: 0.5, volumen: 0.003 }, // 500g, 3 liters
  calzado: { peso: 0.5, volumen: 0.003 },
  shoes: { peso: 0.5, volumen: 0.003 },

  // Carteras / Bolsos
  carteras: { peso: 0.3, volumen: 0.002 }, // 300g, 2 liters
  bolsos: { peso: 0.3, volumen: 0.002 },
  bags: { peso: 0.3, volumen: 0.002 },

  // Ropa
  ropa: { peso: 0.2, volumen: 0.001 }, // 200g, 1 liter
  clothing: { peso: 0.2, volumen: 0.001 },

  // Accesorios
  accesorios: { peso: 0.1, volumen: 0.0005 }, // 100g, 0.5 liters
  accessories: { peso: 0.1, volumen: 0.0005 },

  // Electrónicos
  electronicos: { peso: 0.4, volumen: 0.0015 },
  electronics: { peso: 0.4, volumen: 0.0015 },

  // Default para categorías desconocidas
  default: { peso: 0.3, volumen: 0.002 },
}

/**
 * Get default peso/volumen based on category and price
 */
function getDefaultValues(categoria: string, precioUSD: number): { peso: number; volumen: number } {
  // Find category match (case insensitive, partial match)
  const categoriaLower = categoria.toLowerCase()
  let defaults = CATEGORY_DEFAULTS.default

  for (const [key, value] of Object.entries(CATEGORY_DEFAULTS)) {
    if (categoriaLower.includes(key)) {
      defaults = value
      break
    }
  }

  // Adjust based on price (more expensive items tend to be heavier/bigger)
  // Price multiplier: $1-10 = 0.7x, $10-50 = 1x, $50+ = 1.3x
  let priceMultiplier = 1.0
  if (precioUSD < 10) {
    priceMultiplier = 0.7
  } else if (precioUSD > 50) {
    priceMultiplier = 1.3
  }

  return {
    peso: defaults.peso * priceMultiplier,
    volumen: defaults.volumen * priceMultiplier,
  }
}

async function main() {
  console.log("🚀 Iniciando migración de datos históricos de costos...")
  console.log("=" .repeat(60))

  // 1. Find all OCs to get their categories
  const ocs = await prisma.oCChina.findMany({
    select: {
      id: true,
      oc: true,
      categoriaPrincipal: true,
    },
  })

  const ocCategoryMap = new Map<string, string>()
  ocs.forEach(oc => ocCategoryMap.set(oc.id, oc.categoriaPrincipal))

  // 2. Find all items missing peso or volumen
  const itemsToUpdate = await prisma.oCChinaItem.findMany({
    where: {
      OR: [
        { pesoUnitarioKg: null },
        { volumenUnitarioCBM: null },
        { pesoUnitarioKg: 0 },
        { volumenUnitarioCBM: 0 },
      ],
      deletedAt: null,
    },
    select: {
      id: true,
      sku: true,
      nombre: true,
      ocId: true,
      cantidadTotal: true,
      precioUnitarioUSD: true,
      pesoUnitarioKg: true,
      volumenUnitarioCBM: true,
    },
  })

  console.log(`\n📦 Encontrados ${itemsToUpdate.length} productos sin peso/volumen`)

  if (itemsToUpdate.length === 0) {
    console.log("✅ No hay productos para actualizar. ¡Todo listo!")
    return
  }

  // 3. Calculate and update each item
  let updated = 0
  let errors = 0

  for (const item of itemsToUpdate) {
    try {
      const categoria = ocCategoryMap.get(item.ocId) || "default"
      const precioUSD = parseFloat(item.precioUnitarioUSD.toString())

      const { peso, volumen } = getDefaultValues(categoria, precioUSD)

      // Calculate totals
      const pesoTotal = peso * item.cantidadTotal
      const volumenTotal = volumen * item.cantidadTotal

      // Only update if currently null or 0
      const needsPeso = !item.pesoUnitarioKg || parseFloat(item.pesoUnitarioKg.toString()) === 0
      const needsVolumen = !item.volumenUnitarioCBM || parseFloat(item.volumenUnitarioCBM.toString()) === 0

      if (needsPeso || needsVolumen) {
        await prisma.oCChinaItem.update({
          where: { id: item.id },
          data: {
            ...(needsPeso && {
              pesoUnitarioKg: peso,
              pesoTotalKg: pesoTotal,
            }),
            ...(needsVolumen && {
              volumenUnitarioCBM: volumen,
              volumenTotalCBM: volumenTotal,
            }),
          },
        })

        updated++

        console.log(`  ✓ ${item.sku} - ${item.nombre}`)
        console.log(`    Categoría: ${categoria}`)
        console.log(`    Precio: $${precioUSD.toFixed(2)} USD`)
        if (needsPeso) {
          console.log(`    Peso: ${peso.toFixed(3)} kg/u → Total: ${pesoTotal.toFixed(2)} kg`)
        }
        if (needsVolumen) {
          console.log(`    Volumen: ${volumen.toFixed(6)} CBM/u → Total: ${volumenTotal.toFixed(4)} CBM`)
        }
        console.log()
      }
    } catch (error) {
      errors++
      console.error(`  ✗ Error actualizando ${item.sku}:`, error)
    }
  }

  console.log("=" .repeat(60))
  console.log(`\n✅ Migración completada:`)
  console.log(`   - Productos actualizados: ${updated}`)
  console.log(`   - Errores: ${errors}`)
  console.log(`   - Total procesados: ${itemsToUpdate.length}`)

  if (updated > 0) {
    console.log("\n💡 Nota: Los valores son estimaciones basadas en categoría y precio.")
    console.log("   Puedes actualizar manualmente si tienes datos más precisos.")
  }
}

main()
  .catch(error => {
    console.error("❌ Error fatal en migración:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
