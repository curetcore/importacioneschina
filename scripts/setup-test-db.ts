#!/usr/bin/env tsx
/**
 * Script para configurar BD de tests E2E (PostgreSQL local)
 * Se ejecuta automáticamente antes de cada test run
 *
 * NOTA: Este script usa PostgreSQL LOCAL - NO afecta producción
 */

import { PrismaClient } from "@prisma/client"
import { execSync } from "child_process"
import bcrypt from "bcryptjs"

const TEST_DB_URL = "postgresql://ronaldopaulino@localhost:5432/curet_test_e2e"

console.log("🧪 Configurando BD de tests E2E...")
console.log("📍 PostgreSQL local: localhost:5432/curet_test_e2e")
console.log("⚠️  Esta BD es SOLO para tests - NO afecta producción\n")

async function setupTestDatabase() {
  try {
    // 1. Verificar que PostgreSQL esté corriendo
    console.log("1️⃣ Verificando PostgreSQL local...")
    try {
      execSync('psql -U postgres -c "SELECT 1" 2>/dev/null || psql postgres -c "SELECT 1"', {
        stdio: "ignore",
      })
      console.log("   ✅ PostgreSQL está corriendo")
    } catch (error) {
      throw new Error("PostgreSQL no está corriendo. Ejecuta: brew services start postgresql@16")
    }

    // 2. Crear BD de tests si no existe
    console.log("\n2️⃣ Creando BD de tests...")
    try {
      execSync("createdb curet_test_e2e 2>/dev/null", { stdio: "ignore" })
      console.log("   ✅ BD creada")
    } catch (error) {
      // BD ya existe, limpiarla
      console.log("   ⚠️  BD ya existe, limpiando...")
      execSync("dropdb curet_test_e2e --if-exists && createdb curet_test_e2e", {
        stdio: "ignore",
      })
      console.log("   ✅ BD limpiada y recreada")
    }

    // 3. Crear schema con Prisma
    console.log("\n3️⃣ Creando schema...")
    execSync("npx prisma db push --skip-generate", {
      env: {
        ...process.env,
        DATABASE_URL: TEST_DB_URL,
      },
      stdio: "inherit",
    })
    console.log("   ✅ Schema creado")

    // 4. Conectar con Prisma y poblar datos
    console.log("\n4️⃣ Poblando datos de prueba...")
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_DB_URL,
        },
      },
    })

    try {
      // Crear usuario de prueba
      const hashedPassword = await bcrypt.hash("Test123456", 10)

      await prisma.user.create({
        data: {
          email: "test@curetcore.com",
          password: hashedPassword,
          name: "Usuario",
          lastName: "Test",
          role: "admin",
          activo: true,
        },
      })
      console.log("   ✅ Usuario de prueba creado (test@curetcore.com)")

      // Crear configuraciones básicas
      const configs = [
        { categoria: "metodosPago", valor: "Transferencia" },
        { categoria: "metodosPago", valor: "Efectivo" },
        { categoria: "tiposGasto", valor: "Flete Marítimo" },
        { categoria: "tiposGasto", valor: "Aduana" },
        { categoria: "tiposGasto", valor: "Almacenaje" },
      ]

      for (const config of configs) {
        await prisma.configuracion.create({ data: config })
      }
      console.log("   ✅ Configuraciones creadas")

      // Crear proveedor de ejemplo
      const proveedor = await prisma.proveedor.create({
        data: {
          codigo: "PROV-SEED-001",
          nombre: "Proveedor Ejemplo",
          contactoPrincipal: "Juan Pérez",
          email: "contacto@proveedor.com",
          telefono: "+86-123-456-7890",
          pais: "China",
          ciudad: "Guangzhou",
        },
      })
      console.log("   ✅ Proveedor de ejemplo creado")

      // Crear OC de ejemplo
      const oc = await prisma.oCChina.create({
        data: {
          oc: "OC-SEED-001",
          proveedor: proveedor.nombre,
          fechaOC: new Date("2025-01-15"),
          categoriaPrincipal: "Electrónicos",
          descripcionLote: "Orden de prueba para tests E2E",
        },
      })
      console.log("   ✅ Orden de compra de ejemplo creada")

      // Crear gasto logístico de ejemplo
      await prisma.gastosLogisticos.create({
        data: {
          idGasto: "GL-SEED-001",
          fechaGasto: new Date("2025-01-20"),
          tipoGasto: "Flete Marítimo",
          metodoPago: "Transferencia",
          montoRD: 15000,
          proveedorServicio: "Naviera Ejemplo",
          notas: "Gasto de ejemplo para tests E2E",
        },
      })
      console.log("   ✅ Gasto logístico de ejemplo creado")

      console.log("\n✅ BD de tests configurada exitosamente!")
      console.log("\n📊 Datos creados:")
      console.log("   👤 1 usuario (test@curetcore.com / Test123456)")
      console.log("   ⚙️  5 configuraciones")
      console.log("   🏢 1 proveedor")
      console.log("   📦 1 orden de compra")
      console.log("   💰 1 gasto logístico")
      console.log(
        "\n💡 Los tests E2E pueden usar estos datos o crear sus propios datos de prueba\n"
      )
    } finally {
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error("\n❌ Error configurando BD de tests:", error)
    throw error
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  setupTestDatabase()
    .then(() => {
      console.log("🎉 ¡Listo para ejecutar tests E2E!")
      console.log("📝 Ejecuta: npm run test:e2e:ui\n")
      process.exit(0)
    })
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

export { setupTestDatabase }
