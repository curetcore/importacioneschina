import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { handleApiError } from "@/lib/api-error-handler"

export const dynamic = "force-dynamic"

// GET /api/audit-logs - Obtener logs de auditoría
export async function GET(request: NextRequest) {
  try {
    const db = await getPrismaClient()
    const { searchParams } = new URL(request.url)

    // Parámetros de consulta
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const entidad = searchParams.get("entidad") || undefined
    const accion = searchParams.get("accion") || undefined
    const usuarioEmail = searchParams.get("usuarioEmail") || undefined

    const where = {
      ...(entidad && { entidad }),
      ...(accion && { accion }),
      ...(usuarioEmail && { usuarioEmail }),
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: Math.min(limit, 100), // Máximo 100
        skip: offset,
      }),
      db.auditLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: logs,
      total,
      limit,
      offset,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
