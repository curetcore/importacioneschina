import { Resend } from "resend"

let resendInstance: Resend | null = null

/**
 * Get Resend client instance (lazy initialization)
 * Only validates RESEND_API_KEY when actually needed
 */
function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY

    // Durante build, permitir placeholder o valor por defecto
    if (!apiKey || apiKey === "placeholder_for_build") {
      // En build time, crear instancia dummy que no se usará
      if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
        // Durante el build de Next.js, usar un placeholder
        resendInstance = new Resend("re_placeholder_" + "x".repeat(20))
      } else {
        throw new Error("RESEND_API_KEY is not defined in environment variables")
      }
    } else {
      resendInstance = new Resend(apiKey)
    }
  }
  return resendInstance
}

export const resend = new Proxy({} as Resend, {
  get: (target, prop) => {
    const client = getResendClient()
    const value = client[prop as keyof Resend]
    return typeof value === "function" ? value.bind(client) : value
  },
})

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@curetcore.com"
