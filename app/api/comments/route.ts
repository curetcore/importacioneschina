import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { auditCreate } from "@/lib/audit-logger"
import { triggerPusherEvent } from "@/lib/pusher-server"
import { extractMentionedUserIds } from "@/lib/mentions"
import { createNotification, getEntityOwnerId, getEntityUrl } from "@/lib/notification-service"
import { z } from "zod"

// Force dynamic rendering
export const dynamic = "force-dynamic"

// Validation schema
const commentSchema = z.object({
  entityType: z.string().min(1, "Entity type is required"),
  entityId: z.string().min(1, "Entity ID is required"),
  content: z.string().min(1, "Comment content is required").max(5000, "Comment is too long"),
  attachments: z
    .array(
      z.object({
        url: z.string(),
        name: z.string(),
        type: z.string(),
        size: z.number(),
      })
    )
    .optional()
    .default([]),
  parentId: z.string().optional(), // For threaded replies
})

/**
 * GET /api/comments?entityType=OCChina&entityId=xxx
 * Get all comments for a specific entity
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: "entityType and entityId are required" },
        { status: 400 }
      )
    }

    // Fetch only root-level comments (no parentId) with nested replies
    const comments = await prisma.comment.findMany({
      where: {
        entityType,
        entityId,
        parentId: null, // Only root-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            profilePhoto: true,
          },
        },
        replies: {
          // Include nested replies
          include: {
            user: {
              select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
                profilePhoto: true,
              },
            },
            replies: {
              // Support 2 levels of nesting for now
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    lastName: true,
                    email: true,
                    profilePhoto: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json({ success: true, data: comments })
  } catch (error) {
    console.error("❌ [Comments API GET] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch comments",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/comments
 * Create a new comment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validation = commentSchema.safeParse(body)
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

    const { entityType, entityId, content, attachments, parentId } = validation.data

    // Extract mentioned user IDs from content
    const mentions = extractMentionedUserIds(content)

    // If parentId is provided, verify parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, entityType: true, entityId: true },
      })

      if (!parentComment) {
        return NextResponse.json(
          { success: false, error: "Parent comment not found" },
          { status: 404 }
        )
      }

      // Verify parent belongs to same entity
      if (parentComment.entityType !== entityType || parentComment.entityId !== entityId) {
        return NextResponse.json(
          { success: false, error: "Parent comment belongs to different entity" },
          { status: 400 }
        )
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        entityType,
        entityId,
        content,
        attachments: attachments || [],
        mentions: mentions,
        parentId: parentId || null, // Store parent ID for threaded replies
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            profilePhoto: true,
          },
        },
      },
    })

    // Create audit log
    await auditCreate(
      "Comment",
      {
        id: comment.id,
        entityType,
        entityId,
        content,
      },
      request,
      session.user.email || ""
    )

    // Create notifications for mentioned users
    if (mentions.length > 0) {
      try {
        const mentionNotifications = mentions
          .filter(mentionedUserId => mentionedUserId !== session.user.id) // Don't notify yourself
          .map(mentionedUserId => ({
            tipo: "mention",
            titulo: `${comment.user.name} te mencionó en un comentario`,
            descripcion: content.slice(0, 200), // First 200 chars
            icono: "💬",
            entidad: entityType,
            entidadId: entityId,
            url: `/${entityType.toLowerCase()}/${entityId}`,
            usuarioId: mentionedUserId,
            leida: false,
          }))

        if (mentionNotifications.length > 0) {
          await prisma.notificacion.createMany({
            data: mentionNotifications,
          })
          console.log(
            `✅ [Comments] Created ${mentionNotifications.length} mention notification(s)`
          )
        }
      } catch (notifError) {
        console.error("⚠️ [Comments] Failed to create mention notifications:", notifError)
      }
    }

    // Create notification for comment reply or new comment on entity
    try {
      let notifyUserId: string | null = null
      let notificationTitle = ""
      const notificationDescription = content.slice(0, 200)

      if (parentId) {
        // This is a reply - notify the parent comment author
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
          select: { userId: true },
        })

        if (parentComment && parentComment.userId !== session.user.id) {
          notifyUserId = parentComment.userId
          notificationTitle = `${comment.user.name} respondió a tu comentario`
        }
      } else {
        // This is a root comment - notify the entity owner
        const entityOwnerId = await getEntityOwnerId(entityType, entityId)

        if (entityOwnerId && entityOwnerId !== session.user.id) {
          notifyUserId = entityOwnerId
          // Entity display name helper
          const entityNames: Record<string, string> = {
            OCChina: "orden de compra",
            PagosChina: "pago",
            GastosLogisticos: "gasto logístico",
            InventarioRecibido: "inventario",
          }
          const entityDisplayName = entityNames[entityType] || "registro"
          notificationTitle = `${comment.user.name} comentó en tu ${entityDisplayName}`
        }
      }

      // Create notification if we have a recipient
      if (notifyUserId) {
        await createNotification({
          tipo: "success",
          titulo: notificationTitle,
          descripcion: notificationDescription,
          icono: "MessageSquare",
          entidad: entityType,
          entidadId: entityId,
          url: `${getEntityUrl(entityType, entityId)}#comment-${comment.id}`,
          usuarioId: notifyUserId,
          actorId: session.user.id, // Usuario que comentó
          prioridad: "normal",
        })
        console.log(`✅ [Comments] Created comment notification for user: ${notifyUserId}`)
      }
    } catch (notifError) {
      console.error("⚠️ [Comments] Failed to create comment notification:", notifError)
    }

    // Trigger Pusher event for real-time updates
    try {
      const channelName = `comments-${entityType}-${entityId}`
      await triggerPusherEvent(channelName, "new-comment", {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        editedAt: comment.editedAt ? comment.editedAt.toISOString() : null,
      })
      console.log(`✅ [Comments] Pusher event sent to channel: ${channelName}`)
    } catch (pusherError) {
      // Don't fail the request if Pusher fails
      console.error("⚠️ [Comments] Pusher event failed:", pusherError)
    }

    return NextResponse.json({ success: true, data: comment }, { status: 201 })
  } catch (error) {
    console.error("❌ [Comments API POST] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create comment",
      },
      { status: 500 }
    )
  }
}
