import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/api-error-handler"

interface FileAttachment {
  nombre: string
  url: string
  tipo: string
  size: number
  uploadedAt: string
}

interface DocumentWithSource extends FileAttachment {
  id: string
  origen: string // "Ordenes", "Pagos", "Gastos"
  categoria: string // "Facturas Comerciales", "Comprobantes de Pago", "Documentos Logísticos"
  ocRelacionada?: string
  fechaAsociada?: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get("categoria") // "todos" | "facturas" | "comprobantes" | "logisticos"
    const oc = searchParams.get("oc") // Filtrar por OC específica
    const search = searchParams.get("search") // Buscar en nombres

    const documentos: DocumentWithSource[] = []

    // 1. Obtener documentos de Ordenes (OC China)
    const ordenes = await prisma.oCChina.findMany({
      where: oc ? { oc } : undefined,
      select: {
        id: true,
        oc: true,
        adjuntos: true,
        fechaOC: true,
      },
    })

    for (const orden of ordenes) {
      if (orden.adjuntos && Array.isArray(orden.adjuntos)) {
        const attachments = orden.adjuntos as unknown as FileAttachment[]
        attachments.forEach(att => {
          documentos.push({
            ...att,
            id: `oc-${orden.id}-${att.url}`,
            origen: "Ordenes",
            categoria: "Facturas Comerciales",
            ocRelacionada: orden.oc,
            fechaAsociada: orden.fechaOC?.toISOString(),
          })
        })
      }
    }

    // 2. Obtener documentos de Pagos China
    const pagos = await prisma.pagosChina.findMany({
      where: oc ? { ocChina: { oc } } : undefined,
      select: {
        id: true,
        idPago: true,
        adjuntos: true,
        fechaPago: true,
        ocChina: {
          select: { oc: true },
        },
      },
    })

    for (const pago of pagos) {
      if (pago.adjuntos && Array.isArray(pago.adjuntos)) {
        const attachments = pago.adjuntos as unknown as FileAttachment[]
        attachments.forEach(att => {
          documentos.push({
            ...att,
            id: `pago-${pago.id}-${att.url}`,
            origen: "Pagos",
            categoria: "Comprobantes de Pago",
            ocRelacionada: pago.ocChina.oc,
            fechaAsociada: pago.fechaPago.toISOString(),
          })
        })
      }
    }

    // 3. Obtener documentos de Gastos Logísticos
    const gastos = await prisma.gastosLogisticos.findMany({
      where: oc
        ? {
            ordenesCompra: {
              some: {
                ocChina: { oc },
              },
            },
          }
        : undefined,
      select: {
        id: true,
        idGasto: true,
        adjuntos: true,
        fechaGasto: true,
        ordenesCompra: {
          select: {
            ocChina: {
              select: { oc: true },
            },
          },
        },
      },
    })

    for (const gasto of gastos) {
      if (gasto.adjuntos && Array.isArray(gasto.adjuntos)) {
        const attachments = gasto.adjuntos as unknown as FileAttachment[]
        attachments.forEach(att => {
          documentos.push({
            ...att,
            id: `gasto-${gasto.id}-${att.url}`,
            origen: "Gastos",
            categoria: "Documentos Logísticos",
            ocRelacionada: gasto.ordenesCompra?.[0]?.ocChina.oc,
            fechaAsociada: gasto.fechaGasto.toISOString(),
          })
        })
      }
    }

    // Filtrar por categoría
    let filteredDocs = documentos
    if (categoria && categoria !== "todos") {
      const categoriaMap: { [key: string]: string } = {
        facturas: "Facturas Comerciales",
        comprobantes: "Comprobantes de Pago",
        logisticos: "Documentos Logísticos",
      }
      filteredDocs = documentos.filter(doc => doc.categoria === categoriaMap[categoria])
    }

    // Filtrar por búsqueda en nombre
    if (search) {
      filteredDocs = filteredDocs.filter(doc =>
        doc.nombre.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Ordenar por fecha más reciente primero
    filteredDocs.sort((a, b) => {
      const dateA = a.fechaAsociada ? new Date(a.fechaAsociada).getTime() : 0
      const dateB = b.fechaAsociada ? new Date(b.fechaAsociada).getTime() : 0
      return dateB - dateA
    })

    return NextResponse.json({
      success: true,
      data: filteredDocs,
      total: filteredDocs.length,
    })
  } catch (error) {
    console.error("Error fetching documentos:", error)
    return handleApiError(error)
  }
}
