import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// Configuración
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")

// Mapeo de módulos a carpetas
const MODULE_FOLDERS: { [key: string]: string } = {
  "oc-china": "oc-china",
  "pagos-china": "pagos-china",
  "gastos-logisticos": "gastos-logisticos",
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const module = formData.get("module") as string | null

    // Validaciones
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó ningún archivo" },
        { status: 400 }
      )
    }

    if (!module || !MODULE_FOLDERS[module]) {
      return NextResponse.json(
        { success: false, error: "Módulo no válido" },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo de archivo no permitido. Solo JPG, PNG y PDF son válidos.",
        },
        { status: 400 }
      )
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "El archivo excede el tamaño máximo de 10MB",
        },
        { status: 400 }
      )
    }

    // Crear directorio si no existe
    const moduleDir = path.join(UPLOAD_DIR, MODULE_FOLDERS[module])
    if (!existsSync(moduleDir)) {
      await mkdir(moduleDir, { recursive: true })
    }

    // Generar nombre único
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = path.extname(file.name)
    const filename = `${timestamp}-${randomString}${extension}`
    const filepath = path.join(moduleDir, filename)

    // Guardar archivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Retornar información del archivo
    const fileInfo = {
      nombre: file.name,
      url: `/uploads/${MODULE_FOLDERS[module]}/${filename}`,
      tipo: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: fileInfo,
    })
  } catch (error: any) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { success: false, error: "Error al subir el archivo" },
      { status: 500 }
    )
  }
}
