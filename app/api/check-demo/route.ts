import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    // Verificar si existe el usuario demo
    let demoUser = await prisma.user.findUnique({
      where: { email: "demo@sistema.com" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activo: true,
      },
    })

    if (!demoUser) {
      // Crear usuario demo si no existe
      const hashedPassword = await bcrypt.hash("Demo123!", 10)
      demoUser = await prisma.user.create({
        data: {
          name: "Usuario Demo",
          email: "demo@sistema.com",
          password: hashedPassword,
          role: "admin",
          activo: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          activo: true,
        },
      })

      return NextResponse.json({
        success: true,
        created: true,
        message: "Usuario demo creado",
        user: demoUser,
      })
    }

    return NextResponse.json({
      success: true,
      created: false,
      message: "Usuario demo ya existe",
      user: demoUser,
    })
  } catch (error) {
    console.error("Error verificando usuario demo:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}
