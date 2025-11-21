import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { auditUpdate, auditDelete } from "@/lib/audit-logger"
import { z } from "zod"

// Force dynamic rendering
export const dynamic = "force-dynamic"

// Validation schema for update
const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(5000, "Comment is too long"),
})

/**
 * PUT /api/comments/[id]
 * Update a comment (only the author can update)
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const commentId = params.id

    // Check if comment exists and user is the author
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    if (existingComment.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "You can only edit your own comments" },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = updateCommentSchema.safeParse(body)
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

    const { content } = validation.data

    // Update comment
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        editedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Create audit log
    await auditUpdate(
      "Comment",
      { id: comment.id, content: existingComment.content },
      { id: comment.id, content },
      request,
      session.user.email || ""
    )

    return NextResponse.json({ success: true, data: comment })
  } catch (error) {
    console.error("❌ [Comments API PUT] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update comment",
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/comments/[id]
 * Delete a comment (only the author can delete)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const commentId = params.id

    // Check if comment exists and user is the author
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    if (existingComment.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own comments" },
        { status: 403 }
      )
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: commentId },
    })

    // Create audit log
    await auditDelete(
      "Comment",
      {
        id: commentId,
        content: existingComment.content,
        entityType: existingComment.entityType,
        entityId: existingComment.entityId,
      },
      request,
      session.user.email || ""
    )

    return NextResponse.json({ success: true, message: "Comment deleted successfully" })
  } catch (error) {
    console.error("❌ [Comments API DELETE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete comment",
      },
      { status: 500 }
    )
  }
}
