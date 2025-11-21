import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering
export const dynamic = "force-dynamic"

/**
 * GET /api/users/search?q=query
 * Search users by name or email for mentions autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: "Query must be at least 2 characters" },
        { status: 400 }
      )
    }

    // Search users by name, lastName, or email
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { activo: true },
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        profilePhoto: true,
      },
      take: 10, // Limit results to 10
      orderBy: [{ name: "asc" }, { lastName: "asc" }],
    })

    // Format user data for autocomplete
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      profilePhoto: user.profilePhoto,
      displayName: `${user.name}${user.lastName ? ` ${user.lastName}` : ""}`.trim(),
      username: `${user.name}${user.lastName ? `.${user.lastName.toLowerCase()}` : ""}`.replace(
        /\s+/g,
        "."
      ),
    }))

    return NextResponse.json({ success: true, data: formattedUsers })
  } catch (error) {
    console.error("❌ [Users Search API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search users",
      },
      { status: 500 }
    )
  }
}
