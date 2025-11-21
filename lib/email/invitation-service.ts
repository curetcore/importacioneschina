import { getPrismaClient } from "@/lib/db-helpers"
// import { resend, FROM_EMAIL } from "./resend-client" // REMOVED: Migrating to AWS SES
import crypto from "crypto"

// Temporary FROM_EMAIL until AWS SES is implemented
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@curetcore.com"

export interface SendInvitationInput {
  email: string
  role: "limitado" | "admin" | "superadmin"
  invitedBy: string
}

/**
 * Crear y enviar una invitación de usuario
 */
export async function sendUserInvitation(input: SendInvitationInput) {
  const db = await getPrismaClient()

  // 1. Verificar que el email no esté ya registrado
  const existingUser = await db.user.findUnique({
    where: { email: input.email },
  })

  if (existingUser) {
    throw new Error(`El usuario con email ${input.email} ya existe`)
  }

  // 2. Verificar si ya existe una invitación pendiente no expirada
  const existingInvitation = await db.userInvitation.findFirst({
    where: {
      email: input.email,
      accepted: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  })

  if (existingInvitation) {
    throw new Error(`Ya existe una invitación pendiente para ${input.email}`)
  }

  // 3. Generar token seguro
  const token = crypto.randomBytes(32).toString("hex")

  // 4. Calcular fecha de expiración (7 días)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // 5. Crear la invitación en la base de datos
  const invitation = await db.userInvitation.create({
    data: {
      email: input.email,
      role: input.role,
      token,
      expiresAt,
      invitedBy: input.invitedBy,
    },
  })

  // 6. Generar URL de invitación
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const invitationUrl = `${baseUrl}/auth/invitation/${token}`

  // 7. Email temporalmente deshabilitado - Preparando migración a AWS SES
  console.log("⚠️ [Invitation] Email sending temporarily disabled - Awaiting AWS SES migration")
  console.log("📧 [Invitation] Invitation created successfully in database")
  console.log("📧 [Invitation] Invitation URL:", invitationUrl)
  console.log("📧 [Invitation] Token:", token)
  console.log("💡 [Invitation] Admin can copy the URL and share manually via WhatsApp/Slack")

  // TODO: Implementar AWS SES aquí cuando esté listo
  // const roleNames = {
  //   limitado: "Usuario Limitado",
  //   admin: "Administrador",
  //   superadmin: "Super Administrador",
  // }
  //
  // import { sendEmailWithSES } from "@/lib/aws/ses-service"
  // await sendEmailWithSES({
  //   from: FROM_EMAIL,
  //   to: input.email,
  //   subject: "Invitación al Sistema de Importaciones",
  //   html: `...template HTML aquí...`
  // })

  return {
    invitation,
    invitationUrl,
  }
}

/**
 * Validar un token de invitación
 */
export async function validateInvitationToken(token: string) {
  const db = await getPrismaClient()

  const invitation = await db.userInvitation.findUnique({
    where: { token },
  })

  if (!invitation) {
    return { valid: false, error: "Invitación no encontrada" }
  }

  if (invitation.accepted) {
    return { valid: false, error: "Esta invitación ya ha sido utilizada" }
  }

  if (invitation.expiresAt < new Date()) {
    return { valid: false, error: "Esta invitación ha expirado" }
  }

  // Verificar que el email no esté ya registrado
  const existingUser = await db.user.findUnique({
    where: { email: invitation.email },
  })

  if (existingUser) {
    return { valid: false, error: "Este email ya está registrado en el sistema" }
  }

  return { valid: true, invitation }
}

/**
 * Completar registro desde invitación
 */
export async function completeInvitationRegistration(
  token: string,
  userData: {
    name: string
    lastName: string
    password: string
  }
) {
  const db = await getPrismaClient()

  // Validar token
  const validation = await validateInvitationToken(token)
  if (!validation.valid || !validation.invitation) {
    throw new Error(validation.error || "Invitación inválida")
  }

  const invitation = validation.invitation

  // Hash de contraseña
  const bcrypt = await import("bcryptjs")
  const hashedPassword = await bcrypt.hash(userData.password, 10)

  // Crear usuario y marcar invitación como aceptada en transacción
  const user = await db.$transaction(async tx => {
    // Crear usuario
    const newUser = await tx.user.create({
      data: {
        email: invitation.email,
        name: userData.name,
        lastName: userData.lastName,
        password: hashedPassword,
        role: invitation.role,
        activo: true,
      },
    })

    // Marcar invitación como aceptada
    await tx.userInvitation.update({
      where: { id: invitation.id },
      data: { accepted: true },
    })

    return newUser
  })

  console.log(`✅ User registered successfully from invitation: ${user.email}`)

  return user
}
