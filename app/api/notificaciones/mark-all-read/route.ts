import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { handleApiError } from "@/lib/api-error-handler"
import { markAllNotificationsAsRead } from "@/lib/notification-service"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

// POST /api/notificaciones/mark-all-read - Marcar todas las notificaciones del usuario como leídas
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    // Rate limiting para mutations - 20 req/10s
    const rateLimitError = await withRateLimit(request, RateLimits.mutation)
    if (rateLimitError) return rateLimitError

    // Marcar todas las notificaciones del usuario como leídas
    // Pasar el rol para que superadmin también marque las notificaciones globales
    await markAllNotificationsAsRead(session.user.id, session.user.role)

    return NextResponse.json({
      success: true,
      message: "Todas las notificaciones marcadas como leídas",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
