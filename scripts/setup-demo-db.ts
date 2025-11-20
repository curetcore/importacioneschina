#!/usr/bin/env tsx
/**
 * Script para configurar la base de datos DEMO
 * - Actualiza schema
 * - Crea datos de prueba
 * - Crea usuario de test para E2E
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const DEMO_DATABASE_URL = process.env.DEMO_DATABASE_URL

if (!DEMO_DATABASE_URL) {
  console.error("❌ DEMO_DATABASE_URL no está configurada en .env")
  process.exit(1)
}

console.log("🔧 Configurando BD Demo...")
console.log(`📍 URL: ${DEMO_DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`)

const prismaDemo = new PrismaClient({
  datasources: {
    db: {
      url: DEMO_DATABASE_URL,
    },
  },
})

async function main() {
  try {
    // 1. Verificar conexión
    console.log("\n1️⃣ Verificando conexión a BD demo...")
    await prismaDemo.$queryRaw`SELECT 1`
    console.log("✅ Conexión exitosa")

    // 2. Crear usuario de prueba para E2E
    console.log("\n2️⃣ Creando usuario de prueba E2E...")
    const testUserEmail = "test@curetcore.com"
    const testUserPassword = "Test123456"

    // Verificar si ya existe
    const existingUser = await prismaDemo.user.findUnique({
      where: { email: testUserEmail },
    })

    if (existingUser) {
      console.log("⚠️  Usuario de prueba ya existe, actualizando...")

      // Actualizar password por si cambió
      const hashedPassword = await bcrypt.hash(testUserPassword, 10)
      await prismaDemo.user.update({
        where: { email: testUserEmail },
        data: {
          password: hashedPassword,
          name: "Usuario",
          lastName: "Test",
          role: "admin",
          activo: true,
        },
      })
      console.log("✅ Usuario actualizado")
    } else {
      // Crear nuevo
      const hashedPassword = await bcrypt.hash(testUserPassword, 10)
      await prismaDemo.user.create({
        data: {
          email: testUserEmail,
          password: hashedPassword,
          name: "Usuario",
          lastName: "Test",
          role: "admin",
          activo: true,
        },
      })
      console.log("✅ Usuario creado")
    }

    // 3. Verificar datos existentes
    console.log("\n3️⃣ Verificando datos en BD demo...")

    const counts = {
      usuarios: await prismaDemo.user.count(),
      ordenes: await prismaDemo.oCChina.count({ where: { deletedAt: null } }),
      pagos: await prismaDemo.pagosChina.count({ where: { deletedAt: null } }),
      gastos: await prismaDemo.gastosLogisticos.count({ where: { deletedAt: null } }),
      inventario: await prismaDemo.inventarioRecibido.count({ where: { deletedAt: null } }),
      proveedores: await prismaDemo.proveedor.count({ where: { activo: true } }),
    }

    console.log("📊 Datos actuales:")
    console.log(`   👥 Usuarios: ${counts.usuarios}`)
    console.log(`   📦 Órdenes: ${counts.ordenes}`)
    console.log(`   💰 Pagos: ${counts.pagos}`)
    console.log(`   🚚 Gastos: ${counts.gastos}`)
    console.log(`   📋 Inventario: ${counts.inventario}`)
    console.log(`   🏭 Proveedores: ${counts.proveedores}`)

    if (counts.ordenes === 0) {
      console.log("\n⚠️  La BD demo está vacía. ¿Quieres poblarla con datos de prueba?")
      console.log("   Ejecuta: npm run db:seed")
    }

    // 4. Resumen
    console.log("\n✅ BD Demo configurada correctamente!")
    console.log("\n📝 Credenciales de prueba E2E:")
    console.log(`   Email: ${testUserEmail}`)
    console.log(`   Password: ${testUserPassword}`)
    console.log(`   Rol: admin`)
    console.log("\n🧪 Para ejecutar tests E2E:")
    console.log("   npm run test:e2e:ui")
  } catch (error) {
    console.error("\n❌ Error:", error)
    throw error
  } finally {
    await prismaDemo.$disconnect()
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
