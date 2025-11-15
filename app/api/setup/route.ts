import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Endpoint para ejecutar setup inicial de la base de datos
// Solo usar UNA VEZ despuÃÂ©s del primer deploy
export async function GET() {
  try {
    const logs: string[] = [];

    // 1. Generar cliente Prisma
    logs.push("Ã°ÂÂÂ§ Generando cliente Prisma...");
    try {
      const { stdout: generateOut } = await execAsync("npx prisma generate");
      logs.push("Ã¢ÂÂ Cliente Prisma generado");
      logs.push(generateOut);
    } catch (error: any) {
      logs.push("Ã¢ÂÂ Error generando cliente Prisma");
      logs.push(error.message);
    }

    // 2. Crear tablas con db push
    logs.push("\nÃ°ÂÂÂÃ¯Â¸Â  Creando tablas en la base de datos...");
    try {
      const { stdout: pushOut } = await execAsync("npx prisma db push --accept-data-loss");
      logs.push("Ã¢ÂÂ Tablas creadas exitosamente");
      logs.push(pushOut);
    } catch (error: any) {
      logs.push("Ã¢ÂÂ Error creando tablas");
      logs.push(error.message);
      throw error; // Si falla aquÃÂ­, no continuar
    }

    // 3. Ejecutar seed
    logs.push("\nÃ°ÂÂÂ± Poblando base de datos con datos de prueba...");
    try {
      const { stdout: seedOut } = await execAsync("npm run db:seed");
      logs.push("Ã¢ÂÂ Datos de prueba insertados");
      logs.push(seedOut);
    } catch (error: any) {
      logs.push("Ã¢ÂÂ Error ejecutando seed");
      logs.push(error.message);
    }

    logs.push("\nÃ°ÂÂÂ ÃÂ¡Setup completado exitosamente!");
    logs.push("\nÃ°ÂÂÂ Datos creados:");
    logs.push("   - 10 ÃÂrdenes de Compra");
    logs.push("   - 20 Pagos");
    logs.push("   - ~25 Gastos LogÃÂ­sticos");
    logs.push("   - 10 Recepciones de Inventario");
    logs.push("\nÃ¢ÂÂ Tu aplicaciÃÂ³n estÃÂ¡ lista para usar!");
    logs.push("Ã°ÂÂÂ  Ve al Dashboard: /dashboard");

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
