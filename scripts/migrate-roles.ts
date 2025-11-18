import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SUPER_ADMIN_EMAIL = "info@curetshop.com"

async function migrateRoles() {
  console.log("🔄 Iniciando migración de roles...")

  try {
    // 1. Migrar "user" → "limitado"
    const usersUpdated = await prisma.user.updateMany({
      where: { role: "user" },
      data: { role: "limitado" },
    })
    console.log(`✅ ${usersUpdated.count} usuarios migrados de "user" → "limitado"`)

    // 2. Asegurar que info@curetshop.com sea "superadmin"
    const superAdmin = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL },
    })

    if (superAdmin) {
      await prisma.user.update({
        where: { email: SUPER_ADMIN_EMAIL },
        data: { role: "superadmin" },
      })
      console.log(`✅ ${SUPER_ADMIN_EMAIL} asignado como "superadmin"`)
    } else {
      console.log(`⚠️  Usuario ${SUPER_ADMIN_EMAIL} no encontrado`)
    }

    // 3. Mostrar resumen final
    const rolesCounts = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    })

    console.log("\n📊 Resumen de roles después de la migración:")
    rolesCounts.forEach(({ role, _count }) => {
      console.log(`   ${role}: ${_count} usuarios`)
    })

    console.log("\n✅ Migración completada exitosamente!")
  } catch (error) {
    console.error("❌ Error en la migración:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateRoles()
