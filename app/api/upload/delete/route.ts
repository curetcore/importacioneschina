import { NextRequest, NextResponse } from "next/server"
import { unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get("url")

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó URL del archivo" },
        { status: 400 }
      )
    }

    // SEGURIDAD: Validar que no haya path traversal (.., ./, etc)
    if (fileUrl.includes("..") || fileUrl.includes("./") || fileUrl.startsWith("/")) {
      console.warn(`🚨 Path traversal attack detected: ${fileUrl}`)
      return NextResponse.json(
        { success: false, error: "Ruta de archivo no válida" },
        { status: 400 }
      )
    }

    // SEGURIDAD: Validar que la URL empiece con /uploads/
    if (!fileUrl.startsWith("uploads/") && !fileUrl.startsWith("/uploads/")) {
      return NextResponse.json(
        { success: false, error: "Solo se pueden eliminar archivos de uploads" },
        { status: 400 }
      )
    }

    // Construir ruta del archivo de manera segura
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    const requestedPath = fileUrl.replace(/^\/+/, "").replace(/^uploads\//, "")
    const filepath = path.join(uploadsDir, requestedPath)

    // SEGURIDAD CRÍTICA: Verificar que la ruta resuelta está dentro de uploads
    const normalizedFilepath = path.normalize(filepath)
    const normalizedUploadsDir = path.normalize(uploadsDir)

    if (!normalizedFilepath.startsWith(normalizedUploadsDir)) {
      console.error(`🚨 Path traversal attack blocked: ${fileUrl}`)
      return NextResponse.json(
        { success: false, error: "Ruta de archivo no válida" },
        { status: 403 }
      )
    }

    // Verificar que el archivo existe
    if (!existsSync(normalizedFilepath)) {
      return NextResponse.json(
        { success: false, error: "El archivo no existe" },
        { status: 404 }
      )
    }

    // Eliminar archivo
    await unlink(normalizedFilepath)

    return NextResponse.json({
      success: true,
      message: "Archivo eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { success: false, error: "Error al eliminar el archivo" },
      { status: 500 }
    )
  }
}
