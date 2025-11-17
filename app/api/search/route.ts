import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { handleApiError } from "@/lib/api-error-handler"

export const dynamic = "force-dynamic"

interface SearchResult {
  type: "orden" | "pago" | "gasto" | "inventario" | "proveedor"
  id: string
  title: string
  subtitle: string
  url: string
  metadata?: Record<string, any>
}

// GET /api/search - Búsqueda global en todos los módulos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
        message: "Consulta muy corta",
      })
    }

    const db = await getPrismaClient()
    const results: SearchResult[] = []

    // Buscar en Órdenes de Compra
    const ordenes = await db.oCChina.findMany({
      where: {
        deletedAt: null,
        OR: [
          { oc: { contains: query, mode: "insensitive" } },
          { proveedor: { contains: query, mode: "insensitive" } },
          { descripcionLote: { contains: query, mode: "insensitive" } },
          { categoriaPrincipal: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        oc: true,
        proveedor: true,
        fechaOC: true,
        categoriaPrincipal: true,
      },
    })

    ordenes.forEach(orden => {
      results.push({
        type: "orden",
        id: orden.id,
        title: `OC ${orden.oc}`,
        subtitle: `${orden.proveedor} - ${orden.categoriaPrincipal}`,
        url: `/ordenes/${orden.id}`,
      })
    })

    // Buscar en Pagos a China
    const pagos = await db.pagosChina.findMany({
      where: {
        deletedAt: null,
        OR: [
          { ocId: { contains: query, mode: "insensitive" } },
          { idPago: { contains: query, mode: "insensitive" } },
          { metodoPago: { contains: query, mode: "insensitive" } },
          { tipoPago: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        ocId: true,
        idPago: true,
        fechaPago: true,
        montoOriginal: true,
        moneda: true,
        metodoPago: true,
        tipoPago: true,
      },
    })

    pagos.forEach(pago => {
      results.push({
        type: "pago",
        id: pago.id,
        title: `Pago ${pago.idPago}`,
        subtitle: `${pago.tipoPago} - ${pago.metodoPago} - ${pago.moneda} ${pago.montoOriginal}`,
        url: `/pagos-china?highlight=${pago.id}`,
      })
    })

    // Buscar en Gastos Logísticos
    const gastos = await db.gastosLogisticos.findMany({
      where: {
        deletedAt: null,
        OR: [
          { tipoGasto: { contains: query, mode: "insensitive" } },
          { proveedorServicio: { contains: query, mode: "insensitive" } },
          { notas: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        idGasto: true,
        tipoGasto: true,
        proveedorServicio: true,
        montoRD: true,
        notas: true,
      },
    })

    gastos.forEach(gasto => {
      results.push({
        type: "gasto",
        id: gasto.id,
        title: gasto.tipoGasto,
        subtitle: `${gasto.proveedorServicio || "N/A"} - RD$${gasto.montoRD} - ${gasto.notas || ""}`,
        url: `/gastos-logisticos?highlight=${gasto.id}`,
      })
    })

    // Buscar en Inventario Recibido
    const inventario = await db.inventarioRecibido.findMany({
      where: {
        deletedAt: null,
        OR: [
          { ocId: { contains: query, mode: "insensitive" } },
          { item: { sku: { contains: query, mode: "insensitive" } } },
          { item: { nombre: { contains: query, mode: "insensitive" } } },
        ],
      },
      take: 5,
      select: {
        id: true,
        ocId: true,
        cantidadRecibida: true,
        bodegaInicial: true,
        item: {
          select: {
            sku: true,
            nombre: true,
          },
        },
      },
    })

    inventario.forEach(item => {
      const sku = item.item?.sku || "Sin SKU"
      const nombre = item.item?.nombre || "Sin nombre"
      results.push({
        type: "inventario",
        id: item.id,
        title: `${sku} - ${nombre}`,
        subtitle: `${item.cantidadRecibida} unidades en ${item.bodegaInicial}`,
        url: `/inventario-recibido?highlight=${item.id}`,
      })
    })

    // Buscar en Proveedores
    const proveedores = await db.proveedor.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: query, mode: "insensitive" } },
          { contactoPrincipal: { contains: query, mode: "insensitive" } },
          { telefono: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        nombre: true,
        contactoPrincipal: true,
        telefono: true,
        email: true,
      },
    })

    proveedores.forEach(proveedor => {
      results.push({
        type: "proveedor",
        id: proveedor.id,
        title: proveedor.nombre,
        subtitle: `${proveedor.contactoPrincipal || ""} ${proveedor.telefono || ""}`.trim(),
        url: `/configuracion?tab=proveedores&highlight=${proveedor.id}`,
      })
    })

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
      query,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
