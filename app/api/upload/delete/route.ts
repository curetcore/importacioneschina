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

    // Construir ruta del archivo
    const filepath = path.join(process.cwd(), "public", fileUrl)

    // Verificar que el archivo existe
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { success: false, error: "El archivo no existe" },
        { status: 404 }
      )
    }

    // Verificar que es un archivo de uploads
    if (!filepath.includes("/uploads/")) {
      return NextResponse.json(
        { success: false, error: "Ruta de archivo no válida" },
        { status: 400 }
      )
    }

    // Eliminar archivo
    await unlink(filepath)

    return NextResponse.json({
      success: true,
      message: "Archivo eliminado exitosamente",
    })
  } catch (error: any) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { success: false, error: "Error al eliminar el archivo" },
      { status: 500 }
    )
  }
}
