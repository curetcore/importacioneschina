#!/bin/bash

echo "🚢 Cargando datos de prueba - Easypanel PostgreSQL"
echo ""

# Verificar que existe .env
if [ ! -f .env ]; then
    echo "❌ No existe archivo .env"
    echo ""
    echo "Crea .env con tu DATABASE_URL de Easypanel:"
    echo ""
    echo "DATABASE_URL=\"postgresql://usuario:password@postgres.easypanel.host:5432/curet_importaciones\""
    echo "NEXT_PUBLIC_API_URL=\"http://localhost:3000\""
    echo "NODE_ENV=\"development\""
    exit 1
fi

# Verificar que DATABASE_URL no esté vacía
if grep -q "TU_DATABASE_URL_DE_EASYPANEL_AQUI" .env; then
    echo "❌ Debes actualizar .env con tu DATABASE_URL de Easypanel"
    echo ""
    echo "1. Ve a tu proyecto en Easypanel"
    echo "2. Copia la DATABASE_URL de PostgreSQL"
    echo "3. Reemplaza en .env"
    exit 1
fi

echo "✅ Archivo .env encontrado"
echo ""

# Generar cliente Prisma
echo "🔨 Generando cliente Prisma..."
npm run prisma:generate

if [ $? -ne 0 ]; then
    echo "❌ Error al generar cliente Prisma"
    exit 1
fi

echo "✅ Cliente Prisma generado"
echo ""

# Crear tablas
echo "🗄️  Creando tablas en la base de datos..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Error al crear tablas"
    echo ""
    echo "Verifica que tu DATABASE_URL sea correcta y que la BD esté corriendo en Easypanel"
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
echo "🎉 ¡Listo! Puedes:"
echo ""
echo "  Ver los datos:       npm run prisma:studio"
echo "  Iniciar la app:      npm run dev"
echo ""
