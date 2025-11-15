#!/bin/bash

# Script para ejecutar DENTRO de Easypanel (en el contenedor de la app)
# Este script usa el host interno que solo funciona dentro de Easypanel

echo "🚢 Cargando datos de prueba en Easypanel..."
echo ""

# Configurar DATABASE_URL con host interno
export DATABASE_URL="postgresql://postgres:Pitagora1844@apps_postgres_sistemadechina:5432/apps?sslmode=disable"

echo "✅ Conectando a PostgreSQL interno de Easypanel"
echo ""

# Generar cliente Prisma
echo "🔨 Generando cliente Prisma..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Error al generar cliente Prisma"
    exit 1
fi

echo "✅ Cliente Prisma generado"
echo ""

# Crear tablas
echo "🗄️  Creando tablas en la base de datos..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Error al crear tablas"
    exit 1
fi

echo "✅ Tablas creadas"
echo ""

# Insertar datos de prueba
echo "🌱 Insertando datos de prueba..."
echo "   - 10 Órdenes de Compra"
echo "   - 20 Pagos"
echo "   - 20-30 Gastos Logísticos"
echo "   - 10 Recepciones de Inventario"
echo ""

npm run db:seed

if [ $? -ne 0 ]; then
    echo "❌ Error al insertar datos de prueba"
    exit 1
fi

echo ""
echo "✅ Datos de prueba insertados exitosamente"
echo ""
echo "🎉 ¡Listo! Los datos ya están en la base de datos"
echo ""
