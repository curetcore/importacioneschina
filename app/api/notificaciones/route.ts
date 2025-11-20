import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { handleApiError } from "@/lib/api-error-handler"
import { markAllNotificationsAsRead } from "@/lib/notification-service"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

// GET /api/notificaciones - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    // Rate limiting para queries - 60 req/60s
    const rateLimitError = await withRateLimit(request, RateLimits.query)
    if (rateLimitError) return rateLimitError

    const db = await getPrismaClient()
    const { searchParams } = new URL(request.url)

    // Parámetros de consulta
    const limit = parseInt(searchParams.get("limit") || "20")
    const onlyUnread = searchParams.get("unread") === "true"
    const usuarioId = searchParams.get("usuarioId") || undefined

    const where = {
      ...(onlyUnread && { leida: false }),
      ...(usuarioId && { usuarioId }),
    }

    const [notificaciones, totalUnread] = await Promise.all([
      db.notificacion.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: Math.min(limit, 50), // Máximo 50
      }),
      db.notificacion.count({
        where: {
          leida: false,
          ...(usuarioId && { usuarioId }),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      notifications: notificaciones, // Cambio: data → notifications
      unreadCount: totalUnread, // Cambio: totalUnread → unreadCount
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/notificaciones - Marcar todas como leídas
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting para mutations - 20 req/10s
    const rateLimitError = await withRateLimit(request, RateLimits.mutation)
    if (rateLimitError) return rateLimitError

    const body = await request.json()
    const { usuarioId } = body

    await markAllNotificationsAsRead(usuarioId)

    return NextResponse.json({
      success: true,
      message: "Todas las notificaciones marcadas como leídas",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
