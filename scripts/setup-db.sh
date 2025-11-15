#!/bin/bash
# ==========================================
# Script de configuración de base de datos
# Para ejecutar en Easypanel después del deploy
# ==========================================

echo "🔧 Iniciando configuración de base de datos..."

# Generar cliente Prisma
echo "📦 Generando cliente Prisma..."
npx prisma generate

# Crear tablas en la base de datos
echo "🗄️  Creando tablas..."
npx prisma db push --accept-data-loss

# Poblar con datos de prueba
echo "🌱 Poblando base de datos con datos de prueba..."
npm run db:seed

echo "✅ Base de datos configurada exitosamente!"
echo ""
echo "🚀 Tu aplicación está lista para usar en:"
echo "   https://tu-dominio.easypanel.app"
