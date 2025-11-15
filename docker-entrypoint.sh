#!/bin/sh
set -e

echo "================================================"
echo "CURET - Sistema de Importaciones China"
echo "Iniciando en modo PRODUCCIÓN"
echo "================================================"

# Verificar que el build existe
if [ ! -f "server.js" ]; then
  echo "ERROR: server.js no encontrado. El build no se completó correctamente."
  exit 1
fi

# Verificar variables de entorno
if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL no está configurada"
fi

echo "Ejecutando migraciones de base de datos..."
npx prisma migrate deploy || echo "ADVERTENCIA: Migraciones no aplicadas, continuando..."

echo "Iniciando servidor de producción..."
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "================================================"

# Ejecutar servidor de producción (standalone)
exec node server.js
