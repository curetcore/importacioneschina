import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getPrismaClient } from "@/lib/db-helpers"

export const dynamic = "force-dynamic"

const SUPER_ADMIN_EMAIL = "info@curetshop.com"

/**
 * GET /api/admin/users
 * Listar todos los usuarios (solo super admin)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }

    // Verificar que sea super admin
    if (session.user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Solo super admin." },
        { status: 403 }
      )
    }

    const prisma = await getPrismaClient(session.user.email)

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener usuarios" },
      { status: 500 }
    )
  }
}
