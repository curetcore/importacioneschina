#!/bin/bash

# Script para inicializar el sistema con datos de prueba
# Este script levanta la base de datos y carga datos de ejemplo

echo "🚀 Iniciando sistema de importaciones..."
echo ""

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    echo "Por favor instala Docker desde: https://docs.docker.com/get-docker/"
    echo ""
    echo "Alternativamente, configura PostgreSQL manualmente:"
    echo "1. Instala PostgreSQL"
    echo "2. Crea una base de datos 'curet-importaciones'"
    echo "3. Actualiza .env con tu DATABASE_URL"
    echo "4. Ejecuta: npm run db:push && npm run db:seed"
    exit 1
fi

# Verificar si docker-compose o docker compose está disponible
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ docker-compose no está disponible"
    echo "Por favor instala docker-compose"
    exit 1
fi

echo "✅ Docker encontrado"
echo ""

# Levantar PostgreSQL
echo "📦 Levantando PostgreSQL..."
$DOCKER_COMPOSE up -d postgres

if [ $? -ne 0 ]; then
    echo "❌ Error al levantar PostgreSQL"
    exit 1
fi

echo "✅ PostgreSQL iniciado"
echo ""

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 5

# Actualizar .env
echo "📝 Configurando variables de entorno..."
cat > .env << 'EOF'
# Base de datos
DATABASE_URL="postgresql://curet_admin:curet_password_dev@localhost:5432/curet_importaciones"

# API
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Modo
NODE_ENV="development"
EOF

echo "✅ .env configurado"
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
    exit 1
fi

echo "✅ Tablas creadas"
echo ""

# Insertar datos de prueba
echo "🌱 Insertando datos de prueba..."
npm run db:seed

if [ $? -ne 0 ]; then
    echo "❌ Error al insertar datos de prueba"
    exit 1
fi

echo "✅ Datos de prueba insertados"
echo ""

echo "🎉 ¡Sistema listo!"
echo ""
echo "Para iniciar el servidor de desarrollo:"
echo "  npm run dev"
echo ""
echo "Para ver los datos en Prisma Studio:"
echo "  npm run prisma:studio"
echo ""
echo "Para detener PostgreSQL:"
echo "  $DOCKER_COMPOSE down"
echo ""
