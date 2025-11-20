import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkDemoUser() {
  try {
    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@sistema.com" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activo: true,
      },
    })

    if (demoUser) {
      console.log("✅ Usuario demo encontrado:")
      console.log(JSON.stringify(demoUser, null, 2))
    } else {
      console.log("❌ Usuario demo NO encontrado en la base de datos")
      console.log("💡 Necesitas ejecutar: npm run setup:demo")
    }
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDemoUser()
