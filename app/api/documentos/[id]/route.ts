import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getPrismaClient } from "@/lib/db-helpers"
import { handleApiError } from "@/lib/api-error-handler"
import { logAudit, AuditAction } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

/**
 * PATCH /api/documentos/[id]
 * Renombrar un documento
 * ID format: {origen}-{recordId}-{fileUrl}
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const prisma = await getPrismaClient()
    const body = await request.json()
    const { nombre } = body

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    // Parse synthetic ID: {origen}-{recordId}-{fileUrl}
    const parts = params.id.split("-")
    if (parts.length < 3) {
      return NextResponse.json({ error: "ID de documento inválido" }, { status: 400 })
    }

    const origen = parts[0] // "oc", "pago", "gasto"
    const recordId = parts[1]
    const fileUrl = parts.slice(2).join("-") // Reconstruct URL (may contain dashes)

    let updatedRecord: any = null
    let nombreAnterior = ""

    // Update based on origen
    if (origen === "oc") {
      const orden = await prisma.oCChina.findUnique({
        where: { id: recordId },
        select: { id: true, oc: true, adjuntos: true },
      })

      if (!orden) {
        return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
      }

      const adjuntos = (orden.adjuntos as unknown as FileAttachment[]) || []
      const adjuntoIndex = adjuntos.findIndex(att => att.url === fileUrl)

      if (adjuntoIndex === -1) {
        return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
      }

      nombreAnterior = adjuntos[adjuntoIndex].nombre
      adjuntos[adjuntoIndex].nombre = nombre.trim()

      updatedRecord = await prisma.oCChina.update({
        where: { id: recordId },
        data: { adjuntos: adjuntos as any },
      })

      await logAudit({
        entidad: "Documento-OCChina",
        entidadId: params.id,
        accion: AuditAction.UPDATE,
        descripcion: `Documento renombrado en OC ${orden.oc}`,
        usuarioEmail: session.user.email,
        cambiosAntes: { nombre: nombreAnterior },
        cambiosDespues: { nombre: nombre.trim() },
      })
    } else if (origen === "pago") {
      const pago = await prisma.pagosChina.findUnique({
        where: { id: recordId },
        select: { id: true, idPago: true, adjuntos: true },
      })

      if (!pago) {
        return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
      }

      const adjuntos = (pago.adjuntos as unknown as FileAttachment[]) || []
      const adjuntoIndex = adjuntos.findIndex(att => att.url === fileUrl)

      if (adjuntoIndex === -1) {
        return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
      }

      nombreAnterior = adjuntos[adjuntoIndex].nombre
      adjuntos[adjuntoIndex].nombre = nombre.trim()

      updatedRecord = await prisma.pagosChina.update({
        where: { id: recordId },
        data: { adjuntos: adjuntos as any },
      })

      await logAudit({
        entidad: "Documento-PagoChina",
        entidadId: params.id,
        accion: AuditAction.UPDATE,
        descripcion: `Documento renombrado en Pago ${pago.idPago}`,
        usuarioEmail: session.user.email,
        cambiosAntes: { nombre: nombreAnterior },
        cambiosDespues: { nombre: nombre.trim() },
      })
    } else if (origen === "gasto") {
      const gasto = await prisma.gastosLogisticos.findUnique({
        where: { id: recordId },
        select: { id: true, idGasto: true, adjuntos: true },
      })

      if (!gasto) {
        return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
      }

      const adjuntos = (gasto.adjuntos as unknown as FileAttachment[]) || []
      const adjuntoIndex = adjuntos.findIndex(att => att.url === fileUrl)

      if (adjuntoIndex === -1) {
        return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
      }

      nombreAnterior = adjuntos[adjuntoIndex].nombre
      adjuntos[adjuntoIndex].nombre = nombre.trim()

      updatedRecord = await prisma.gastosLogisticos.update({
        where: { id: recordId },
        data: { adjuntos: adjuntos as any },
      })

      await logAudit({
        entidad: "Documento-GastoLogistico",
        entidadId: params.id,
        accion: AuditAction.UPDATE,
        descripcion: `Documento renombrado en Gasto ${gasto.idGasto}`,
        usuarioEmail: session.user.email,
        cambiosAntes: { nombre: nombreAnterior },
        cambiosDespues: { nombre: nombre.trim() },
      })
    } else {
      return NextResponse.json({ error: "Tipo de documento no soportado" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Documento renombrado exitosamente",
      data: updatedRecord,
    })
  } catch (error) {
    console.error("Error renaming document:", error)
    return handleApiError(error)
  }
}
