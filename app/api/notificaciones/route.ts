import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getPrismaClient } from "@/lib/db-helpers"
import { handleApiError } from "@/lib/api-error-handler"
import { markAllNotificationsAsRead } from "@/lib/notification-service"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

// GET /api/notificaciones - Obtener notificaciones del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    // Rate limiting para queries - 60 req/60s
    const rateLimitError = await withRateLimit(request, RateLimits.query)
    if (rateLimitError) return rateLimitError

    const db = await getPrismaClient()
    const { searchParams } = new URL(request.url)

    // Parámetros de consulta
    const limit = parseInt(searchParams.get("limit") || "20")
    const onlyUnread = searchParams.get("unread") === "true"

    // Obtener el rol del usuario
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    const isSuperAdmin = user?.role === "superadmin"

    // IMPORTANTE:
    // - Superadmin ve TODAS las notificaciones (globales + propias)
    // - Otros usuarios solo ven sus notificaciones específicas
    const where = isSuperAdmin
      ? {
          // Superadmin: todas las notificaciones globales (sin usuarioId) + propias
          OR: [{ usuarioId: null }, { usuarioId: session.user.id }],
          ...(onlyUnread && { leida: false }),
        }
      : {
          // Usuarios normales: solo sus notificaciones
          usuarioId: session.user.id,
          ...(onlyUnread && { leida: false }),
        }

    const [notificaciones, totalUnread] = await Promise.all([
      db.notificacion.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: Math.min(limit, 50), // Máximo 50
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              lastName: true,
              profilePhoto: true,
            },
          },
        },
      }),
      db.notificacion.count({
        where: isSuperAdmin
          ? {
              OR: [{ usuarioId: null }, { usuarioId: session.user.id }],
              leida: false,
            }
          : {
              usuarioId: session.user.id,
              leida: false,
            },
      }),
    ])

    return NextResponse.json({
      success: true,
      notifications: notificaciones,
      unreadCount: totalUnread,
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
