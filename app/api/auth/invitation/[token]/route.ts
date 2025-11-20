import { NextResponse } from "next/server"
import {
  validateInvitationToken,
  completeInvitationRegistration,
} from "@/lib/email/invitation-service"
import { z } from "zod"

export const dynamic = "force-dynamic"

/**
 * GET /api/auth/invitation/[token]
 * Validar token de invitación y retornar datos
 */
export async function GET(request: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ success: false, error: "Token no proporcionado" }, { status: 400 })
    }

    const validation = await validateInvitationToken(token)

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || "Invitación inválida" },
        { status: 400 }
      )
    }

    // Retornar datos de la invitación (sin información sensible)
    return NextResponse.json({
      success: true,
      data: {
        email: validation.invitation!.email,
        role: validation.invitation!.role,
        expiresAt: validation.invitation!.expiresAt,
      },
    })
  } catch (error: any) {
    console.error("❌ Error validating invitation token:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al validar invitación",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

const registrationSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

/**
 * POST /api/auth/invitation/[token]
 * Completar registro desde invitación
 */
export async function POST(request: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ success: false, error: "Token no proporcionado" }, { status: 400 })
    }

    // Parsear y validar body
    const body = await request.json()
    const validation = registrationSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join(".")}: ${err.message}`)
      return NextResponse.json(
        { success: false, error: `Error de validación: ${errors.join(", ")}` },
        { status: 400 }
      )
    }

    const { name, lastName, password } = validation.data

    // Completar registro
    const user = await completeInvitationRegistration(token, {
      name: name.trim(),
      lastName: lastName.trim(),
      password,
    })

    return NextResponse.json({
      success: true,
      message: "Registro completado exitosamente",
      data: {
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error("❌ Error completing registration:", error)

    // Manejo de errores específicos
    if (error.message?.includes("Invitación")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    if (error.message?.includes("ya está registrado")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Error al completar registro",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
