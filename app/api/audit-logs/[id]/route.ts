import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { handleApiError } from "@/lib/api-error-handler"

export const dynamic = "force-dynamic"

// GET /api/audit-logs/[id] - Obtener un audit log específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const db = await getPrismaClient()

    const auditLog = await db.auditLog.findUnique({
      where: { id },
    })

    if (!auditLog) {
      return NextResponse.json(
        {
          success: false,
          error: "Audit log no encontrado",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: auditLog,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
