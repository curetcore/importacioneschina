import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { sendUserInvitation } from "@/lib/email/invitation-service"
import { z } from "zod"

export const dynamic = "force-dynamic"

// Rate limiting simple en memoria
const invitationAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const attempt = invitationAttempts.get(email)

  // Limpiar intentos expirados
  if (attempt && now > attempt.resetAt) {
    invitationAttempts.delete(email)
    return true
  }

  // Si no hay intentos previos o están expirados, permitir
  if (!attempt) {
    invitationAttempts.set(email, { count: 1, resetAt: now + 60 * 60 * 1000 }) // 60 minutos
    return true
  }

  // Incrementar contador
  attempt.count++

  // Máximo 5 invitaciones por hora
  if (attempt.count > 5) {
    const minutesLeft = Math.ceil((attempt.resetAt - now) / 60000)
    console.warn(
      `⚠️ Rate limit exceeded for invitations by ${email}. Try again in ${minutesLeft} minutes.`
    )
    return false
  }

  return true
}

const invitationSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["limitado", "admin", "superadmin"], {
    errorMap: () => ({ message: "Rol inválido. Debe ser: limitado, admin o superadmin" }),
  }),
})

/**
 * POST /api/admin/invitations
 * Enviar invitación de usuario (solo super admin)
 */
export async function POST(request: Request) {
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
          error: "No autorizado. Solo super admin puede enviar invitaciones.",
        },
        { status: 403 }
      )
    }

    // Rate limiting
    if (!checkRateLimit(session.user.email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Demasiadas invitaciones enviadas. Intenta nuevamente en 1 hora.",
        },
        { status: 429 }
      )
    }

    // Parsear y validar body
    const body = await request.json()
    const validation = invitationSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(", ")
      return NextResponse.json(
        { success: false, error: `Error de validación: ${errors}` },
        { status: 400 }
      )
    }

    const { email, role } = validation.data

    // Enviar invitación
    const invitation = await sendUserInvitation({
      email: email.toLowerCase().trim(),
      role,
      invitedBy: session.user.email,
    })

    return NextResponse.json({
      success: true,
      message: `Invitación enviada exitosamente a ${email}`,
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (error: any) {
    console.error("❌ Error sending invitation:", error)

    // Manejo de errores específicos
    if (error.message?.includes("ya existe")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }

    if (error.message?.includes("invitación pendiente")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Error al enviar invitación",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
