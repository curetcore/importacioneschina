import { NextResponse } from "next/server"
import { prisma, prismaDemo } from "@/lib/prisma"

export async function GET() {
  const timestamp = new Date().toISOString()
  const results = {
    production: { status: "unknown" as "connected" | "disconnected" | "unknown", error: null as string | null },
    demo: { status: "unknown" as "connected" | "disconnected" | "unknown", error: null as string | null },
  }

  // Verificar base de datos de producción
  try {
    await prisma.$queryRaw`SELECT 1`
    results.production.status = "connected"
  } catch (error) {
    results.production.status = "disconnected"
    results.production.error = error instanceof Error ? error.message : "Unknown error"
  }

  // Verificar base de datos demo
  try {
    await prismaDemo.$queryRaw`SELECT 1`
    results.demo.status = "connected"
  } catch (error) {
    results.demo.status = "disconnected"
    results.demo.error = error instanceof Error ? error.message : "Unknown error"
  }

  // Determinar estado general
  const isHealthy = results.production.status === "connected" && results.demo.status === "connected"
  const status = isHealthy ? "healthy" : "degraded"

  return NextResponse.json(
    {
      status,
      timestamp,
      databases: {
        production: results.production,
        demo: results.demo,
      },
    },
    { status: isHealthy ? 200 : 503 }
  )
}
