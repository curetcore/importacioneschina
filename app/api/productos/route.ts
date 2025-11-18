import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

/**
 * GET /api/productos
 * Obtener todos los productos con datos consolidados de inventario
 */
export async function GET() {
  try {
    const prisma = await getPrismaClient()

    // 1. Obtener todos los items con sus inventarios y OCs
    const items = await prisma.oCChinaItem.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        inventarioRecibido: {
          where: {
            deletedAt: null,
          },
          select: {
            cantidadRecibida: true,
            costoUnitarioFinalRD: true,
          },
        },
      },
    })

    // 2. Agrupar por SKU y calcular datos agregados
    const productosMap = new Map<
      string,
      {
        sku: string
        nombre: string
        cantidadTotal: number
        tallas: Map<string, number>
        costoPromedioCompra: number
        costoTotalCompra: number
        totalCostosPonderados: number
      }
    >()

    for (const item of items) {
      const key = item.sku

      if (!productosMap.has(key)) {
        productosMap.set(key, {
          sku: item.sku,
          nombre: item.nombre,
          cantidadTotal: 0,
          tallas: new Map(),
          costoPromedioCompra: 0,
          costoTotalCompra: 0,
          totalCostosPonderados: 0,
        })
      }

      const producto = productosMap.get(key)!

      // Procesar inventarios recibidos de este item
      for (const inv of item.inventarioRecibido) {
        producto.cantidadTotal += inv.cantidadRecibida

        // Acumular costos ponderados
        const costo = inv.costoUnitarioFinalRD ? parseFloat(inv.costoUnitarioFinalRD.toString()) : 0
        producto.totalCostosPonderados += costo * inv.cantidadRecibida
      }

      // Procesar tallas desde tallaDistribucion
      if (item.tallaDistribucion && typeof item.tallaDistribucion === "object") {
        const tallasObj = item.tallaDistribucion as Record<string, number>
        for (const [talla, cantidad] of Object.entries(tallasObj)) {
          const cantidadActual = producto.tallas.get(talla) || 0
          producto.tallas.set(talla, cantidadActual + cantidad)
        }
      }
    }

    // 3. Calcular promedios y convertir a array
    const productosData = Array.from(productosMap.values()).map(producto => {
      const costoPromedioCompra =
        producto.cantidadTotal > 0 ? producto.totalCostosPonderados / producto.cantidadTotal : 0
      const costoTotalCompra = producto.totalCostosPonderados

      return {
        sku: producto.sku,
        nombre: producto.nombre,
        cantidadTotal: producto.cantidadTotal,
        tallas: Array.from(producto.tallas.entries())
          .sort((a, b) => {
            // Ordenar tallas numéricamente
            const numA = parseFloat(a[0])
            const numB = parseFloat(b[0])
            return numA - numB
          })
          .map(([talla, cantidad]) => ({ talla, cantidad })),
        costoPromedioCompra,
        costoTotalCompra,
      }
    })

    // 4. Obtener productos existentes con precio de venta
    const productosDB = await prisma.producto.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        sku: true,
        precioVenta: true,
      },
    })

    const preciosVentaMap = new Map(
      productosDB.map(p => [p.sku, p.precioVenta ? parseFloat(p.precioVenta.toString()) : null])
    )

    // 5. Combinar datos de inventario con precios de venta
    const productosCompletos = productosData.map(producto => {
      const precioVenta = preciosVentaMap.get(producto.sku) || null

      // Calcular ganancia si hay precio de venta
      let gananciaPorUnidad = null
      let gananciaPorcentaje = null
      let gananciaTotalEstimada = null

      if (precioVenta && producto.costoPromedioCompra > 0) {
        gananciaPorUnidad = precioVenta - producto.costoPromedioCompra
        gananciaPorcentaje = (gananciaPorUnidad / producto.costoPromedioCompra) * 100
        gananciaTotalEstimada = gananciaPorUnidad * producto.cantidadTotal
      }

      return {
        sku: producto.sku,
        nombre: producto.nombre,
        cantidadTotal: producto.cantidadTotal,
        numeroTallas: producto.tallas.length,
        tallas: producto.tallas,
        costoPromedioCompra: producto.costoPromedioCompra,
        costoTotalCompra: producto.costoTotalCompra,
        precioVenta,
        gananciaPorUnidad,
        gananciaPorcentaje,
        gananciaTotalEstimada,
      }
    })

    // 6. Filtrar solo productos con inventario
    const productosConInventario = productosCompletos.filter(p => p.cantidadTotal > 0)

    // 7. Ordenar por SKU
    productosConInventario.sort((a, b) => a.sku.localeCompare(b.sku))

    return NextResponse.json({
      success: true,
      data: productosConInventario,
      total: productosConInventario.length,
    })
  } catch (error) {
    console.error("Error fetching productos:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener productos",
      },
      { status: 500 }
    )
  }
}
