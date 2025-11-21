import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { randomUUID } from "crypto"

// Force dynamic rendering
export const dynamic = "force-dynamic"

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = {
  // Images
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  // Documents
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
  // Archives
  "application/zip": ".zip",
  "application/x-rar-compressed": ".rar",
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "comments")

/**
 * POST /api/comments/attachments
 * Upload files for comment attachments
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Parse FormData
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 })
    }

    // Validate and process each file
    const attachments = []
    const errors = []

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]) {
        errors.push(`${file.name}: Tipo de archivo no permitido (${file.type})`)
        continue
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(
          `${file.name}: Archivo muy grande (${(file.size / 1024 / 1024).toFixed(2)}MB, máximo 10MB)`
        )
        continue
      }

      try {
        // Generate unique filename
        const extension = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]
        const uniqueId = randomUUID()
        const filename = `${Date.now()}-${uniqueId}${extension}`
        const filepath = path.join(UPLOAD_DIR, filename)

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filepath, buffer)

        // Add to attachments array
        attachments.push({
          url: `/uploads/comments/${filename}`,
          name: file.name,
          type: file.type,
          size: file.size,
        })

        console.log(`✅ [Attachments] File uploaded: ${filename} (${file.name})`)
      } catch (error) {
        console.error(`❌ [Attachments] Failed to upload ${file.name}:`, error)
        errors.push(`${file.name}: Error al guardar el archivo`)
      }
    }

    // Return results
    if (attachments.length === 0 && errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No se pudo subir ningún archivo",
          details: errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: attachments,
      warnings: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("❌ [Attachments API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload files",
      },
      { status: 500 }
    )
  }
}
