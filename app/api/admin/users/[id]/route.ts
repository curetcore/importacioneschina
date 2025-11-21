import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getPrismaClient } from "@/lib/db-helpers"
import { logAudit, AuditAction } from "@/lib/audit-logger"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

const SUPER_ADMIN_EMAIL = "info@curetshop.com"

/**
 * PATCH /api/admin/users/[id]
 * Actualizar usuario (solo super admin)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const prisma = await getPrismaClient()
    const body = await request.json()
    const { name, lastName, role, newPassword } = body

    // Validaciones
    if (!name || name.trim() === "") {
      return NextResponse.json({ success: false, error: "El nombre es requerido" }, { status: 400 })
    }

    // Obtener usuario actual
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    // Preparar datos de actualización
    const updateData: any = {
      name: name.trim(),
      lastName: lastName?.trim() || null,
    }

    // Si se proporciona rol, actualizarlo
    if (role && ["admin", "user"].includes(role)) {
      updateData.role = role
    }

    // Si se proporciona nueva contraseña, hashearla
    if (newPassword && newPassword.length >= 8) {
      updateData.password = await bcrypt.hash(newPassword, 10)
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Audit log
    await logAudit({
      entidad: "User",
      entidadId: updatedUser.id,
      accion: AuditAction.UPDATE,
      descripcion: `Super admin actualizó usuario ${currentUser.email}`,
      usuarioEmail: session.user.email,
      cambiosAntes: {
        name: currentUser.name,
        lastName: currentUser.lastName,
        role: currentUser.role,
      },
      cambiosDespues: {
        name: updatedUser.name,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Usuario actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { success: false, error: "Error al actualizar usuario" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Eliminar usuario (solo super admin)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const prisma = await getPrismaClient()

    // Obtener usuario antes de eliminar
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    // No permitir eliminar al super admin
    if (user.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: "No se puede eliminar al super admin" },
        { status: 400 }
      )
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id: params.id },
    })

    // Audit log
    await logAudit({
      entidad: "User",
      entidadId: user.id,
      accion: AuditAction.DELETE,
      descripcion: `Super admin eliminó usuario ${user.email}`,
      usuarioEmail: session.user.email,
    })

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { success: false, error: "Error al eliminar usuario" },
      { status: 500 }
    )
  }
}
