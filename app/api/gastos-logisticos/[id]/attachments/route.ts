import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { CacheInvalidator } from "@/lib/cache-helpers"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

// PUT /api/gastos-logisticos/[id]/attachments - Agregar adjuntos a un gasto existente
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params
    const body = await request.json()
    const { adjuntos } = body as { adjuntos: FileAttachment[] }

    if (!adjuntos || !Array.isArray(adjuntos)) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere un array de adjuntos",
        },
        { status: 400 }
      )
    }

    // Verificar que el gasto existe
    const gasto = await db.gastosLogisticos.findUnique({
      where: { id },
      select: {
        adjuntos: true,
        ordenesCompra: {
          select: {
            ocId: true,
          },
        },
      },
    })

    if (!gasto) {
      return NextResponse.json(
        {
          success: false,
          error: "Gasto logístico no encontrado",
        },
        { status: 404 }
      )
    }

    // Combinar adjuntos existentes con los nuevos
    const existingAttachments = (gasto.adjuntos as unknown as FileAttachment[]) || []
    const updatedAttachments = [...existingAttachments, ...adjuntos]

    // Actualizar en la base de datos
    const updated = await db.gastosLogisticos.update({
      where: { id },
      data: {
        adjuntos: updatedAttachments as any,
      },
      include: {
        ordenesCompra: {
          include: {
            ocChina: {
              select: {
                id: true,
                oc: true,
                proveedor: true,
              },
            },
          },
        },
      },
    })

    // Invalidar cache de todas las OCs asociadas
    const ocIds = updated.ordenesCompra.map(rel => rel.ocChina.id)
    await CacheInvalidator.invalidateGastosLogisticos(ocIds)

    return NextResponse.json({
      success: true,
      data: updated,
      message: `${adjuntos.length} archivo(s) agregado(s) exitosamente`,
    })
  } catch (error) {
    console.error("Error en PUT /api/gastos-logisticos/[id]/attachments:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al agregar adjuntos",
      },
      { status: 500 }
    )
  }
}

// DELETE /api/gastos-logisticos/[id]/attachments - Eliminar un adjunto específico
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getPrismaClient()
    const { id } = params
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get("fileUrl")

    if (!fileUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere la URL del archivo a eliminar",
        },
        { status: 400 }
      )
    }

    // Verificar que el gasto existe
    const gasto = await db.gastosLogisticos.findUnique({
      where: { id },
      select: {
        adjuntos: true,
        ordenesCompra: {
          select: {
            ocId: true,
          },
        },
      },
    })

    if (!gasto) {
      return NextResponse.json(
        {
          success: false,
          error: "Gasto logístico no encontrado",
        },
        { status: 404 }
      )
    }

    // Filtrar el adjunto a eliminar
    const existingAttachments = (gasto.adjuntos as unknown as FileAttachment[]) || []
    const updatedAttachments = existingAttachments.filter(att => att.url !== fileUrl)

    // Verificar si el archivo existe en los adjuntos actuales
    const fileExists = existingAttachments.length !== updatedAttachments.length

    // Extraer OC IDs para invalidación de cache
    const ocIds = gasto.ordenesCompra.map(rel => rel.ocId)

    // Si el archivo no existe, aún invalidamos cache y retornamos éxito con mensaje apropiado
    if (!fileExists) {
      await CacheInvalidator.invalidateGastosLogisticos(ocIds)
      return NextResponse.json({
        success: true,
        data: gasto,
        message: "El archivo ya fue eliminado previamente",
      })
    }

    // Actualizar en la base de datos
    const updated = await db.gastosLogisticos.update({
      where: { id },
      data: {
        adjuntos: updatedAttachments as any,
      },
    })

    // Invalidar cache de todas las OCs asociadas
    await CacheInvalidator.invalidateGastosLogisticos(ocIds)

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Archivo eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error en DELETE /api/gastos-logisticos/[id]/attachments:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar adjunto",
      },
      { status: 500 }
    )
  }
}
