import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Endpoint para ejecutar setup inicial de la base de datos
// Solo usar UNA VEZ despuÃ©s del primer deploy
export async function GET() {
  try {
    const logs: string[] = [];

    // 1. Generar cliente Prisma
    logs.push("ð§ Generando cliente Prisma...");
    try {
      const { stdout: generateOut } = await execAsync("npx prisma generate");
      logs.push("â Cliente Prisma generado");
      logs.push(generateOut);
    } catch (error: any) {
      logs.push("â Error generando cliente Prisma");
      logs.push(error.message);
    }

    // 2. Crear tablas con db push
    logs.push("\nðï¸  Creando tablas en la base de datos...");
    try {
      const { stdout: pushOut } = await execAsync("npx prisma db push --accept-data-loss");
      logs.push("â Tablas creadas exitosamente");
      logs.push(pushOut);
    } catch (error: any) {
      logs.push("â Error creando tablas");
      logs.push(error.message);
      throw error; // Si falla aquÃ­, no continuar
    }

    // 3. Ejecutar seed
    logs.push("\nð± Poblando base de datos con datos de prueba...");
    try {
      const { stdout: seedOut } = await execAsync("npm run db:seed");
      logs.push("â Datos de prueba insertados");
      logs.push(seedOut);
    } catch (error: any) {
      logs.push("â Error ejecutando seed");
      logs.push(error.message);
    }

    logs.push("\nð Â¡Setup completado exitosamente!");
    logs.push("\nð Datos creados:");
    logs.push("   - 10 Ãrdenes de Compra");
    logs.push("   - 20 Pagos");
    logs.push("   - ~25 Gastos LogÃ­sticos");
    logs.push("   - 10 Recepciones de Inventario");
    logs.push("\nâ Tu aplicaciÃ³n estÃ¡ lista para usar!");
    logs.push("ð  Ve al Dashboard: /dashboard");

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
