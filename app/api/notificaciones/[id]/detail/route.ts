import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { handleApiError } from "@/lib/api-error-handler"
import { translateAuditChanges, getActionPhrase } from "@/lib/audit-translator"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

// GET /api/notificaciones/[id]/detail - Obtener detalles completos de una notificación
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limiting
    const rateLimitError = await withRateLimit(request, RateLimits.query)
    if (rateLimitError) return rateLimitError

    const db = await getPrismaClient()
    const notificationId = params.id

    // Obtener notificación con audit log relacionado
    const notificacion = await db.notificacion.findUnique({
      where: { id: notificationId },
      include: {
        auditLog: {
          include: {
            usuario: {
              select: {
                name: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!notificacion) {
      return NextResponse.json(
        {
          success: false,
          error: "Notificación no encontrada",
        },
        { status: 404 }
      )
    }

    // Si no hay audit log, devolver solo la notificación básica
    if (!notificacion.auditLog) {
      return NextResponse.json({
        success: true,
        data: {
          id: notificacion.id,
          tipo: notificacion.tipo,
          titulo: notificacion.titulo,
          descripcion: notificacion.descripcion,
          icono: notificacion.icono,
          url: notificacion.url,
          createdAt: notificacion.createdAt.toISOString(),
          auditLog: null,
        },
      })
    }

    // Traducir cambios a lenguaje natural
    const cambios = translateAuditChanges(
      notificacion.auditLog.entidad,
      notificacion.auditLog.cambiosAntes as Record<string, any> | null,
      notificacion.auditLog.cambiosDespues as Record<string, any> | null,
      notificacion.auditLog.camposModificados as string[] | undefined
    )

    // Obtener nombre del usuario
    let userName = null
    if (notificacion.auditLog.usuario) {
      userName = [notificacion.auditLog.usuario.name, notificacion.auditLog.usuario.lastName]
        .filter(Boolean)
        .join(" ")
    } else if (notificacion.auditLog.usuarioEmail) {
      userName = notificacion.auditLog.usuarioEmail
    }

    // Generar frase de acción
    const actionPhrase = getActionPhrase(
      notificacion.auditLog.accion,
      notificacion.auditLog.entidad,
      userName || undefined
    )

    return NextResponse.json({
      success: true,
      data: {
        id: notificacion.id,
        tipo: notificacion.tipo,
        titulo: notificacion.titulo,
        descripcion: notificacion.descripcion,
        icono: notificacion.icono,
        url: notificacion.url,
        createdAt: notificacion.createdAt.toISOString(),
        auditLog: {
          id: notificacion.auditLog.id,
          entidad: notificacion.auditLog.entidad,
          accion: notificacion.auditLog.accion,
          usuarioEmail: notificacion.auditLog.usuarioEmail,
          createdAt: notificacion.auditLog.createdAt.toISOString(),
          descripcion: notificacion.auditLog.descripcion,
          cambios,
          actionPhrase,
          userName,
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
