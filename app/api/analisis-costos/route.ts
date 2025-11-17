import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import {
  distributeCost,
  ProductDistributionData,
  DistributionMethod,
} from "@/lib/cost-distribution"
import { calcularTasaCambioPromedio } from "@/lib/calculations"
import { handleApiError } from "@/lib/api-error-handler"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const db = await getPrismaClient()
    const { searchParams } = new URL(request.url)
    const ocId = searchParams.get("ocId")

    // 1. Fetch distribution configuration
    const distribConfig = await db.configuracionDistribucionCostos.findMany({
      where: { activo: true },
    })

    // Create a map of cost type -> distribution method
    const distribMap = new Map<string, DistributionMethod>()
    distribConfig.forEach(config => {
      distribMap.set(config.tipoCosto, config.metodoDistribucion as DistributionMethod)
    })

    // Default methods if not configured
    const getDistribMethod = (costType: string): DistributionMethod => {
      return distribMap.get(costType) || "unidades"
    }

    // 2. Fetch all ACTIVE inventory with items (exclude soft-deleted)
    const inventarios = await db.inventarioRecibido.findMany({
      where: {
        ...(ocId ? { ocId } : {}),
        deletedAt: null, // Only active inventory
        ocChina: {
          deletedAt: null, // Only from active OCs
        },
      },
      include: {
        ocChina: {
          include: {
            items: {
              where: {
                deletedAt: null, // Only active items
              },
            },
            pagosChina: {
              where: {
                deletedAt: null, // Only active payments
              },
            },
          },
        },
        item: true,
      },
      orderBy: {
        fechaLlegada: "desc",
      },
    })

    // 2b. Fetch all gastos with their associated OCs (many-to-many relationship)
    const gastosWithOCs = await db.gastosLogisticos.findMany({
      where: {
        deletedAt: null, // Only active expenses
        ordenesCompra: {
          some: {
            ocChina: {
              deletedAt: null, // Only from active OCs
              ...(ocId ? { id: ocId } : {}), // Filter by OC if specified
            },
          },
        },
      },
      include: {
        ordenesCompra: {
          include: {
            ocChina: true,
          },
        },
      },
    })

    // 3. Calculate proportional gasto distribution across OCs
    // When a gasto is associated with multiple OCs, its cost is distributed proportionally
    const gastosPorOC = new Map<string, number>()

    gastosWithOCs.forEach(gasto => {
      const numOCs = gasto.ordenesCompra.length

      if (numOCs === 0) {
        console.warn(`⚠️ Gasto ${gasto.id} no tiene OCs asociadas`)
        return
      }

      // Distribute the gasto cost equally across all associated OCs
      const costoPorOC = parseFloat(gasto.montoRD.toString()) / numOCs

      gasto.ordenesCompra.forEach(junction => {
        const currentTotal = gastosPorOC.get(junction.ocId) || 0
        gastosPorOC.set(junction.ocId, currentTotal + costoPorOC)
      })
    })

    // 4. Group inventory by OC for cost distribution
    const inventariosPorOC = new Map<string, typeof inventarios>()
    inventarios.forEach(inv => {
      if (!inventariosPorOC.has(inv.ocId)) {
        inventariosPorOC.set(inv.ocId, [])
      }
      inventariosPorOC.get(inv.ocId)?.push(inv)
    })

    // 5. Calculate cost breakdown for each product
    const analisis = inventarios
      .map(inv => {
        const item = inv.item
        if (!item) {
          return null // Skip if no linked item
        }

        // Get all items from this OC for distribution calculation
        // Note: Using all items, not filtering by deletedAt (field doesn't exist in current schema)
        const itemsDeOC = inv.ocChina.items

        // Prepare product data for distribution
        const productsForDistribution: ProductDistributionData[] = itemsDeOC.map(ocItem => ({
          id: ocItem.id,
          cantidad: ocItem.cantidadTotal,
          pesoUnitarioKg: ocItem.pesoUnitarioKg
            ? parseFloat(ocItem.pesoUnitarioKg.toString())
            : null,
          volumenUnitarioCBM: ocItem.volumenUnitarioCBM
            ? parseFloat(ocItem.volumenUnitarioCBM.toString())
            : null,
          precioUnitarioUSD: parseFloat(ocItem.precioUnitarioUSD.toString()),
        }))

        // Calculate weighted average exchange rate from payments
        const tasaPromedio = calcularTasaCambioPromedio(inv.ocChina.pagosChina) || 58

        // FOB cost
        const costoFobUsd = parseFloat(item.precioUnitarioUSD.toString())
        const costoFobRD = costoFobUsd * tasaPromedio

        // Total costs from this OC
        const totalPagosOC = inv.ocChina.pagosChina.reduce(
          (sum, pago) => sum + parseFloat(pago.montoRDNeto?.toString() || "0"),
          0
        )
        // Get the proportionally distributed gasto total for this OC
        const totalGastosOC = gastosPorOC.get(inv.ocId) || 0
        const totalComisionesOC = inv.ocChina.pagosChina.reduce(
          (sum, pago) => sum + parseFloat(pago.comisionBancoRD.toString()),
          0
        )

        // IMPORTANT: Los pagos NO se distribuyen - se asignan directamente por valor FOB
        // porque el costo FOB ya define exactamente cuánto cuesta cada producto
        // Solo los gastos logísticos y comisiones necesitan distribución
        const gastosMethod = getDistribMethod("gastos_flete") // Using flete as default for gastos
        const comisionesMethod = getDistribMethod("comisiones")

        // Log distribution context for debugging
        console.info(`📊 Distribuyendo costos para OC ${inv.ocChina.oc}:`, {
          totalPagos: totalPagosOC,
          totalGastos: totalGastosOC,
          totalComisiones: totalComisionesOC,
          productos: productsForDistribution.length,
          metodoGastos: gastosMethod,
          metodoComisiones: comisionesMethod,
        })

        // Pagos: Asignación directa por valor FOB (NO distribución)
        // Cada producto recibe exactamente: (su valor FOB / total FOB) × total pagos
        const totalFOBValue = productsForDistribution.reduce(
          (sum, p) => sum + p.precioUnitarioUSD * p.cantidad,
          0
        )
        const pagosDistribution = productsForDistribution.map(product => {
          const productFOBValue = product.precioUnitarioUSD * product.cantidad
          const porcentaje = totalFOBValue > 0 ? productFOBValue / totalFOBValue : 0
          const costoDistribuido = totalPagosOC * porcentaje
          const costoUnitario = product.cantidad > 0 ? costoDistribuido / product.cantidad : 0

          return {
            productId: product.id,
            porcentaje,
            costoDistribuido,
            costoUnitario,
          }
        })

        // Gastos y comisiones: Distribución configurable
        const gastosDistribution = distributeCost(
          productsForDistribution,
          totalGastosOC,
          gastosMethod,
          tasaPromedio
        )
        const comisionesDistribution = distributeCost(
          productsForDistribution,
          totalComisionesOC,
          comisionesMethod,
          tasaPromedio
        )

        // Find this product's distributed costs
        // BUG FIX: Use item.id which matches the IDs in productsForDistribution
        const pagosDist = pagosDistribution.find(d => d.productId === item.id)
        const gastosDist = gastosDistribution.find(d => d.productId === item.id)
        const comisionesDist = comisionesDistribution.find(d => d.productId === item.id)

        // Debug logging if distribution not found
        if (!pagosDist || !gastosDist || !comisionesDist) {
          console.warn(`⚠️ Distribución no encontrada para producto ${item.id} (${item.sku})`, {
            itemId: item.id,
            productsInDistribution: productsForDistribution.map(p => p.id),
            foundPagos: !!pagosDist,
            foundGastos: !!gastosDist,
            foundComisiones: !!comisionesDist,
          })
        }

        const pagosUnitario = pagosDist?.costoUnitario || 0
        const gastosUnitario = gastosDist?.costoUnitario || 0
        const comisionesUnitario = comisionesDist?.costoUnitario || 0

        // Calculate final cost
        const costoFinalCalculado = costoFobRD + pagosUnitario + gastosUnitario + comisionesUnitario
        const costoFinalReal = inv.costoUnitarioFinalRD
          ? parseFloat(inv.costoUnitarioFinalRD.toString())
          : costoFinalCalculado

        return {
          id: inv.id,
          idRecepcion: inv.idRecepcion,
          sku: item.sku,
          nombre: item.nombre,
          oc: inv.ocChina.oc,
          proveedor: inv.ocChina.proveedor,
          cantidad: inv.cantidadRecibida,
          bodega: inv.bodegaInicial,
          fechaLlegada: inv.fechaLlegada,

          // Cost breakdown (per unit)
          desglose: {
            costoFobUsd,
            tasaCambio: tasaPromedio,
            costoFobRD,
            pagos: pagosUnitario,
            gastos: gastosUnitario,
            comisiones: comisionesUnitario,
            // Add distribution methods used for transparency
            // Pagos siempre por valor FOB (asignación directa, no distribución)
            metodoPagos: "valor_fob" as const,
            metodoGastos: gastosMethod,
            metodoComisiones: comisionesMethod,
          },

          // Totals
          costoFinalUnitario: costoFinalReal,
          costoTotalRecepcion: costoFinalReal * inv.cantidadRecibida,
        }
      })
      .filter(Boolean) // Remove nulls

    // Calcular totales generales
    const totales = {
      totalProductos: analisis.length,
      totalUnidades: analisis.reduce((sum, a) => sum + (a?.cantidad || 0), 0),
      inversionTotal: analisis.reduce((sum, a) => sum + (a?.costoTotalRecepcion || 0), 0),
      costoPromedioUnitario:
        analisis.length > 0
          ? analisis.reduce((sum, a) => sum + (a?.costoFinalUnitario || 0), 0) / analisis.length
          : 0,
    }

    return NextResponse.json({
      success: true,
      data: analisis,
      totales,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
