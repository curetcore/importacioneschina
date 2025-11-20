import { NextRequest, NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/db-helpers"
import { inventarioRecibidoSchema } from "@/lib/validations"
import { calcularCostosCompletos } from "@/lib/calculations"
import { generateUniqueId } from "@/lib/id-generator"
import { Prisma } from "@prisma/client"
import { withRateLimit, RateLimits } from "@/lib/rate-limit"
import { notDeletedFilter } from "@/lib/db-helpers"
import { auditCreate } from "@/lib/audit-logger"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { QueryCache, CacheInvalidator } from "@/lib/cache-helpers"
import { CacheTTL } from "@/lib/redis"
import { triggerRecordCreated, CHANNELS } from "@/lib/pusher-events"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

// GET /api/inventario-recibido - Obtener todos los inventarios
export async function GET(request: NextRequest) {
  // Rate limiting para queries (60 req/min)
  const rateLimitError = await withRateLimit(request, RateLimits.query)
  if (rateLimitError) return rateLimitError

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const requestedLimit = parseInt(searchParams.get("limit") || "20")
    // Validación de límite máximo para prevenir ataques de denegación de servicio
    const limit = Math.min(requestedLimit, 100) // Máximo 100 registros por página
    const search = searchParams.get("search") || ""
    const ocId = searchParams.get("ocId") || ""
    const bodega = searchParams.get("bodega") || ""

    const skip = (page - 1) * limit

    // Cache key incluye parámetros de búsqueda para diferentes caches
    const cacheKey = `inventario:list:${page}:${limit}:${search}:${ocId}:${bodega}`

    const result = await QueryCache.list(
      cacheKey,
      async () => {
        const db = await getPrismaClient()

        const where: Prisma.InventarioRecibidoWhereInput = {
          ...notDeletedFilter,
          ...(search && {
            idRecepcion: {
              contains: search,
              mode: "insensitive",
            },
          }),
          ...(ocId && {
            ocId: ocId,
          }),
          ...(bodega && {
            bodegaInicial: bodega,
          }),
        }

        const [inventarios, total] = await Promise.all([
          db.inventarioRecibido.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
              fechaLlegada: "desc",
            },
            include: {
              ocChina: {
                select: {
                  oc: true,
                  proveedor: true,
                },
              },
              item: true,
            },
          }),
          db.inventarioRecibido.count({ where }),
        ])

        return {
          inventarios,
          pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
            limit,
          },
        }
      },
      CacheTTL.LISTINGS
    )

    return NextResponse.json({
      success: true,
      data: result.inventarios,
      pagination: result.pagination,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/inventario-recibido - Crear nueva recepción
export async function POST(request: NextRequest) {
  // Rate limiting para mutations (20 req/10s)
  const rateLimitError = await withRateLimit(request, RateLimits.mutation)
  if (rateLimitError) return rateLimitError

  try {
    const db = await getPrismaClient()
    const body = await request.json()

    // Generar ID automático secuencial (thread-safe)
    const idRecepcion = await generateUniqueId("inventarioRecibido", "idRecepcion", "REC")

    // Validar con Zod (sin necesidad de idRecepcion en el body)
    const validatedData = inventarioRecibidoSchema.parse(body)

    // Verificar que la OC existe y cargar todos los datos necesarios
    const oc = await db.oCChina.findUnique({
      where: { id: validatedData.ocId },
      include: {
        items: true,
        pagosChina: true,
        gastosLogisticos: {
          include: {
            gasto: true,
          },
        },
      },
    })

    if (!oc) {
      throw Errors.notFound("Orden de compra", validatedData.ocId)
    }

    // Validar que hay items en la OC
    if (!oc.items || oc.items.length === 0) {
      throw Errors.badRequest("La OC no tiene productos registrados")
    }

    // Si se especificó un itemId, validar que existe y sobre-recepción (Problema #5)
    if (validatedData.itemId) {
      const item = oc.items.find(i => i.id === validatedData.itemId)
      if (!item) {
        throw Errors.badRequest("El producto especificado no pertenece a esta OC")
      }

      // Validar sobre-recepción
      const cantidadYaRecibida = await db.inventarioRecibido.aggregate({
        where: {
          ocId: validatedData.ocId,
          itemId: validatedData.itemId,
        },
        _sum: {
          cantidadRecibida: true,
        },
      })

      const totalRecibido =
        (cantidadYaRecibida._sum.cantidadRecibida || 0) + validatedData.cantidadRecibida

      // Bloquear sobre-recepción
      if (totalRecibido > item.cantidadTotal) {
        throw Errors.badRequest(
          `Sobre-recepción detectada: ${item.nombre} (SKU: ${item.sku}). ` +
            `Ordenado: ${item.cantidadTotal}, Ya recibido: ${cantidadYaRecibida._sum.cantidadRecibida || 0}, ` +
            `Intentando recibir: ${validatedData.cantidadRecibida}, Total: ${totalRecibido}`
        )
      }

      // Warning si está cerca del límite (> 95%)
      if (totalRecibido > item.cantidadTotal * 0.95) {
        console.warn(
          `⚠️ Recepción cerca del límite: ${item.sku} - ${totalRecibido}/${item.cantidadTotal}`
        )
      }
    }

    // NUEVO: Calcular costos COMPLETOS usando el sistema profesional de distribución
    // que incluye FOB + pagos + gastos + comisiones (consistente con análisis-costos)
    // Transform gastosLogisticos from junction table to flat gasto objects
    const gastosTransformed =
      oc.gastosLogisticos?.map(gl => gl.gasto).filter(g => g.deletedAt === null) || []
    const itemsConCostos = calcularCostosCompletos(oc.items, oc.pagosChina, gastosTransformed)

    let costoUnitarioFinalRD: number
    let costoTotalRecepcionRD: number

    if (validatedData.itemId) {
      // Caso 1: Se especificó un producto - usar su costo exacto
      const itemConCosto = itemsConCostos.find(item => item.id === validatedData.itemId)

      if (!itemConCosto) {
        throw Errors.internal("No se pudo calcular el costo del producto")
      }

      costoUnitarioFinalRD = itemConCosto.costoUnitarioRD
      costoTotalRecepcionRD = costoUnitarioFinalRD * validatedData.cantidadRecibida

      console.info(`✅ Costo calculado para ${itemConCosto.sku}:`, {
        costoUnitario: costoUnitarioFinalRD,
        desglose: {
          fob: itemConCosto.costoFOBRD,
          pagos: itemConCosto.pagosDistribuidosRD,
          gastos: itemConCosto.gastosDistribuidosRD,
          comisiones: itemConCosto.comisionesDistribuidasRD,
        },
        metodosUsados: itemConCosto.metodosUsados,
      })
    } else {
      // Caso 2: No se especificó producto - calcular promedio ponderado de todos los items
      // (Para compatibilidad con recepciones antiguas o de lotes mixtos)
      const totalUnidades = itemsConCostos.reduce((sum, item) => sum + item.cantidadTotal, 0)
      const totalCosto = itemsConCostos.reduce((sum, item) => sum + item.costoTotalRD, 0)

      costoUnitarioFinalRD = totalUnidades > 0 ? totalCosto / totalUnidades : 0
      costoTotalRecepcionRD = costoUnitarioFinalRD * validatedData.cantidadRecibida

      console.info(`✅ Costo promedio calculado para OC ${oc.oc}:`, {
        costoUnitarioPromedio: costoUnitarioFinalRD,
        totalUnidades,
        totalCosto,
      })
    }

    // Crear la recepción con los costos calculados
    const nuevaRecepcion = await db.inventarioRecibido.create({
      data: {
        idRecepcion,
        ocId: validatedData.ocId,
        itemId: validatedData.itemId || null,
        fechaLlegada: validatedData.fechaLlegada,
        bodegaInicial: validatedData.bodegaInicial,
        cantidadRecibida: validatedData.cantidadRecibida,
        costoUnitarioFinalRD: new Prisma.Decimal(costoUnitarioFinalRD),
        costoTotalRecepcionRD: new Prisma.Decimal(costoTotalRecepcionRD),
        notas: validatedData.notas,
      },
      include: {
        ocChina: {
          select: {
            oc: true,
            proveedor: true,
          },
        },
        item: true,
      },
    })

    // Audit log
    await auditCreate("InventarioRecibido", nuevaRecepcion as any, request)

    // Invalidar cache
    await CacheInvalidator.invalidateInventario(validatedData.ocId)

    // Trigger real-time event (fail-safe, won't block if Pusher is down)
    await triggerRecordCreated(CHANNELS.INVENTORY, nuevaRecepcion)

    return NextResponse.json(
      {
        success: true,
        data: nuevaRecepcion,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
