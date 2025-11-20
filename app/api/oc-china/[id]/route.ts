import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { TallaDistribucion } from "@/lib/calculations"
import type { InputJsonValue } from "@prisma/client/runtime/library"
import { getPrismaClient } from "@/lib/db-helpers"
import { auditUpdate, auditDelete } from "@/lib/audit-logger"
import { handleApiError, Errors } from "@/lib/api-error-handler"
import { triggerRecordUpdated, triggerRecordDeleted, CHANNELS } from "@/lib/pusher-events"

// Force dynamic rendering - this route uses headers() for auth and rate limiting
export const dynamic = "force-dynamic"

interface OCItemInput {
  sku: string
  nombre: string
  material?: string | null
  color?: string | null
  especificaciones?: string | null
  tallaDistribucion?: TallaDistribucion | null
  cantidadTotal: number | string
  precioUnitarioUSD: number | string
}

interface OCItemValidado {
  sku: string
  nombre: string
  material: string | null
  color: string | null
  especificaciones: string | null
  tallaDistribucion?: InputJsonValue
  cantidadTotal: number
  precioUnitarioUSD: number
  subtotalUSD: number
}

// Función de validación para tallaDistribucion
function validarTallaDistribucion(tallas: unknown): InputJsonValue | undefined {
  if (!tallas) return undefined

  // Validar que sea un objeto
  if (typeof tallas !== "object" || Array.isArray(tallas)) {
    console.warn("⚠️ tallaDistribucion inválida: no es un objeto")
    return undefined
  }

  // Validar que todos los valores sean números positivos
  const tallasObj = tallas as Record<string, unknown>
  const tallasValidadas: TallaDistribucion = {}

  for (const [talla, cantidad] of Object.entries(tallasObj)) {
    const cantidadNum = typeof cantidad === "number" ? cantidad : parseInt(String(cantidad))

    if (isNaN(cantidadNum) || cantidadNum < 0) {
      console.warn(`⚠️ tallaDistribucion[${talla}] inválida: ${cantidad}`)
      continue // Saltar tallas inválidas
    }

    tallasValidadas[talla] = cantidadNum
  }

  return Object.keys(tallasValidadas).length > 0 ? tallasValidadas : undefined
}

