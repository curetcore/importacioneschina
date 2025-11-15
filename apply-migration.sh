#!/bin/bash
# Script para aplicar la migración manualmente en Easypanel
# Ejecutar desde la terminal de Easypanel: bash apply-migration.sh

echo "🔧 Aplicando migración de configuracion..."
npx prisma migrate deploy

echo ""
echo "🌱 Cargando datos iniciales..."
npx tsx prisma/seed-config.ts

echo ""
echo "✅ Listo! Recarga la página /configuracion"
