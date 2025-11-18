import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getPrismaClient } from "@/lib/db-helpers"
import { logAudit, AuditAction } from "@/lib/audit-logger"
import bcrypt from "bcryptjs"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

/**
 * POST /api/user/change-password
 * Cambiar contraseña del usuario actual
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }

    const prisma = await getPrismaClient()
    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validaciones
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Contraseña actual y nueva son requeridas" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "La nueva contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      )
    }

    // Obtener usuario actual
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    // Verificar contraseña actual
    const passwordMatch = await bcrypt.compare(currentPassword, user.password)

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "La contraseña actual es incorrecta" },
        { status: 400 }
      )
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Actualizar contraseña
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedPassword },
    })

    // Audit log
    await logAudit({
      entidad: "User",
      entidadId: user.id,
      accion: AuditAction.UPDATE,
      descripcion: "Cambió su contraseña",
      usuarioEmail: session.user.email,
    })

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json(
      { success: false, error: "Error al cambiar contraseña" },
      { status: 500 }
    )
  }
}
