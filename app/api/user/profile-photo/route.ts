import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getPrismaClient } from "@/lib/db-helpers"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("photo") as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó ninguna imagen" },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo de archivo no válido. Solo se permiten: JPG, PNG, WEBP",
        },
        { status: 400 }
      )
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "El archivo es demasiado grande. Máximo 20MB" },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const userId = session.user.id
    const extension = file.name.split(".").pop()
    const filename = `profile_${userId}_${timestamp}.${extension}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "profiles")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filepath = path.join(uploadsDir, filename)
    await writeFile(filepath, buffer)

    // Generate URL (must use /api/uploads/ path for serving)
    const photoUrl = `/api/uploads/profiles/${filename}`

    // Update user in database
    const db = await getPrismaClient()
    await db.user.update({
      where: { id: userId },
      data: { profilePhoto: photoUrl },
    })

    return NextResponse.json({
      success: true,
      data: {
        url: photoUrl,
        message: "Foto de perfil actualizada exitosamente",
      },
    })
  } catch (error) {
    console.error("Error uploading profile photo:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al subir la foto",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    // Remove profile photo from database
    const db = await getPrismaClient()
    await db.user.update({
      where: { id: session.user.id },
      data: { profilePhoto: null },
    })

    return NextResponse.json({
      success: true,
      data: { message: "Foto de perfil eliminada exitosamente" },
    })
  } catch (error) {
    console.error("Error deleting profile photo:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al eliminar la foto",
      },
      { status: 500 }
    )
  }
}
