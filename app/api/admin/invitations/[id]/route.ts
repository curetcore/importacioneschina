import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getPrismaClient } from "@/lib/db-helpers"

export const dynamic = "force-dynamic"

/**
 * DELETE /api/admin/invitations/[id]
 * Cancelar una invitación pendiente (solo super admin)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Validar autenticación
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }

    // Validar que sea super admin
    if (session.user.role !== "superadmin") {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado. Solo super admin puede cancelar invitaciones.",
        },
        { status: 403 }
      )
    }

    const { id } = params
    const db = await getPrismaClient()

    // Verificar que la invitación existe
    const invitation = await db.userInvitation.findUnique({
      where: { id },
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invitación no encontrada" },
        { status: 404 }
      )
    }

    // Verificar que no ha sido aceptada
    if (invitation.accepted) {
      return NextResponse.json(
        {
          success: false,
          error: "No se puede cancelar una invitación que ya ha sido aceptada",
        },
        { status: 400 }
      )
    }

    // Eliminar la invitación
    await db.userInvitation.delete({
      where: { id },
    })

    console.log(`✅ Invitation cancelled: ${invitation.email} by ${session.user.email}`)

    return NextResponse.json({
      success: true,
      message: `Invitación a ${invitation.email} cancelada exitosamente`,
    })
  } catch (error: any) {
    console.error("❌ Error cancelling invitation:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al cancelar invitación",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
