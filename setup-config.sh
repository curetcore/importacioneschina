#!/bin/bash

echo "🚀 Configurando sistema de configuración dinámica..."
echo ""

# Paso 1: Migración de base de datos
echo "📊 Paso 1/2: Creando tabla en la base de datos..."
npx prisma migrate dev --name add_configuracion_table --skip-generate

if [ $? -ne 0 ]; then
    echo "❌ Error en la migración. Verifica que la base de datos esté corriendo."
    exit 1
fi

echo "✅ Tabla creada exitosamente"
echo ""

# Paso 2: Generar Prisma Client
echo "🔧 Generando Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Error generando Prisma Client."
    exit 1
fi

echo "✅ Prisma Client generado"
echo ""

# Paso 3: Cargar datos iniciales
echo "📦 Paso 2/2: Cargando configuraciones iniciales..."
npx tsx prisma/seed-config.ts

if [ $? -ne 0 ]; then
    echo "❌ Error cargando datos. ¿Está instalado tsx?"
    echo "   Intenta: npm install -D tsx"
    exit 1
fi

echo ""
echo "✨ ¡Configuración completada!"
echo ""
echo "🎉 Ahora puedes:"
echo "   1. Iniciar el servidor: npm run dev"
echo "   2. Visitar: http://localhost:3000/configuracion"
echo "   3. Agregar, editar o eliminar configuraciones desde la interfaz"
echo ""
