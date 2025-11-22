import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { markNotificationAsRead } from "@/lib/notification-service"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

// PUT /api/notificaciones/[id] - Marcar notificación como leída
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    // Rate limiting para mutations - 20 req/10s
    const rateLimitError = await withRateLimit(request, RateLimits.mutation)
    if (rateLimitError) return rateLimitError

    const { id } = params

    await markNotificationAsRead(id)

    return NextResponse.json({
      success: true,
      message: "Notificación marcada como leída",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
