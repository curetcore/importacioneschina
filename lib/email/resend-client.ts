import { Resend } from "resend"

let resendInstance: Resend | null = null

/**
 * Get Resend client instance (lazy initialization)
 * Only validates RESEND_API_KEY when actually needed
 */
function getResendClient(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not defined in environment variables")
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY)
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
