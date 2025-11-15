import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pagosChinaSchema } from "@/lib/validations";
import { calcularMontoRD, calcularMontoRDNeto } from "@/lib/calculations";
import { generateNextId } from "@/lib/utils";
import { Prisma } from "@prisma/client";

// GET /api/pagos-china - Obtener todos los pagos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const ocId = searchParams.get("ocId") || "";
    const moneda = searchParams.get("moneda") || "";

    const skip = (page - 1) * limit;

    const where: Prisma.PagosChinaWhereInput = {
      ...(search && {
        idPago: {
          contains: search,
          mode: "insensitive",
        },
      }),
      ...(ocId && {
        ocId: ocId,
      }),
      ...(moneda && {
        moneda: moneda,
      }),
    };

    const [pagos, total] = await Promise.all([
      prisma.pagosChina.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          fechaPago: "desc",
        },
        include: {
          ocChina: {
            select: {
              oc: true,
              proveedor: true,
            },
          },
        },
      }),
      prisma.pagosChina.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: pagos,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/pagos-china:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener pagos",
      },
      { status: 500 }
    );
  }
}

// POST /api/pagos-china - Crear nuevo pago
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generar ID automático secuencial
    const lastPago = await prisma.pagosChina.findFirst({
      orderBy: { idPago: "desc" },
      select: { idPago: true },
    });
    const idPago = generateNextId("PAG", lastPago?.idPago);

    // Validar con Zod (sin necesidad de idPago en el body)
    const validatedData = pagosChinaSchema.parse(body);

    // Verificar que la OC existe
    const oc = await prisma.oCChina.findUnique({
      where: { id: validatedData.ocId },
    });

    if (!oc) {
      return NextResponse.json(
        {
          success: false,
          error: "La OC especificada no existe",
        },
        { status: 400 }
      );
    }

    // Calcular montoRD y montoRDNeto
    const montoRD = calcularMontoRD(
      validatedData.montoOriginal,
      validatedData.moneda,
      validatedData.tasaCambio
    );

    const montoRDNeto = calcularMontoRDNeto(
      montoRD,
      validatedData.comisionBancoRD
    );

    // Crear el pago
    const nuevoPago = await prisma.pagosChina.create({
      data: {
        idPago,
        ocId: validatedData.ocId,
        fechaPago: validatedData.fechaPago,
        tipoPago: validatedData.tipoPago,
        metodoPago: validatedData.metodoPago,
        moneda: validatedData.moneda,
        montoOriginal: new Prisma.Decimal(validatedData.montoOriginal),
        tasaCambio: new Prisma.Decimal(validatedData.tasaCambio),
        comisionBancoRD: new Prisma.Decimal(validatedData.comisionBancoRD),
        montoRD: new Prisma.Decimal(montoRD),
        montoRDNeto: new Prisma.Decimal(montoRDNeto),
        archivoComprobante: (validatedData as any).archivoComprobante || null,
      },
      include: {
        ocChina: {
          select: {
            oc: true,
            proveedor: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: nuevoPago,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/pagos-china:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Datos de validación incorrectos",
          details: error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Error al crear pago",
      },
      { status: 500 }
    );
  }
}
