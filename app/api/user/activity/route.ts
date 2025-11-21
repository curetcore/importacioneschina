import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { triggerPusherEvent } from "@/lib/pusher-server"
import { z } from "zod"

// Force dynamic rendering
export const dynamic = "force-dynamic"

// Validation schema for activity updates
const activitySchema = z.object({
  page: z.string(),
  pageName: z.string(),
  pageIcon: z.string(),
  pageColor: z.string().optional(),
  timestamp: z.number(),
  action: z.string().optional(), // Fase 6: "Viendo", "Editando", "Creando", "En"
  entityName: z.string().optional(), // Fase 4: Nombre de entidad específica: "OC-2024-001"
})

/**
 * POST /api/user/activity
 * Broadcast user activity changes to all connected users via Pusher
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate activity data
    const validation = activitySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid activity data",
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const activity = validation.data

    // Broadcast activity update to presence channel
    try {
      await triggerPusherEvent("presence-online-users", "activity-updated", {
        userId: session.user.id,
        activity,
      })

      console.log(
        `✅ [Activity Broadcast] User ${session.user.id} activity updated: ${activity.pageIcon} ${activity.pageName}`
      )

      return NextResponse.json({
        success: true,
        message: "Activity broadcasted successfully",
      })
    } catch (pusherError) {
      console.error("❌ [Activity Broadcast] Pusher error:", pusherError)
      // Don't fail the request if Pusher fails - this is not critical
      return NextResponse.json({
        success: true,
        warning: "Activity update failed to broadcast",
      })
    }
  } catch (error) {
    console.error("❌ [Activity API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to broadcast activity",
      },
      { status: 500 }
    )
  }
}
