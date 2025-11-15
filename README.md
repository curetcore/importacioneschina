<div align="center">

# 🚢 Sistema de importacion

### Sistema web completo para gestionar importaciones desde China con control financiero automático

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19-brightgreen)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

[Características](#-características-principales) •
[Instalación](#-instalación) •
[Deployment](#-deployment-en-easypanel) •
[Docker](#-deployment-con-docker) •
[API](#-api-endpoints)

</div>

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tech Stack](#-tech-stack)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Deployment en Easypanel](#-deployment-en-easypanel)
- [Deployment con Docker](#-deployment-con-docker)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Base de Datos](#-base-de-datos)
- [API Endpoints](#-api-endpoints)
- [Scripts Disponibles](#-scripts-disponibles)
- [Variables de Entorno](#-variables-de-entorno)
- [Datos de Prueba](#-datos-de-prueba)

---

## ✨ Características Principales

<table>
<tr>
<td>

### 💰 Control Financiero Total
- **Multi-Moneda**: USD, CNY, RD$
- **Conversión Automática** con tasas de cambio
- **Cálculo de Comisiones** bancarias
- **Costo Unitario Final** automático

</td>
<td>

### 📊 Dashboard en Tiempo Real
- **7 KPIs Financieros**
- **3 Gráficos Interactivos**
- **Métricas Consolidadas**
- **Filtros Dinámicos**

</td>
</tr>
<tr>
<td>

### 📦 Gestión Completa
- **Órdenes de Compra (OC)**
- **Pagos Multi-Moneda**
- **Gastos Logísticos**
- **Recepción de Inventario**

</td>
<td>

### 🔍 Trazabilidad
- **Seguimiento por OC**
- **Control de Diferencias**
- **Historial Completo**
- **Reportes Detallados**

</td>
</tr>
</table>

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS + shadcn/ui
- **Tables**: TanStack Table (React Table)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **ORM**: Prisma 5.19
- **Database**: PostgreSQL

### DevOps
- **Containerization**: Docker + Docker Compose
- **Deployment**: Easypanel (GitHub Auto-Deploy)
- **Version Control**: Git + GitHub

---

## 📋 Requisitos Previos

- **Node.js** 18+
- **npm** o **yarn**
- **PostgreSQL** 14+ (local o en Easypanel)
- **Docker** (opcional, para deployment)

---

## 🚀 Instalación

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/curetcore/importacioneschina.git
cd importacioneschina
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/curet-importaciones"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4️⃣ Configurar base de datos

```bash
# Generar cliente Prisma
npm run prisma:generate

# Crear tablas
npm run db:push

# Insertar datos de prueba (opcional)
npm run db:seed
```

### 5️⃣ Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) 🎉

---

## 🌐 Deployment en Easypanel

### Opción 1: Deploy Automático (Recomendado)

#### Paso 1: Crear PostgreSQL en Easypanel

1. En Easypanel → **Create** → **Database** → **PostgreSQL**
2. Configuración:
   - Name: `curet-importaciones-db`
   - Version: Latest
   - Username: `curet_admin`
   - Password: (generar uno seguro)
3. **Copiar la cadena de conexión** (`DATABASE_URL`)

#### Paso 2: Crear Aplicación en Easypanel

1. En Easypanel → **Create** → **Application**
2. Configuración:
   - **Source**: GitHub Repository
   - **Repository**: `curetcore/importacioneschina`
   - **Branch**: `main`
   - **Build Type**: Dockerfile

#### Paso 3: Configurar Variables de Entorno

En la sección **Environment Variables**:

```env
DATABASE_URL=postgresql://curet_admin:PASSWORD@postgres-host:5432/curet-importaciones
NEXT_PUBLIC_API_URL=https://tu-app.easypanel.host
NODE_ENV=production
```

#### Paso 4: Deploy

1. Click en **Deploy**
2. Espera a que se construya la imagen Docker
3. Una vez deployado, ejecuta migraciones:

```bash
# En el terminal de Easypanel
npm run prisma:generate
npm run db:push
npm run db:seed  # Opcional: datos de prueba
```

---

## 🐳 Deployment con Docker

### Opción 2: Docker Local o VPS

#### 1️⃣ Usando Docker Compose (Desarrollo)

```bash
# Inicia PostgreSQL + App
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

La app estará en [http://localhost:3000](http://localhost:3000)

#### 2️⃣ Build Manual

```bash
# Build imagen
docker build -t curet-importaciones .

# Run contenedor
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e NEXT_PUBLIC_API_URL="http://localhost:3000" \
  curet-importaciones
```

#### 3️⃣ Docker en Producción

```bash
# Build para producción
docker build --target production -t curet-importaciones:prod .

# Run en producción
docker run -d \
  --name curet-importaciones \
  -p 3000:3000 \
  --restart unless-stopped \
  -e DATABASE_URL="$DATABASE_URL" \
  -e NODE_ENV="production" \
  curet-importaciones:prod
```

---

## 📁 Estructura del Proyecto

```
curet-importaciones/
├── 📂 app/
│   ├── 📂 api/                      # API Routes
│   │   ├── 📂 oc-china/            # Endpoints de OC
│   │   │   └── route.ts           # GET, POST
│   │   ├── 📂 pagos-china/         # Endpoints de Pagos
│   │   ├── 📂 gastos-logisticos/   # Endpoints de Gastos
│   │   ├── 📂 inventario-recibido/ # Endpoints de Inventario
│   │   └── 📂 dashboard/           # Endpoints de Dashboard
│   ├── 📂 (pages)/                 # Páginas Next.js
│   │   ├── 📂 oc-china/
│   │   ├── 📂 pagos-china/
│   │   ├── 📂 gastos-logisticos/
│   │   ├── 📂 inventario-recibido/
│   │   └── 📂 dashboard/
│   ├── layout.tsx                 # Layout principal
│   ├── page.tsx                   # Home page
│   └── globals.css                # Estilos globales
├── 📂 components/                  # Componentes React
│   ├── 📂 layout/                 # Navbar, Sidebar
│   ├── 📂 forms/                  # Formularios
│   ├── 📂 tables/                 # Tablas (TanStack)
│   ├── 📂 dashboard/              # Dashboard components
│   └── 📂 common/                 # Componentes compartidos
├── 📂 lib/                         # Utilidades
│   └── prisma.ts                  # Cliente Prisma
├── 📂 prisma/
│   ├── schema.prisma              # Esquema BD (4 tablas)
│   └── seed.ts                    # Seed data
├── 📂 public/                      # Assets estáticos
├── 📄 Dockerfile                   # Docker config
├── 📄 docker-compose.yml           # Docker Compose
├── 📄 .dockerignore                # Docker ignore
├── 📄 .env.example                 # Template de env vars
├── 📄 package.json                 # Dependencias
└── 📄 README.md                    # Este archivo
```

---

## 🗄️ Base de Datos

### Esquema Prisma (4 Tablas Principales)

#### 1. `oc_china` - Órdenes de Compra

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único |
| `oc` | String | Código OC (ej: OC-2025-001) |
| `proveedor` | String | China 1, China 2, Fábrica X |
| `fecha_oc` | Date | Fecha de la orden |
| `descripcion_lote` | Text | Descripción del lote |
| `categoria_principal` | String | Zapatos, Carteras, etc. |
| `cantidad_ordenada` | Int | Unidades ordenadas |
| `costo_fob_total_usd` | Decimal | Costo FOB en USD |

#### 2. `pagos_china` - Pagos Realizados

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único |
| `id_pago` | String | Código pago (ej: PAG-2025-001) |
| `oc_id` | UUID | FK a oc_china |
| `fecha_pago` | Date | Fecha del pago |
| `tipo_pago` | String | Anticipo, Pago final, etc. |
| `metodo_pago` | String | Transferencia, Tarjeta |
| `moneda` | String | USD, CNY, RD$ |
| `monto_original` | Decimal | Monto en moneda original |
| `tasa_cambio` | Decimal | Tasa de conversión a RD$ |
| `comision_banco_rd` | Decimal | Comisión bancaria en RD$ |
| `monto_rd` | Decimal | **Calculado**: Monto en RD$ |
| `monto_rd_neto` | Decimal | **Calculado**: Monto + comisión |

#### 3. `gastos_logisticos` - Gastos de Importación

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único |
| `id_gasto` | String | Código gasto |
| `oc_id` | UUID | FK a oc_china |
| `fecha_gasto` | Date | Fecha del gasto |
| `tipo_gasto` | String | Flete, Aduana, Broker, etc. |
| `proveedor_servicio` | String | Nombre del proveedor |
| `monto_rd` | Decimal | Monto en RD$ |
| `notas` | Text | Observaciones |

#### 4. `inventario_recibido` - Recepción Física

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único |
| `id_recepcion` | String | Código recepción |
| `oc_id` | UUID | FK a oc_china |
| `fecha_llegada` | Date | Fecha de llegada |
| `bodega_inicial` | String | Bóveda, Piantini, etc. |
| `cantidad_recibida` | Int | Unidades recibidas |
| `costo_unitario_final_rd` | Decimal | **Calculado** |
| `costo_total_recepcion_rd` | Decimal | **Calculado** |

### Relaciones

```
oc_china
  ├── pagos_china[] (1:N, CASCADE)
  ├── gastos_logisticos[] (1:N, CASCADE)
  └── inventario_recibido[] (1:N, CASCADE)
```

---

## 🔌 API Endpoints

### OC China

```http
GET    /api/oc-china              # Lista todas las OC (con paginación)
POST   /api/oc-china              # Crear nueva OC
GET    /api/oc-china/:id          # Obtener OC específica
PATCH  /api/oc-china/:id          # Actualizar OC
DELETE /api/oc-china/:id          # Eliminar OC
```

#### Ejemplo: GET `/api/oc-china`

**Query Parameters:**
- `page`: número de página (default: 1)
- `limit`: elementos por página (default: 20)
- `search`: buscar por código OC
- `proveedor`: filtrar por proveedor

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "oc": "OC-2025-001",
      "proveedor": "China 1",
      "fechaOC": "2025-01-15",
      "cantidadOrdenada": 500,
      "costoFOBTotalUSD": 5000.00,
      "_count": {
        "pagosChina": 2,
        "gastosLogisticos": 3,
        "inventarioRecibido": 1
      }
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "pages": 1,
    "limit": 20
  }
}
```

### Pagos China, Gastos, Inventario

Similar estructura CRUD para:
- `/api/pagos-china`
- `/api/gastos-logisticos`
- `/api/inventario-recibido`

### Dashboard

```http
GET /api/dashboard/resumen         # KPIs y métricas consolidadas
GET /api/dashboard/oc/:id          # Detalle completo de OC con cálculos
```

---

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo (http://localhost:3000) |
| `npm run build` | Build para producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run prisma:generate` | Generar cliente Prisma |
| `npm run db:push` | Sincronizar schema con BD |
| `npm run db:seed` | Insertar datos de prueba |
| `npm run prisma:studio` | Abrir Prisma Studio (UI para BD) |

---

## 🔐 Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
# Base de Datos (REQUERIDO)
DATABASE_URL="postgresql://usuario:password@host:5432/curet-importaciones"

# API URL (REQUERIDO)
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Entorno
NODE_ENV="development"  # o "production"

# Opcional: Puerto personalizado
PORT=3000
```

### Variables para Easypanel

```env
DATABASE_URL=postgresql://curet_admin:PASSWORD@postgres-svc:5432/curet-importaciones
NEXT_PUBLIC_API_URL=https://importaciones.curet.app
NODE_ENV=production
```

---

## 🌱 Datos de Prueba

El script de seed (`prisma/seed.ts`) crea datos realistas:

- ✅ **10 Órdenes de Compra** variadas
- ✅ **20 Pagos** (USD, CNY, RD$)
- ✅ **20-30 Gastos Logísticos** (Flete, Aduana, Broker)
- ✅ **10 Recepciones de Inventario** (95-98% de lo ordenado)

### Ejecutar Seed

```bash
npm run db:seed
```

### Datos generados:
- Proveedores: China 1, China 2, Fábrica X
- Categorías: Zapatos, Carteras, Cinturones, Accesorios
- Bodegas: Bóveda, Piantini, Villa Mella, Oficina
- Tasas de cambio: USD = 58.5 RD$, CNY = 8.2 RD$

---

## 🚧 Roadmap

### ✅ Completado
- [x] Estructura del proyecto
- [x] Esquema de base de datos
- [x] API endpoint de ejemplo (OC China)
- [x] Seed data realista
- [x] Docker support
- [x] Documentación completa

### 🔄 En Desarrollo
- [ ] Endpoints completos (Pagos, Gastos, Inventario)
- [ ] Componentes de UI (Tablas, Formularios)
- [ ] Dashboard con KPIs y gráficos
- [ ] Autenticación (NextAuth)

### 📅 Futuro
- [ ] Exportación a Excel/PDF
- [ ] Integración con Metabase
- [ ] Notificaciones por email
- [ ] App móvil (React Native)
- [ ] Integración con APIs bancarias

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: nueva característica'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es **privado** y pertenece a **Sistema de importacion**.

---

## 📞 Soporte

- **GitHub Issues**: [Reportar un problema](https://github.com/curetcore/importacioneschina/issues)
- **Documentación**: Este README
- **Email**: soporte@curet.com

---

<div align="center">

### 🎯 Desarrollado para Sistema de importacion

**Sistema de Gestión de Importaciones desde China**

[⬆ Volver arriba](#-sistema-de-importacion)

---

**© 2025 Sistema de importacion. Todos los derechos reservados.**

</div>
