import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const timestamp = new Date().toISOString()
  const dbStatus = {
    status: "unknown" as "connected" | "disconnected" | "unknown",
    error: null as string | null,
  }

  // Verificar base de datos
  try {
    await prisma.$queryRaw`SELECT 1`
    dbStatus.status = "connected"
  } catch (error) {
    dbStatus.status = "disconnected"
    dbStatus.error = error instanceof Error ? error.message : "Unknown error"
  }

  // Determinar estado general
  const isHealthy = dbStatus.status === "connected"
  const status = isHealthy ? "healthy" : "degraded"

  return NextResponse.json(
    {
      status,
      timestamp,
      database: dbStatus,
    },
    { status: isHealthy ? 200 : 503 }
  )
}
