import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function fixPasswords() {
  console.log("🔧 Fixing user passwords...")

  try {
    // Update Leticia's password
    const leticiaPassword = await bcrypt.hash("curetshop2017", 10)
    await prisma.user.update({
      where: { email: "lety.paulino@gmail.com" },
      data: { password: leticiaPassword },
    })
    console.log(`✅ Updated password for Leticia`)
    console.log(`   Hash length: ${leticiaPassword.length}`)
    console.log(`   Hash start: ${leticiaPassword.substring(0, 15)}`)

    // Update Ronaldo's password
    const ronaldoPassword = await bcrypt.hash("Pitagora1844", 10)
    await prisma.user.update({
      where: { email: "info@curetshop.com" },
      data: { password: ronaldoPassword },
    })
    console.log(`✅ Updated password for Ronaldo`)
    console.log(`   Hash length: ${ronaldoPassword.length}`)
    console.log(`   Hash start: ${ronaldoPassword.substring(0, 15)}`)

    // Verify
    const users = await prisma.user.findMany({
      where: {
        email: { in: ["lety.paulino@gmail.com", "info@curetshop.com"] },
      },
      select: {
        email: true,
        name: true,
        role: true,
        password: true,
      },
    })

    console.log("\n✨ Verification:")
    users.forEach(user => {
      console.log(`   ${user.name} (${user.email}):`)
      console.log(`     Role: ${user.role}`)
      console.log(`     Password length: ${user.password?.length || 0}`)
      console.log(`     Password start: ${user.password?.substring(0, 15) || "N/A"}`)
    })

    console.log("\n🔑 Users can now login with:")
    console.log("   lety.paulino@gmail.com / curetshop2017")
    console.log("   info@curetshop.com / Pitagora1844")
  } catch (error) {
    console.error("❌ Error fixing passwords:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixPasswords()
