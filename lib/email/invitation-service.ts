import { getPrismaClient } from "@/lib/db-helpers"
import { resend, FROM_EMAIL } from "./resend-client"
import crypto from "crypto"

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

  // 7. Enviar correo electrónico
  const roleNames = {
    limitado: "Usuario Limitado",
    admin: "Administrador",
    superadmin: "Super Administrador",
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: input.email,
      subject: "Invitación al Sistema de Importaciones",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #f7fafc;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .button {
                display: inline-block;
                background: #4299e1;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: bold;
              }
              .info-box {
                background: white;
                padding: 15px;
                border-left: 4px solid #4299e1;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                color: #718096;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Sistema de Importaciones</h1>
                <p style="margin: 10px 0 0 0;">Has sido invitado a unirte</p>
              </div>
              
              <div class="content">
                <h2>¡Hola!</h2>
                <p>${input.invitedBy} te ha invitado a unirte al Sistema de Importaciones.</p>
                
                <div class="info-box">
                  <p style="margin: 0;"><strong>Rol asignado:</strong> ${roleNames[input.role]}</p>
                  <p style="margin: 10px 0 0 0;"><strong>Email:</strong> ${input.email}</p>
                </div>

                <p>Para completar tu registro, haz clic en el siguiente botón:</p>

                <div style="text-align: center;">
                  <a href="${invitationUrl}" class="button">
                    Completar Registro
                  </a>
                </div>

                <p style="color: #718096; font-size: 14px;">
                  O copia y pega este enlace en tu navegador:<br>
                  <a href="${invitationUrl}" style="color: #4299e1;">${invitationUrl}</a>
                </p>

                <p style="color: #e53e3e; font-size: 14px; margin-top: 30px;">
                  ⚠️ Esta invitación expira en 7 días.
                </p>
              </div>

              <div class="footer">
                <p>Este es un correo automático, por favor no responder.</p>
                <p>Sistema de Importaciones - Curet Core</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log(`✅ Invitation email sent successfully to ${input.email}`)
  } catch (error) {
    console.error("❌ Error sending invitation email:", error)
    // Eliminar la invitación si el correo falla
    await db.userInvitation.delete({
      where: { id: invitation.id },
    })
    throw new Error("Error al enviar el correo de invitación. Por favor intenta nuevamente.")
  }

  return invitation
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
