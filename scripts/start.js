#!/usr/bin/env node

const { execSync } = require("child_process")

console.log("🚀 Iniciando aplicación...\n")

// Función para ejecutar comandos y mostrar output
function runCommand(command, description) {
  console.log(`\n📦 ${description}...`)
  try {
    execSync(command, { stdio: "inherit" })
    console.log(`✅ ${description} completado\n`)
    return true
  } catch (error) {
    console.error(`❌ Error en: ${description}`)
    console.error(error.message)
    return false
  }
}

// 1. Aplicar migraciones
const migrateSuccess = runCommand(
  "npx prisma migrate deploy",
  "Aplicando migraciones de base de datos"
)

if (!migrateSuccess) {
  console.error("\n⚠️  Las migraciones fallaron, pero continuaremos...")
}

// 2. Cargar configuraciones (solo si la tabla está vacía)
const seedSuccess = runCommand(
  "npx tsx prisma/seed-config.ts",
  "Cargando configuraciones iniciales"
)

if (!seedSuccess) {
  console.error("\n⚠️  La carga de configuraciones falló, pero continuaremos...")
}

// 3. Iniciar el servidor Next.js
console.log("\n🌟 Iniciando servidor Next.js...\n")
try {
  execSync("npm run start:server", { stdio: "inherit" })
} catch (error) {
  console.error("\n❌ Error al iniciar el servidor")
  process.exit(1)
}
