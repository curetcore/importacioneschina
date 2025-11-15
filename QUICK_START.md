# 🚢 Sistema de Importaciones - Quick Start

## 🚀 Inicio Rápido (Con datos de prueba)

### Opción 1: Usando el script automatizado (Recomendado)

```bash
# Ejecutar el script que configura todo automáticamente
./setup-with-seed.sh
```

Este script:
1. ✅ Levanta PostgreSQL con Docker
2. ✅ Crea las tablas en la base de datos
3. ✅ Inserta datos de prueba (10 OCs, 20 pagos, 20-30 gastos, 10 inventarios)
4. ✅ Configura las variables de entorno

### Opción 2: Paso a paso manual

```bash
# 1. Levantar PostgreSQL
docker-compose up -d postgres

# 2. Esperar 5 segundos
sleep 5

# 3. Configurar .env
cp .env.example .env
# Editar .env si es necesario

# 4. Generar cliente Prisma
npm run prisma:generate

# 5. Crear tablas
npm run db:push

# 6. Insertar datos de prueba
npm run db:seed
```

### Opción 3: Sin Docker (PostgreSQL local o en la nube)

1. Configura PostgreSQL localmente o usa un servicio como:
   - [Supabase](https://supabase.com) (gratis)
   - [Neon](https://neon.tech) (gratis)
   - [Railway](https://railway.app) ($5 crédito)

2. Actualiza `.env` con tu `DATABASE_URL`

3. Ejecuta:
```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

## 🎯 Iniciar la aplicación

```bash
# Servidor de desarrollo
npm run dev

# Abrir en el navegador
# http://localhost:3000
```

## 📊 Ver los datos

```bash
# Abrir Prisma Studio (UI para ver/editar datos)
npm run prisma:studio

# Se abrirá en http://localhost:5555
```

## 🧹 Limpiar y reiniciar

```bash
# Limpiar datos y volver a crear
npm run db:push -- --accept-data-loss
npm run db:seed

# Detener PostgreSQL
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

## 📦 ¿Qué datos de prueba se crean?

- **10 Órdenes de Compra** (OC-2025-001 a OC-2025-010)
- **20 Pagos** (USD, CNY, RD$ con tasas de cambio)
- **20-30 Gastos Logísticos** (Flete, Aduana, Broker, etc.)
- **10 Recepciones de Inventario** (95-98% de lo ordenado)

Ver detalles completos en [SEED_DATA.md](./SEED_DATA.md)

## 🛠️ Scripts útiles

```bash
npm run dev              # Servidor desarrollo
npm run build            # Build producción
npm run start            # Servidor producción
npm run lint             # ESLint
npm run prisma:generate  # Generar cliente Prisma
npm run db:push          # Sincronizar schema
npm run db:seed          # Datos de prueba
npm run prisma:studio    # UI base de datos
```

## 🐳 Docker Compose

```bash
# Levantar solo PostgreSQL
docker-compose up -d postgres

# Levantar todo (PostgreSQL + App)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener todo
docker-compose down

# Levantar Prisma Studio
docker-compose --profile studio up -d prisma-studio
```

## ❓ Problemas comunes

### "Can't reach database server"
- Asegúrate de que PostgreSQL esté corriendo: `docker-compose ps`
- Verifica la conexión en `.env`

### "Error al crear tablas"
- Verifica que el usuario tenga permisos
- Intenta: `docker-compose restart postgres`

### "Puerto 3000 ya está en uso"
- Cambia el puerto en `package.json`: `"dev": "next dev -p 3001"`

### "Puerto 5432 ya está en uso"
- Ya tienes PostgreSQL corriendo localmente
- Detén el servicio local o usa el que ya tienes
- O cambia el puerto en `docker-compose.yml`

## 📚 Documentación completa

Ver [README.md](./README.md) para documentación completa del proyecto.

## 🆘 Soporte

- GitHub Issues: [Reportar problema](https://github.com/curetcore/importacioneschina/issues)
- Email: soporte@curet.com

---

**¡Listo para importar! 🚢**
