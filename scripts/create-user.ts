import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Obtener datos del usuario desde argumentos de línea de comandos
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4] || "Admin"
  const role = process.argv[5] || "admin"

  if (!email || !password) {
    console.error("❌ Uso: npm run create-user <email> <password> [name] [role]")
    console.error("   Ejemplo: npm run create-user admin@curet.com password123 'Admin Curet' admin")
    process.exit(1)
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.error(`❌ El usuario con email ${email} ya existe`)
      process.exit(1)
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        activo: true,
      },
    })

    console.log("✅ Usuario creado exitosamente:")
    console.log(`   Email: ${user.email}`)
    console.log(`   Nombre: ${user.name}`)
    console.log(`   Rol: ${user.role}`)
    console.log(`   ID: ${user.id}`)
  } catch (error) {
    console.error("❌ Error al crear usuario:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
