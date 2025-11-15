import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params (Next.js 14+)
    const params = await context.params

    // Construir la ruta del archivo
    const filePath = join(process.cwd(), "public", "uploads", ...params.path)

    console.log("Serving file:", filePath)

    // Verificar que el archivo existe
    if (!existsSync(filePath)) {
      console.log("File not found:", filePath)
      return new NextResponse("Archivo no encontrado", { status: 404 })
    }

    // Leer el archivo
    const fileBuffer = await readFile(filePath)

    // Determinar el tipo de contenido basado en la extensión
    const extension = params.path[params.path.length - 1].split('.').pop()?.toLowerCase()
    const contentTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'pdf': 'application/pdf',
      'gif': 'image/gif',
      'webp': 'image/webp',
    }

    const contentType = contentTypes[extension || ''] || 'application/octet-stream'

    console.log("Serving file with content-type:", contentType)

    // Retornar el archivo
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Error al servir el archivo: " + (error as Error).message, { status: 500 })
  }
}
