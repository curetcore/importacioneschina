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
            gastosLogisticos: {
              where: {
                deletedAt: null, // Only active expenses
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

    // 3. Group inventory by OC for cost distribution
    const inventariosPorOC = new Map<string, typeof inventarios>()
    inventarios.forEach(inv => {
      if (!inventariosPorOC.has(inv.ocId)) {
        inventariosPorOC.set(inv.ocId, [])
      }
      inventariosPorOC.get(inv.ocId)?.push(inv)
    })

    // 4. Calculate cost breakdown for each product
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
        const totalGastosOC = inv.ocChina.gastosLogisticos.reduce(
          (sum, gasto) => sum + parseFloat(gasto.montoRD.toString()),
          0
        )
        const totalComisionesOC = inv.ocChina.pagosChina.reduce(
          (sum, pago) => sum + parseFloat(pago.comisionBancoRD.toString()),
          0
        )

        // Distribute costs using configured methods with intelligent fallback
        const pagosMethod = getDistribMethod("pagos")
        const gastosMethod = getDistribMethod("gastos_flete") // Using flete as default for gastos
        const comisionesMethod = getDistribMethod("comisiones")

        // Log distribution context for debugging
        console.info(`📊 Distribuyendo costos para OC ${inv.ocChina.oc}:`, {
          totalPagos: totalPagosOC,
          totalGastos: totalGastosOC,
          totalComisiones: totalComisionesOC,
          productos: productsForDistribution.length,
          metodoPagos: pagosMethod,
          metodoGastos: gastosMethod,
          metodoComisiones: comisionesMethod,
        })

        const pagosDistribution = distributeCost(
          productsForDistribution,
          totalPagosOC,
          pagosMethod,
          tasaPromedio
        )
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
            metodoPagos: pagosMethod,
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
