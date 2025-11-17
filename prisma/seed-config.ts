/**
 * Script para migrar configuraciones desde lib/validations.ts a la base de datos
 * Ejecutar con: npx tsx prisma/seed-config.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const configuraciones = [
  // Categorías
  { categoria: "categorias", valor: "Zapatos", orden: 1 },
  { categoria: "categorias", valor: "Carteras", orden: 2 },
  { categoria: "categorias", valor: "Cinturones", orden: 3 },
  { categoria: "categorias", valor: "Accesorios", orden: 4 },
  { categoria: "categorias", valor: "Mix", orden: 5 },

  // Proveedores
  { categoria: "proveedores", valor: "China 1", orden: 1 },
  { categoria: "proveedores", valor: "China 2", orden: 2 },
  { categoria: "proveedores", valor: "Fabrica X", orden: 3 },
  { categoria: "proveedores", valor: "Otro", orden: 4 },

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

async function main() {
  console.log("🌱 Iniciando migración de configuraciones...")

  // Verificar si ya existen configuraciones
  const count = await prisma.configuracion.count()

  if (count > 0) {
    console.log(`✓ Ya existen ${count} configuraciones en la base de datos.`)
    console.log("  Saltando migración para evitar duplicados.")
    return
  }

  let created = 0
  let skipped = 0

  for (const config of configuraciones) {
    try {
      await prisma.configuracion.create({
        data: {
          categoria: config.categoria,
          valor: config.valor,
          orden: config.orden,
          activo: true,
        },
      })
      created++
      console.log(`✓ Creado: ${config.categoria} - ${config.valor}`)
    } catch (error: any) {
      // Si ya existe (unique constraint), skip
      if (error.code === "P2002") {
        skipped++
        console.log(`⊘ Ya existe: ${config.categoria} - ${config.valor}`)
      } else {
        console.error(`✗ Error creando ${config.categoria} - ${config.valor}:`, error.message)
      }
    }
  }

  console.log("\n✨ Migración completada!")
  console.log(`   Creadas: ${created}`)
  console.log(`   Omitidas (ya existían): ${skipped}`)
  console.log(`   Total en BD: ${await prisma.configuracion.count()}`)
}

main()
  .catch(e => {
    console.error("❌ Error durante la migración:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
