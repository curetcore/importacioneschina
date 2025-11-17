import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function createUsers() {
  console.log("👥 Creando usuarios nuevos...")

  try {
    // Usuario 1: Leticia (rol: user)
    const leticiaPassword = await bcrypt.hash("curetshop2017", 10)
    const leticia = await prisma.user.create({
      data: {
        email: "lety.paulino@gmail.com",
        name: "Leticia",
        password: leticiaPassword,
        role: "user",
        activo: true,
      },
    })
    console.log(`✅ Usuario creado: ${leticia.name} (${leticia.email}) - Rol: ${leticia.role}`)

    // Usuario 2: Ronaldo (rol: ADMIN)
    const ronaldoPassword = await bcrypt.hash("Pitagora1844", 10)
    const ronaldo = await prisma.user.create({
      data: {
        email: "info@curetshop.com",
        name: "Ronaldo",
        password: ronaldoPassword,
        role: "ADMIN",
        activo: true,
      },
    })
    console.log(`✅ Usuario creado: ${ronaldo.name} (${ronaldo.email}) - Rol: ${ronaldo.role}`)

    console.log("\n✨ Usuarios creados exitosamente!")
    console.log("\n🔑 Credenciales:")
    console.log(`   Leticia: lety.paulino@gmail.com / curetshop2017 (user)`)
    console.log(`   Ronaldo: info@curetshop.com / Pitagora1844 (ADMIN)`)
  } catch (error) {
    console.error("❌ Error creando usuarios:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createUsers()
