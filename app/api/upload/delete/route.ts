import { NextRequest, NextResponse } from "next/server"
import { unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { handleApiError, Errors } from "@/lib/api-error-handler"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get("url")

    if (!fileUrl) {
      throw Errors.badRequest("No se proporcionó URL del archivo")
    }

    // SEGURIDAD: Validar que no haya path traversal (.., ./, etc)
    if (fileUrl.includes("..")) {
      console.warn(`🚨 Path traversal attack detected: ${fileUrl}`)
      throw Errors.badRequest("Ruta de archivo no válida")
    }

    // SEGURIDAD: Validar que la URL sea de uploads o /api/uploads/
    const isUploadsUrl =
      fileUrl.startsWith("uploads/") ||
      fileUrl.startsWith("/uploads/") ||
      fileUrl.startsWith("/api/uploads/")
    if (!isUploadsUrl) {
      throw Errors.badRequest("Solo se pueden eliminar archivos de uploads")
    }

    // Construir ruta del archivo de manera segura
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    // Limpiar la URL: remover /api/uploads/, /uploads/, o uploads/ del inicio
    const requestedPath = fileUrl
      .replace(/^\/+/, "") // Remover slashes iniciales
      .replace(/^api\/uploads\//, "") // Remover api/uploads/
      .replace(/^uploads\//, "") // Remover uploads/
    const filepath = path.join(uploadsDir, requestedPath)

    // SEGURIDAD CRÍTICA: Verificar que la ruta resuelta está dentro de uploads
    const normalizedFilepath = path.normalize(filepath)
    const normalizedUploadsDir = path.normalize(uploadsDir)

    if (!normalizedFilepath.startsWith(normalizedUploadsDir)) {
      console.error(`🚨 Path traversal attack blocked: ${fileUrl}`)
      throw Errors.forbidden("Ruta de archivo no válida")
    }

    // Verificar que el archivo existe
    if (!existsSync(normalizedFilepath)) {
      // Si el archivo no existe, retornar éxito (ya fue eliminado previamente)
      return NextResponse.json({
        success: true,
        message: "El archivo ya fue eliminado previamente",
      })
    }

    // Eliminar archivo
    await unlink(normalizedFilepath)

    return NextResponse.json({
      success: true,
      message: "Archivo eliminado exitosamente",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
