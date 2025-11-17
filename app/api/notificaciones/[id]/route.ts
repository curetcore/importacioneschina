import { NextRequest, NextResponse } from "next/server"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { markNotificationAsRead } from "@/lib/notification-service"

// PUT /api/notificaciones/[id] - Marcar notificación como leída
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
