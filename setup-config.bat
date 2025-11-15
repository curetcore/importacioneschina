@echo off
echo 🚀 Configurando sistema de configuración dinámica...
echo.

echo 📊 Paso 1/2: Creando tabla en la base de datos...
call npx prisma migrate dev --name add_configuracion_table --skip-generate

if errorlevel 1 (
    echo ❌ Error en la migración. Verifica que la base de datos esté corriendo.
    pause
    exit /b 1
)

echo ✅ Tabla creada exitosamente
echo.

echo 🔧 Generando Prisma Client...
call npx prisma generate

if errorlevel 1 (
    echo ❌ Error generando Prisma Client.
    pause
    exit /b 1
)

echo ✅ Prisma Client generado
echo.

echo 📦 Paso 2/2: Cargando configuraciones iniciales...
call npx tsx prisma/seed-config.ts

if errorlevel 1 (
    echo ❌ Error cargando datos. ¿Está instalado tsx?
    echo    Intenta: npm install -D tsx
    pause
    exit /b 1
)

echo.
echo ✨ ¡Configuración completada!
echo.
echo 🎉 Ahora puedes:
echo    1. Iniciar el servidor: npm run dev
echo    2. Visitar: http://localhost:3000/configuracion
echo    3. Agregar, editar o eliminar configuraciones desde la interfaz
echo.
pause