// GET /api/oc-china/[id] - Obtener una orden de compra específica
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Obtener el cliente Prisma apropiado (demo o producción)
    const db = await getPrismaClient()

    const oc = await db.oCChina.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        items: {
          orderBy: {
            sku: "asc",
          },
        },
        pagosChina: {
          where: { deletedAt: null },
        },
        gastosLogisticos: {
          where: {
            gasto: {
              deletedAt: null,
            },
          },
          include: {
            gasto: true,
          },
        },
        inventarioRecibido: {
          where: { deletedAt: null },
          include: {
            item: true,
          },
        },
        _count: {
          select: {
            items: true,
            pagosChina: {
              where: { deletedAt: null },
            },
            gastosLogisticos: true,
            inventarioRecibido: {
              where: { deletedAt: null },
            },
          },
        },
      },
    })

    if (!oc) {
      throw Errors.notFound("Orden de compra", id)
    }

    // Transform gastosLogisticos to include ordenesCompra array
    const transformedOC = {
      ...oc,
      gastosLogisticos: await Promise.all(
        oc.gastosLogisticos.map(async gl => {
          // For each gasto, fetch all associated OCs (excluding deleted ones)
          const allOCsForGasto = await db.gastoLogisticoOC.findMany({
            where: {
              gastoId: gl.gasto.id,
              ocChina: {
                deletedAt: null,
              },
            },
            include: {
              ocChina: {
                select: {
                  id: true,
                  oc: true,
                  proveedor: true,
                },
              },
            },
          })

          return {
            ...gl.gasto,
            ordenesCompra: allOCsForGasto,
          }
        })
      ),
    }

    return NextResponse.json({
      success: true,
      data: transformedOC,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/oc-china/[id] - Actualizar una orden de compra
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    // DEBUG: Ver todos los campos que está enviando el frontend
    console.log("🔍 BODY KEYS:", Object.keys(body))
    console.log("🔍 BODY COMPLETO:", JSON.stringify(body, null, 2))

    const { oc, proveedor, fechaOC, descripcionLote, categoriaPrincipal, items, adjuntos } = body

    // Obtener el cliente Prisma apropiado (demo o producción)
    const db = await getPrismaClient()

    // Verificar que la OC existe
    const existing = await db.oCChina.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden de compra no encontrada",
        },
        { status: 404 }
      )
    }

    // Validaciones básicas
    if (!oc || !proveedor || !fechaOC || !categoriaPrincipal) {
      return NextResponse.json(
        {
          success: false,
          error: "Faltan campos requeridos",
        },
        { status: 400 }
      )
    }

    // Validar que haya al menos un item
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Debe agregar al menos un producto a la orden",
        },
        { status: 400 }
      )
    }

    // Si se está cambiando el código OC, verificar que no exista otro con ese código
    if (oc !== existing.oc) {
      const duplicate = await db.oCChina.findUnique({
        where: { oc },
      })

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: "Ya existe una OC con ese código",
          },
          { status: 400 }
        )
      }
    }

    // Validar y normalizar cada item (Problemas #1 y #2)
    const itemsValidados: OCItemValidado[] = []
    for (const item of items) {
      // Validaciones básicas
      if (!item.sku || !item.nombre) {
        return NextResponse.json(
          {
            success: false,
            error: "Cada producto debe tener SKU y nombre",
          },
          { status: 400 }
        )
      }

      // Validar cantidadTotal
      const cantidad = parseInt(item.cantidadTotal)
      if (isNaN(cantidad) || cantidad <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Cantidad inválida para ${item.sku}. Debe ser un número entero mayor a 0`,
          },
          { status: 400 }
        )
      }

      // Validar precioUnitarioUSD
      const precio = parseFloat(item.precioUnitarioUSD)
      if (isNaN(precio) || precio <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Precio inválido para ${item.sku}. Debe ser un número mayor a 0`,
          },
          { status: 400 }
        )
      }

      // Calcular subtotal
      const subtotal = precio * cantidad

      // Validar overflow (máximo razonable: $999,999.99)
      if (subtotal > 999999.99) {
        return NextResponse.json(
          {
            success: false,
            error: `Subtotal excede límite máximo para ${item.sku}: $${subtotal.toFixed(2)}`,
          },
          { status: 400 }
        )
      }

      // Validar tallaDistribucion de manera segura (Problema #9)
      const tallasValidadas = validarTallaDistribucion(item.tallaDistribucion)

      itemsValidados.push({
        sku: item.sku,
        nombre: item.nombre,
        material: item.material || null,
        color: item.color || null,
        especificaciones: item.especificaciones || null,
        tallaDistribucion: tallasValidadas,
        cantidadTotal: cantidad,
        precioUnitarioUSD: precio,
        subtotalUSD: subtotal,
      })
    }

    // Guardar estado anterior para audit log
    const estadoAnterior = { ...existing }

    // Actualizar OC y reemplazar items en una transacción (Problema #3)
    const updatedOC = await db.$transaction(async tx => {
      // VALIDACIÓN: Verificar si hay inventario vinculado a items específicos
      const itemsConInventario = await tx.inventarioRecibido.findFirst({
        where: {
          ocId: id,
          itemId: { not: null },
        },
      })

      if (itemsConInventario) {
        throw new Error(
          "No se puede editar la OC porque tiene inventario recibido vinculado a productos específicos. " +
            "Debe eliminar las recepciones primero o crear una nueva OC."
        )
      }

      // Si no hay inventario vinculado, proceder con delete/create
      await tx.oCChinaItem.deleteMany({
        where: { ocId: id },
      })

      // Actualizar OC y crear nuevos items validados
      // IMPORTANTE: Usar objeto limpio sin new Date() que causa problemas con Prisma
      const updateData = {
        oc: String(oc),
        proveedor: String(proveedor),
        fechaOC: fechaOC, // Prisma acepta string ISO directamente
        descripcionLote: descripcionLote || null,
        categoriaPrincipal: String(categoriaPrincipal),
        adjuntos: adjuntos !== undefined ? adjuntos : existing.adjuntos,
      }

      return await tx.oCChina.update({
        where: { id },
        data: {
          ...updateData,
          items: {
            create: itemsValidados,
          },
        },
        include: {
          items: true,
        },
      })
    })

    // Audit log
    await auditUpdate("OCChina", estadoAnterior as any, updatedOC as any, request)

    // Trigger real-time event (fail-safe, won't block if Pusher is down)
    await triggerRecordUpdated(CHANNELS.ORDERS, updatedOC)

    return NextResponse.json({
      success: true,
      data: updatedOC,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/oc-china/[id] - Eliminar una orden de compra
// Query params:
//   - cascade=true: Eliminar todos los datos relacionados también
//   - preview=true: Solo mostrar qué se eliminará sin borrar
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const cascade = searchParams.get("cascade") === "true"
    const preview = searchParams.get("preview") === "true"

    // Obtener el cliente Prisma apropiado (demo o producción)
    const db = await getPrismaClient()

    // Verificar que la OC existe y obtener datos relacionados (solo NO eliminados)
    const existing = await db.oCChina.findUnique({
      where: { id },
      include: {
        pagosChina: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            idPago: true,
            montoRDNeto: true,
          },
        },
        gastosLogisticos: {
          include: {
            gasto: {
              select: {
                id: true,
                idGasto: true,
                montoRD: true,
                fechaGasto: true,
                tipoGasto: true,
                proveedorServicio: true,
                notas: true,
              },
            },
          },
        },
        inventarioRecibido: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            idRecepcion: true,
            cantidadRecibida: true,
          },
        },
        _count: {
          select: {
            items: true,
            pagosChina: {
              where: {
                deletedAt: null,
              },
            },
            gastosLogisticos: true,
            inventarioRecibido: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden de compra no encontrada",
        },
        { status: 404 }
      )
    }

    // Verificar que no tenga datos relacionados
    const hasRelatedData =
      existing._count.pagosChina > 0 ||
      existing._count.gastosLogisticos > 0 ||
      existing._count.inventarioRecibido > 0

    // Si es preview, devolver lo que se va a eliminar
    if (preview) {
      return NextResponse.json({
        success: true,
        data: {
          oc: existing.oc,
          hasRelatedData,
          counts: {
            items: existing._count.items,
            pagos: existing._count.pagosChina,
            gastos: existing._count.gastosLogisticos,
            inventario: existing._count.inventarioRecibido,
          },
          details: {
            pagos: existing.pagosChina.map(p => ({
              id: p.idPago,
              monto: parseFloat(p.montoRDNeto?.toString() || "0"),
            })),
            gastos: existing.gastosLogisticos.map(gl => ({
              id: gl.gasto.idGasto,
              monto: parseFloat(gl.gasto.montoRD.toString()),
            })),
            inventario: existing.inventarioRecibido.map(i => ({
              id: i.idRecepcion,
              cantidad: i.cantidadRecibida,
            })),
          },
        },
      })
    }

    // Si tiene datos relacionados y no se pidió cascade, rechazar
    if (hasRelatedData && !cascade) {
      return NextResponse.json(
        {
          success: false,
          error: "No se puede eliminar la OC porque tiene pagos, gastos o inventario asociado",
          counts: {
            pagos: existing._count.pagosChina,
            gastos: existing._count.gastosLogisticos,
            inventario: existing._count.inventarioRecibido,
          },
        },
        { status: 400 }
      )
    }

    // Guardar estado para audit log
    const estadoAnterior = { ...existing }

    // Si se pidió cascade, soft delete en cascada
    if (cascade && hasRelatedData) {
      const now = new Date()
      await db.$transaction(async tx => {
        // 1. Soft delete inventario recibido
        if (existing._count.inventarioRecibido > 0) {
          await tx.inventarioRecibido.updateMany({
            where: { ocId: id },
            data: { deletedAt: now },
          })
        }

        // 2. Delete gastosLogisticos relationships (junction table)
        // Note: We delete the junction table records, not the gastos themselves
        // as gastos may be shared with other OCs
        if (existing._count.gastosLogisticos > 0) {
          await tx.gastoLogisticoOC.deleteMany({
            where: { ocId: id },
          })
        }

        // 3. Soft delete pagos
        if (existing._count.pagosChina > 0) {
          await tx.pagosChina.updateMany({
            where: { ocId: id },
            data: { deletedAt: now },
          })
        }

        // 4. Soft delete la OC
        await tx.oCChina.update({
          where: { id },
          data: { deletedAt: now },
        })
      })
    } else {
      // Soft delete solo la OC (sin datos relacionados)
      const now = new Date()
      await db.oCChina.update({
        where: { id },
        data: { deletedAt: now },
      })
    }

    // Audit log
    await auditDelete("OCChina", estadoAnterior as any, request)

    // Trigger real-time event (fail-safe, won't block if Pusher is down)
    await triggerRecordDeleted(CHANNELS.ORDERS, { id: estadoAnterior.id, oc: estadoAnterior.oc })

    return NextResponse.json({
      success: true,
      message: cascade
        ? "Orden de compra y todos sus datos relacionados eliminados exitosamente"
        : "Orden de compra eliminada exitosamente",
    })
  } catch (error) {
    return handleApiError(error)
  }
}
