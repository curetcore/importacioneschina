import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getPrismaClient } from "@/lib/db-helpers"
import { logAudit, AuditAction } from "@/lib/audit-logger"

/**
 * PATCH /api/user/profile
 * Actualizar perfil del usuario actual (nombre, apellido)
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }

    const prisma = await getPrismaClient()
    const body = await request.json()
    const { name, lastName } = body

    // Validaciones
    if (!name || name.trim() === "") {
      return NextResponse.json({ success: false, error: "El nombre es requerido" }, { status: 400 })
    }

    // Obtener usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name.trim(),
        lastName: lastName?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
      },
    })

    // Audit log
    await logAudit({
      entidad: "User",
      entidadId: updatedUser.id,
      accion: AuditAction.UPDATE,
      descripcion: "Actualizó su perfil",
      usuarioEmail: session.user.email,
      cambiosAntes: {
        name: currentUser.name,
        lastName: currentUser.lastName,
      },
      cambiosDespues: {
        name: updatedUser.name,
        lastName: updatedUser.lastName,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Perfil actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json(
      { success: false, error: "Error al actualizar perfil" },
      { status: 500 }
    )
  }
}
