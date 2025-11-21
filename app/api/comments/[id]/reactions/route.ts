import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { triggerPusherEvent } from "@/lib/pusher-server"
import { createNotification, getEntityUrl } from "@/lib/notification-service"
import { z } from "zod"

// Force dynamic rendering
export const dynamic = "force-dynamic"

// Validation schema
const reactionSchema = z.object({
  emoji: z.string().min(1, "Emoji is required").max(10, "Invalid emoji"),
})

/**
 * POST /api/comments/[id]/reactions
 * Add or toggle a reaction to a comment
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const commentId = params.id

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, entityType: true, entityId: true, userId: true, content: true },
    })

    if (!comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    const body = await request.json()

    // Validate input
    const validation = reactionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { emoji } = validation.data

    // Check if user already reacted with this emoji
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId: session.user.id,
          emoji,
        },
      },
    })

    if (existingReaction) {
      // Toggle: Remove the reaction
      await prisma.reaction.delete({
        where: { id: existingReaction.id },
      })

      // Get updated reactions count
      const reactions = await prisma.reaction.groupBy({
        by: ["emoji"],
        where: { commentId },
        _count: { emoji: true },
      })

      const reactionsSummary = reactions.map(r => ({
        emoji: r.emoji,
        count: r._count.emoji,
      }))

      // Trigger Pusher event for real-time updates
      try {
        const channelName = `comments-${comment.entityType}-${comment.entityId}`
        await triggerPusherEvent(channelName, "reaction-removed", {
          commentId,
          emoji,
          userId: session.user.id,
          reactions: reactionsSummary,
        })
        console.log(`✅ [Reactions] Removed reaction ${emoji} from comment ${commentId}`)
      } catch (pusherError) {
        console.error("⚠️ [Reactions] Pusher event failed:", pusherError)
      }

      return NextResponse.json({
        success: true,
        action: "removed",
        data: { emoji, reactions: reactionsSummary },
      })
    } else {
      // Add new reaction
      const reaction = await prisma.reaction.create({
        data: {
          commentId,
          userId: session.user.id,
          emoji,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              lastName: true,
              profilePhoto: true,
            },
          },
        },
      })

      // Create notification for comment author (if not reacting to own comment)
      if (comment.userId !== session.user.id) {
        try {
          const userName = `${reaction.user.name}${reaction.user.lastName ? ` ${reaction.user.lastName}` : ""}`
          await createNotification({
            tipo: "success",
            titulo: `${userName} reaccionó ${emoji} a tu comentario`,
            descripcion: comment.content.slice(0, 200),
            icono: "Heart",
            entidad: comment.entityType,
            entidadId: comment.entityId,
            url: `${getEntityUrl(comment.entityType, comment.entityId)}#comment-${commentId}`,
            usuarioId: comment.userId,
            actorId: session.user.id, // Usuario que reaccionó
            prioridad: "low",
          })
          console.log(`✅ [Reactions] Created notification for comment author: ${comment.userId}`)
        } catch (notifError) {
          console.error("⚠️ [Reactions] Failed to create reaction notification:", notifError)
        }
      }

      // Get updated reactions count
      const reactions = await prisma.reaction.groupBy({
        by: ["emoji"],
        where: { commentId },
        _count: { emoji: true },
      })

      const reactionsSummary = reactions.map(r => ({
        emoji: r.emoji,
        count: r._count.emoji,
      }))

      // Trigger Pusher event for real-time updates
      try {
        const channelName = `comments-${comment.entityType}-${comment.entityId}`
        await triggerPusherEvent(channelName, "reaction-added", {
          commentId,
          emoji,
          userId: session.user.id,
          userName: `${reaction.user.name}${reaction.user.lastName ? ` ${reaction.user.lastName}` : ""}`,
          reactions: reactionsSummary,
        })
        console.log(`✅ [Reactions] Added reaction ${emoji} to comment ${commentId}`)
      } catch (pusherError) {
        console.error("⚠️ [Reactions] Pusher event failed:", pusherError)
      }

      return NextResponse.json({
        success: true,
        action: "added",
        data: { emoji, reactions: reactionsSummary },
      })
    }
  } catch (error) {
    console.error("❌ [Reactions API POST] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add/remove reaction",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/comments/[id]/reactions
 * Get all reactions for a comment with user details
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const commentId = params.id

    // Get all reactions with user details
    const reactions = await prisma.reaction.findMany({
      where: { commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    // Group by emoji with user details
    const groupedReactions = reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: [],
            userReacted: false,
          }
        }
        acc[reaction.emoji].count++
        acc[reaction.emoji].users.push({
          id: reaction.user.id,
          name: reaction.user.name,
          lastName: reaction.user.lastName,
          profilePhoto: reaction.user.profilePhoto,
        })
        if (reaction.user.id === session.user.id) {
          acc[reaction.emoji].userReacted = true
        }
        return acc
      },
      {} as Record<
        string,
        {
          emoji: string
          count: number
          users: Array<{
            id: string
            name: string
            lastName: string | null
            profilePhoto: string | null
          }>
          userReacted: boolean
        }
      >
    )

    return NextResponse.json({
      success: true,
      data: Object.values(groupedReactions),
    })
  } catch (error) {
    console.error("❌ [Reactions API GET] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch reactions",
      },
      { status: 500 }
    )
  }
}
