import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

// Configuración
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
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
    // Rate limiting para uploads - 3 req/60s
    const rateLimitError = await withRateLimit(request, RateLimits.upload)
    if (rateLimitError) return rateLimitError

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const module = formData.get("module") as string | null
    const customName = formData.get("customName") as string | null

    // Validaciones
    if (!file) {
      throw Errors.badRequest("No se proporcionó ningún archivo")
    }

    if (!module || !MODULE_FOLDERS[module]) {
      throw Errors.badRequest("Módulo no válido")
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw Errors.badRequest("Tipo de archivo no permitido. Solo JPG, PNG y PDF son válidos.")
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      throw Errors.badRequest("El archivo excede el tamaño máximo de 20MB")
    }

    // SEGURIDAD: Validar extensión del archivo (evitar double extensions como .php.jpg)
    const originalExtension = path.extname(file.name).toLowerCase()
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"]

    if (!allowedExtensions.includes(originalExtension)) {
      throw Errors.badRequest(
        "Extensión de archivo no válida. Solo .jpg, .jpeg, .png y .pdf son permitidos."
      )
    }

    // SEGURIDAD: Validar que el nombre no contenga caracteres peligrosos o path traversal
    const originalName = file.name
    if (originalName.includes("..") || originalName.includes("/") || originalName.includes("\\")) {
      throw Errors.badRequest("Nombre de archivo no válido")
    }

    // SEGURIDAD: Validar customName si se proporciona
    let displayName = originalName
    if (customName) {
      const trimmedCustomName = customName.trim()
      if (
        trimmedCustomName.includes("..") ||
        trimmedCustomName.includes("/") ||
        trimmedCustomName.includes("\\")
      ) {
        throw Errors.badRequest("Nombre personalizado no válido")
      }
      displayName = trimmedCustomName
    }

    // Crear directorio si no existe
    const moduleDir = path.join(UPLOAD_DIR, MODULE_FOLDERS[module])
    if (!existsSync(moduleDir)) {
      await mkdir(moduleDir, { recursive: true })
    }

    // Generar nombre único seguro
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    // Usar la extensión validada (no la del usuario directamente)
    const filename = `${timestamp}-${randomString}${originalExtension}`
    const filepath = path.join(moduleDir, filename)

    // Guardar archivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Retornar información del archivo
    const fileInfo = {
      nombre: displayName,
      url: `/api/uploads/${MODULE_FOLDERS[module]}/${filename}`,
      tipo: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: fileInfo,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
