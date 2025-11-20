import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { proveedorSchema } from "@/lib/validations/proveedor"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { auditUpdate, auditDelete } from "@/lib/audit-logger"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"
import { CacheInvalidator } from "@/lib/cache-helpers"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

// GET /api/proveedores/[id] - Obtener proveedor por ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limiting para queries - 60 req/60s
    const rateLimitError = await withRateLimit(request, RateLimits.query)
    if (rateLimitError) return rateLimitError

    const db = await getPrismaClient()
    const { id } = params

    const proveedor = await db.proveedor.findUnique({
      where: { id },
    })

    if (!proveedor) {
      throw Errors.notFound("Proveedor", id)
    }

    return NextResponse.json({
      success: true,
      data: proveedor,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/proveedores/[id] - Actualizar proveedor
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limiting para mutations - 20 req/10s
    const rateLimitError = await withRateLimit(request, RateLimits.mutation)
    if (rateLimitError) return rateLimitError

    const db = await getPrismaClient()
    const { id } = params
    const body = await request.json()

    // Validar datos
    const validatedData = proveedorSchema.parse(body)

    // Obtener proveedor actual para audit
    const currentProveedor = await db.proveedor.findUnique({
      where: { id },
    })

    if (!currentProveedor) {
      throw Errors.notFound("Proveedor", id)
    }

    // Actualizar proveedor
    const updatedProveedor = await db.proveedor.update({
      where: { id },
      data: {
        codigo: validatedData.codigo,
        nombre: validatedData.nombre,
        contactoPrincipal: validatedData.contactoPrincipal,
        email: validatedData.email || undefined,
        telefono: validatedData.telefono,
        whatsapp: validatedData.whatsapp,
        wechat: validatedData.wechat,
        pais: validatedData.pais,
        ciudad: validatedData.ciudad,
        direccion: validatedData.direccion,
        sitioWeb: validatedData.sitioWeb || undefined,
        categoriaProductos: validatedData.categoriaProductos,
        tiempoEntregaDias: validatedData.tiempoEntregaDias,
        monedaPreferida: validatedData.monedaPreferida,
        terminosPago: validatedData.terminosPago,
        minimoOrden: validatedData.minimoOrden,
        notas: validatedData.notas,
        calificacion: validatedData.calificacion,
        activo: validatedData.activo,
      },
    })

    // Audit log
    await auditUpdate("Proveedor", currentProveedor as any, updatedProveedor as any, request)

    // Invalidar cache de proveedores
    await CacheInvalidator.invalidateProveedores()

    return NextResponse.json({
      success: true,
      data: updatedProveedor,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/proveedores/[id] - Eliminar proveedor (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limiting para mutations - 20 req/10s
    const rateLimitError = await withRateLimit(request, RateLimits.mutation)
    if (rateLimitError) return rateLimitError

    const db = await getPrismaClient()
    const { id } = params

    const proveedor = await db.proveedor.findUnique({
      where: { id },
    })

    if (!proveedor) {
      throw Errors.notFound("Proveedor", id)
    }

    // Soft delete - marcar como inactivo
    const deletedProveedor = await db.proveedor.update({
      where: { id },
      data: {
        activo: false,
      },
    })

    // Audit log
    await auditDelete("Proveedor", deletedProveedor as any, request)

    // Invalidar cache de proveedores
    await CacheInvalidator.invalidateProveedores()

    return NextResponse.json({
      success: true,
      message: "Proveedor marcado como inactivo",
      data: deletedProveedor,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
