import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

// Rate limiting simple en memoria (Problema #10)
// Para producción, considerar usar Redis o similar
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const attempt = loginAttempts.get(email)

  // Limpiar intentos expirados
  if (attempt && now > attempt.resetAt) {
    loginAttempts.delete(email)
    return true
  }

  // Si no hay intentos previos o están expirados, permitir
  if (!attempt) {
    loginAttempts.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 }) // 15 minutos
    return true
  }

  // Incrementar contador
  attempt.count++

  // Máximo 5 intentos en 15 minutos
  if (attempt.count > 5) {
    const minutesLeft = Math.ceil((attempt.resetAt - now) / 60000)
    console.warn(`⚠️ Rate limit exceeded for ${email}. Try again in ${minutesLeft} minutes.`)
    return false
  }

  return true
}

function resetRateLimit(email: string): void {
  loginAttempts.delete(email)
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos")
        }

        // SEGURIDAD: Verificar rate limit (Problema #10)
        if (!checkRateLimit(credentials.email)) {
          throw new Error("Demasiados intentos fallidos. Intenta nuevamente en 15 minutos.")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        // SEGURIDAD: Usar mensaje genérico para evitar enumeración de usuarios
        if (!user || !user.activo) {
          throw new Error("Credenciales incorrectas")
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)

        if (!passwordMatch) {
          throw new Error("Credenciales incorrectas")
        }

        // Login exitoso: resetear contador de intentos
        resetRateLimit(credentials.email)

        // Actualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          lastName: user.lastName,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.lastName = user.lastName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.lastName = token.lastName as string | null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  // SEGURIDAD: NEXTAUTH_SECRET debe estar configurado en producción
  // La variable de entorno debe pasarse durante el build
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production",
}
