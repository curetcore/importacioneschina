import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

// PUT /api/oc-china/[id]/attachments - Agregar adjuntos a una OC existente
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    const db = await getPrismaClient()

    // Verificar que la OC existe
    const oc = await db.oCChina.findUnique({
      where: { id },
      select: { adjuntos: true },
    })

    if (!oc) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden de compra no encontrada",
        },
        { status: 404 }
      )
    }

    // Combinar adjuntos existentes con los nuevos
    const existingAttachments = (oc.adjuntos as unknown as FileAttachment[]) || []
    const updatedAttachments = [...existingAttachments, ...adjuntos]

    // Actualizar en la base de datos
    const updated = await db.oCChina.update({
      where: { id },
      data: {
        adjuntos: updatedAttachments as any,
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: `${adjuntos.length} archivo(s) agregado(s) exitosamente`,
    })
  } catch (error) {
    console.error("Error en PUT /api/oc-china/[id]/attachments:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al agregar adjuntos",
      },
      { status: 500 }
    )
  }
}

// DELETE /api/oc-china/[id]/attachments - Eliminar un adjunto específico
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    const db = await getPrismaClient()

    // Verificar que la OC existe
    const oc = await db.oCChina.findUnique({
      where: { id },
      select: { adjuntos: true },
    })

    if (!oc) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden de compra no encontrada",
        },
        { status: 404 }
      )
    }

    // Filtrar el adjunto a eliminar
    const existingAttachments = (oc.adjuntos as unknown as FileAttachment[]) || []
    const updatedAttachments = existingAttachments.filter(att => att.url !== fileUrl)

    // Actualizar en la base de datos
    const updated = await db.oCChina.update({
      where: { id },
      data: {
        adjuntos: updatedAttachments as any,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Archivo eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error en DELETE /api/oc-china/[id]/attachments:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar adjunto",
      },
      { status: 500 }
    )
  }
}
