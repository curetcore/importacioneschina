import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { auditCreate } from "@/lib/audit-logger"
import { z } from "zod"

// Force dynamic rendering
export const dynamic = "force-dynamic"

// Validation schema
const commentSchema = z.object({
  entityType: z.string().min(1, "Entity type is required"),
  entityId: z.string().min(1, "Entity ID is required"),
  content: z.string().min(1, "Comment content is required").max(5000, "Comment is too long"),
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

    const comments = await prisma.comment.findMany({
      where: {
        entityType,
        entityId,
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

    const { entityType, entityId, content } = validation.data

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        entityType,
        entityId,
        content,
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
