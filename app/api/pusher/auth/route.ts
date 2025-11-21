import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import Pusher from "pusher"

// Force dynamic rendering
export const dynamic = "force-dynamic"

// Initialize Pusher (server-side only)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

/**
 * POST /api/pusher/auth
 * Endpoint para autenticar canales privados y de presencia de Pusher
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get Pusher auth data from request body
    const body = await request.text()
    const params = new URLSearchParams(body)
    const socketId = params.get("socket_id")
    const channelName = params.get("channel_name")

    if (!socketId || !channelName) {
      return NextResponse.json(
        { success: false, error: "Missing socket_id or channel_name" },
        { status: 400 }
      )
    }

    // Presence channel authentication
    if (channelName.startsWith("presence-")) {
      // CRITICAL: Verify user.id exists (user needs to re-login after auth-options update)
      if (!session.user.id) {
        console.error(
          "❌ [Pusher Auth] Missing user.id in session. User needs to logout and login again!"
        )
        return NextResponse.json(
          {
            success: false,
            error: "User session missing ID. Please logout and login again.",
          },
          { status: 401 }
        )
      }

      const presenceData = {
        user_id: session.user.id,
        user_info: {
          id: session.user.id,
          name: session.user.name || "",
          lastName: (session.user as any).lastName || "",
          email: session.user.email || "",
        },
      }

      const auth = pusher.authorizeChannel(socketId, channelName, presenceData)

      return NextResponse.json(auth)
    }

    // Private channel authentication
    if (channelName.startsWith("private-")) {
      const auth = pusher.authorizeChannel(socketId, channelName)

      return NextResponse.json(auth)
    }

    // Public channels don't need authentication
    return NextResponse.json(
      { success: false, error: "Channel does not require authentication" },
      { status: 400 }
    )
  } catch (error) {
    console.error("❌ [Pusher Auth] Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      },
      { status: 500 }
    )
  }
}
