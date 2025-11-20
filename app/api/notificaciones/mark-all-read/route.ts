import { NextRequest, NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-error-handler"
import { markAllNotificationsAsRead } from "@/lib/notification-service"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

// POST /api/notificaciones/mark-all-read - Marcar todas como leídas
export async function POST(request: NextRequest) {
  try {
    // Rate limiting para mutations - 20 req/10s
    const rateLimitError = await withRateLimit(request, RateLimits.mutation)
    if (rateLimitError) return rateLimitError

    // Marcar todas como leídas (sin filtro de usuario por ahora)
    await markAllNotificationsAsRead()

    return NextResponse.json({
      success: true,
      message: "Todas las notificaciones marcadas como leídas",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
