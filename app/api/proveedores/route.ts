import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { proveedorSchema } from "@/lib/validations/proveedor"
import { handleApiError } from "@/lib/api-error-handler"
import { auditCreate } from "@/lib/audit-logger"

// GET /api/proveedores - Obtener todos los proveedores
export async function GET(request: NextRequest) {
  try {
    const db = await getPrismaClient()
    const { searchParams } = new URL(request.url)
    const activo = searchParams.get("activo")

    const whereClause = activo !== null ? { activo: activo === "true" } : {}

    const proveedores = await db.proveedor.findMany({
      where: whereClause,
      orderBy: {
        nombre: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      data: proveedores,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/proveedores - Crear nuevo proveedor
export async function POST(request: NextRequest) {
  try {
    const db = await getPrismaClient()
    const body = await request.json()

    // Validar datos
    const validatedData = proveedorSchema.parse(body)

    // Auto-generar código si no se proporciona
    let codigo = validatedData.codigo
    if (!codigo) {
      // Obtener el último proveedor para generar el siguiente código
      const lastProveedor = await db.proveedor.findFirst({
        orderBy: { codigo: "desc" },
        select: { codigo: true },
      })

      if (lastProveedor) {
        // Extraer el número del código (ej: "PROV-005" -> 5)
        const match = lastProveedor.codigo.match(/PROV-(\d+)/)
        const nextNumber = match ? parseInt(match[1]) + 1 : 1
        codigo = `PROV-${String(nextNumber).padStart(3, "0")}`
      } else {
        codigo = "PROV-001"
      }
    }

    // Crear proveedor
    const proveedor = await db.proveedor.create({
      data: {
        codigo,
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
    await auditCreate("Proveedor", proveedor as any, request)

    return NextResponse.json(
      {
        success: true,
        data: proveedor,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
