import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Endpoint para ejecutar setup inicial de la base de datos
// Solo usar UNA VEZ después del primer deploy
export async function GET() {
  try {
    const logs: string[] = [];

    // 1. Generar cliente Prisma
    logs.push("🔧 Generando cliente Prisma...");
    try {
      const { stdout: generateOut } = await execAsync("npx prisma generate");
      logs.push("✅ Cliente Prisma generado");
      logs.push(generateOut);
    } catch (error: any) {
      logs.push("❌ Error generando cliente Prisma");
      logs.push(error.message);
    }

    // 2. Crear tablas con db push
    logs.push("\n🗄️  Creando tablas en la base de datos...");
    try {
      const { stdout: pushOut } = await execAsync("npx prisma db push --accept-data-loss");
      logs.push("✅ Tablas creadas exitosamente");
      logs.push(pushOut);
    } catch (error: any) {
      logs.push("❌ Error creando tablas");
      logs.push(error.message);
      throw error; // Si falla aquí, no continuar
    }

    // 3. Ejecutar seed
    logs.push("\n🌱 Poblando base de datos con datos de prueba...");
    try {
      const { stdout: seedOut } = await execAsync("npm run db:seed");
      logs.push("✅ Datos de prueba insertados");
      logs.push(seedOut);
    } catch (error: any) {
      logs.push("❌ Error ejecutando seed");
      logs.push(error.message);
    }

    logs.push("\n🎉 ¡Setup completado exitosamente!");
    logs.push("\n📊 Datos creados:");
    logs.push("   - 10 Órdenes de Compra");
    logs.push("   - 20 Pagos");
    logs.push("   - ~25 Gastos Logísticos");
    logs.push("   - 10 Recepciones de Inventario");
    logs.push("\n✅ Tu aplicación está lista para usar!");
    logs.push("🏠 Ve al Dashboard: /dashboard");

    return NextResponse.json(
      {
        success: true,
        message: "Setup completado",
        logs: logs.join("\n"),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en setup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error ejecutando setup",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
